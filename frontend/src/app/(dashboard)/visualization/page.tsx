"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ChemicalSpaceScatter,
  type ChemicalSpaceColorMode,
} from "@/components/embeddings";
import { ThreeDMoleculeViewer } from "@/components/molecules";
import SimulationViewer from "@/components/simulation/SimulationViewer";
import { Card } from "@/components/ui";
import {
  getPipelineExperiments,
  getPipelineResult,
  type VisualizationEmbeddingPoint,
  type VisualizationMoleculeStructure,
} from "@/services";
import {
  DEMO_GENERATED_MOLECULES,
  DEMO_SIMULATION_RESULTS,
} from "@/services/pipelineDemo";
import type { SimulationResult } from "@/types/api";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function findValue(row: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in row) {
      return row[key];
    }
  }
  return undefined;
}

function extractSection(payload: Record<string, unknown> | null, keys: string[]): unknown[] {
  if (!payload) return [];

  const sources: Array<Record<string, unknown>> = [payload];
  const nested = asRecord(payload.results);
  if (nested) {
    sources.push(nested);
  }

  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (Array.isArray(value)) {
        return value;
      }
    }
  }

  return [];
}

function normalizeMoleculeRows(payload: Record<string, unknown> | null): VisualizationMoleculeStructure[] {
  const generated = extractSection(payload, ["generated", "generated_molecules"])
    .map((row) => ({ row: asRecord(row), source: "generated" }))
    .filter((item) => item.row !== null);
  const filtered = extractSection(payload, ["filtered", "filtered_candidates"])
    .map((row) => ({ row: asRecord(row), source: "filtered" }))
    .filter((item) => item.row !== null);

  const combined = [...generated, ...filtered];
  const seen = new Set<string>();
  const normalized: VisualizationMoleculeStructure[] = [];

  combined.forEach(({ row, source }, index) => {
    if (!row) return;
    const moleculeId = String(findValue(row, ["molecule_id", "candidate_id", "id"]) ?? `${source}-${index + 1}`);
    const smiles = String(findValue(row, ["smiles", "canonical_smiles", "structure"]) ?? "").trim();
    if (!smiles) return;
    if (seen.has(moleculeId)) return;
    seen.add(moleculeId);

    normalized.push({
      molecule_id: moleculeId,
      dataset: source,
      smiles,
      mw: toNumber(findValue(row, ["molecular_weight", "mw"])),
      logp: toNumber(findValue(row, ["logp", "log_p"])),
      qed: toNumber(findValue(row, ["qed", "qed_score"])),
      pdb: "",
    });
  });

  return normalized.slice(0, 5);
}

function buildEmbeddings(molecules: VisualizationMoleculeStructure[]): VisualizationEmbeddingPoint[] {
  return molecules.map((molecule, index) => {
    const angle = (index + 1) * 0.83;
    const radial = 1.0 + (index % 7) * 0.16;
    return {
      molecule_id: molecule.molecule_id,
      dataset: molecule.dataset,
      smiles: molecule.smiles,
      x: Number((Math.cos(angle) * radial + molecule.logp * 0.15).toFixed(3)),
      y: Number((Math.sin(angle) * radial + (molecule.mw - 250) / 500).toFixed(3)),
      activity: Number(Math.max(0, Math.min(1, molecule.qed)).toFixed(3)),
      drugLikeness: Number(Math.max(0, Math.min(1, molecule.qed)).toFixed(3)),
    };
  });
}

function buildDemoMolecules(): VisualizationMoleculeStructure[] {
  return DEMO_GENERATED_MOLECULES.map((molecule) => ({
    molecule_id: molecule.molecule_id,
    dataset: "demo",
    smiles: molecule.smiles,
    mw: molecule.molecular_weight,
    logp: molecule.logp,
    qed: molecule.qed,
    pdb: "",
  })).slice(0, 5);
}

function normalizeSimulationRows(payload: Record<string, unknown> | null): SimulationResult[] {
  const nested = asRecord(payload?.results);
  const simulationNode = asRecord(nested?.simulation) ?? asRecord(payload?.simulation);
  const primaryRmsdRows = Array.isArray(simulationNode?.rmsd) ? simulationNode.rmsd : null;
  const simulationRows =
    primaryRmsdRows ?? extractSection(payload, ["simulation", "simulation_results", "rmsd", "rmsd_results"]);

  return simulationRows
    .map((item, index) => {
      const row = asRecord(item) ?? {};
      return {
        molecule_id: String(findValue(row, ["molecule_id", "candidate_id", "id"]) ?? `sim-${index + 1}`),
        smiles: String(findValue(row, ["smiles", "canonical_smiles", "structure"]) ?? ""),
        time: toNumber(findValue(row, ["time", "ns", "frame"])),
        rmsd: toNumber(findValue(row, ["rmsd", "rmsd_value"])),
      };
    })
    .filter((row) => Number.isFinite(row.time) && Number.isFinite(row.rmsd));
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="viz-subtitle text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>
        {eyebrow}
      </p>
      <h2 className="viz-title text-xl tracking-tight" style={{ color: "var(--text)" }}>{title}</h2>
      <p className="viz-subtitle max-w-3xl text-sm leading-6">{description}</p>
    </div>
  );
}

export default function VisualizationPage() {
  const [selectedMoleculeId, setSelectedMoleculeId] = useState("");
  const [chemicalColorMode, setChemicalColorMode] =
    useState<ChemicalSpaceColorMode>("activity");
  const [embeddings, setEmbeddings] = useState<VisualizationEmbeddingPoint[]>([]);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [molecules, setMolecules] = useState<VisualizationMoleculeStructure[]>([]);
  const [isLoadingVisualization, setIsLoadingVisualization] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrapVisualizationData() {
      try {
        setIsLoadingVisualization(true);
        const experiments = await getPipelineExperiments();
        if (!active) return;

        if (!experiments.length) {
          const demoMolecules = buildDemoMolecules();
          const demoEmbeddings = buildEmbeddings(demoMolecules);
          setEmbeddings(demoEmbeddings);
          setSimulationResults(DEMO_SIMULATION_RESULTS);
          setMolecules(demoMolecules);
          setSelectedMoleculeId(demoEmbeddings[0]?.molecule_id ?? "");
          return;
        }

        const latestExperiment = [...experiments].sort((a, b) => {
          const left = new Date(a.created_at).getTime();
          const right = new Date(b.created_at).getTime();
          return right - left;
        })[0];

        const pipelineResult = await getPipelineResult(latestExperiment.experiment_id);
        if (!active) return;

        const payload = asRecord(pipelineResult);
        const realMolecules = normalizeMoleculeRows(payload);
        const simulationRows = normalizeSimulationRows(payload);
        const useDemoData = realMolecules.length === 0 && simulationRows.length === 0;

        const moleculesToUse = useDemoData ? buildDemoMolecules() : realMolecules;
        const simulationRowsToUse = useDemoData ? DEMO_SIMULATION_RESULTS : simulationRows;
        const embeddingRows = buildEmbeddings(moleculesToUse);

        setEmbeddings(embeddingRows);
        setSimulationResults(simulationRowsToUse);
        setMolecules(moleculesToUse);

        setSelectedMoleculeId((current) => current || embeddingRows[0]?.molecule_id || "");
      } finally {
        if (active) {
          setIsLoadingVisualization(false);
        }
      }
    }

    bootstrapVisualizationData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedMoleculeId && molecules.length > 0) {
      setSelectedMoleculeId(molecules[0].molecule_id);
    }
  }, [molecules, selectedMoleculeId]);

  const selectedMolecule = useMemo(
    () => molecules.find((molecule) => molecule.molecule_id === selectedMoleculeId) ?? null,
    [molecules, selectedMoleculeId],
  );
  const isStructureLoading = isLoadingVisualization && Boolean(selectedMoleculeId) && !selectedMolecule;

  const availableSimulationIds = useMemo(
    () => Array.from(new Set(simulationResults.map((result) => result.molecule_id))),
    [simulationResults],
  );

  const selectedSimulationId = useMemo(() => {
    if (availableSimulationIds.includes(selectedMoleculeId)) {
      return selectedMoleculeId;
    }

    return availableSimulationIds[0] ?? null;
  }, [availableSimulationIds, selectedMoleculeId]);

  const selectedTrajectory = useMemo(() => {
    if (!selectedSimulationId) return [];

    return simulationResults
      .filter((result) => result.molecule_id === selectedSimulationId)
      .slice()
      .sort((a, b) => a.time - b.time);
  }, [selectedSimulationId, simulationResults]);

  const viewerMoleculeOptions = useMemo(
    () =>
      molecules.map((molecule) => ({
        id: molecule.molecule_id,
        label: `${molecule.molecule_id} (${molecule.dataset})`,
        source: { format: "smiles" as const, value: molecule.smiles, label: "SMILES" },
      })),
    [molecules],
  );

  const chemicalSpaceSelectedPoint = useMemo(() => {
    return (
      embeddings.find(
        (point) => point.molecule_id === selectedMoleculeId,
      ) ?? null
    );
  }, [embeddings, selectedMoleculeId]);

  const handleChemicalPointSelect = useCallback(
    (point: { molecule_id: string }) => {
      setSelectedMoleculeId((current) =>
        current === point.molecule_id ? current : point.molecule_id,
      );
    },
    [],
  );

  return (
    <div className="fade-in-soft mx-auto flex w-full max-w-[1480px] flex-col gap-7 pb-12">
      <div
        className="flex flex-col gap-4 rounded-2xl border p-5 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
        style={{
          borderColor: "var(--border)",
          background: "linear-gradient(135deg, color-mix(in srgb, var(--card) 96%, transparent), color-mix(in srgb, var(--bg) 88%, var(--card)))",
          boxShadow: "0 18px 50px rgba(2, 6, 23, 0.12)",
        }}
      >
        <div>
          <h1 className="viz-title text-3xl tracking-tight" style={{ color: "var(--text)" }}>Visualization</h1>
          <p className="viz-subtitle mt-2 max-w-3xl text-sm leading-6">
            Review molecular structure, embedding topology, and simulation stability in a single stacked workspace.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs" style={{ color: "var(--muted-text)" }}>
          <span className="viz-chip rounded-full px-3 py-1">
            3D structure rendering
          </span>
          <span className="viz-chip rounded-full px-3 py-1">
            UMAP chemical space
          </span>
          <span className="viz-chip rounded-full px-3 py-1">
            RMSD trajectory review
          </span>
        </div>
      </div>

      <Card
        className="viz-surface overflow-hidden"
        header={
          <SectionHeading
            eyebrow="Section 1"
            title="3D Molecule Viewer"
            description="Inspect real pipeline molecules in 3D and switch samples from generated and filtered results."
          />
        }
        content={
          <div className="space-y-6 transition-opacity duration-300 ease-out">
            {isLoadingVisualization || isStructureLoading ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                        <div className="h-3 w-20 rounded-md skeleton-shimmer" style={{ background: "color-mix(in srgb, var(--bg) 55%, var(--card))" }} />
                        <div className="mt-2 h-4 w-24 rounded-md skeleton-shimmer" style={{ background: "color-mix(in srgb, var(--bg) 55%, var(--card))" }} />
                      </div>
                    ))}
                  </div>
                  <div className="overflow-hidden rounded-2xl border p-2" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                    <div className="h-[560px] rounded-xl skeleton-shimmer" style={{ background: "color-mix(in srgb, var(--bg) 55%, var(--card))" }} />
                  </div>
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <div key={idx} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                      <div className="h-3 w-24 rounded-md skeleton-shimmer" style={{ background: "color-mix(in srgb, var(--bg) 55%, var(--card))" }} />
                      <div className="mt-3 h-3 w-full rounded-md skeleton-shimmer" style={{ background: "color-mix(in srgb, var(--bg) 55%, var(--card))" }} />
                      <div className="mt-2 h-3 w-4/5 rounded-md skeleton-shimmer" style={{ background: "color-mix(in srgb, var(--bg) 55%, var(--card))" }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedMolecule ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted-text)" }}>
                        Molecule
                      </p>
                      <p className="mt-2 font-mono text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {selectedMolecule.molecule_id}
                      </p>
                    </div>
                    <div className="rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted-text)" }}>
                        Dataset
                      </p>
                      <p className="mt-2 text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {selectedMolecule.dataset}
                      </p>
                    </div>
                    <div className="rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted-text)" }}>
                        Properties
                      </p>
                      <p className="mt-2 text-sm font-semibold" style={{ color: "var(--text)" }}>
                        MW {selectedMolecule.mw.toFixed(1)} | QED {selectedMolecule.qed.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border p-2" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                    <ThreeDMoleculeViewer
                      title={selectedMolecule.molecule_id}
                      subtitle="3D structure preview synchronized with the selected molecule."
                      moleculeOptions={viewerMoleculeOptions}
                      selectedMoleculeId={selectedMoleculeId}
                      onMoleculeSelect={setSelectedMoleculeId}
                      className="min-h-[560px] border-0 bg-transparent shadow-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted-text)" }}>
                      Selected sample
                    </p>
                    <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-text)" }}>
                      The current 3D viewer is linked to {selectedMolecule.molecule_id}. Select a point in the chemical space view to update this molecule and compare its neighborhood.
                    </p>
                  </div>

                  <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted-text)" }}>
                      Quick metadata
                    </p>
                    <dl className="mt-3 grid gap-3 text-sm" style={{ color: "var(--muted-text)" }}>
                      <div className="flex items-center justify-between gap-3">
                        <dt style={{ color: "var(--muted-text)" }}>SMILES</dt>
                        <dd className="text-right font-mono text-xs" style={{ color: "var(--text)" }}>
                          {selectedMolecule.smiles}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt style={{ color: "var(--muted-text)" }}>LogP</dt>
                        <dd style={{ color: "var(--text)" }}>{selectedMolecule.logp.toFixed(2)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt style={{ color: "var(--muted-text)" }}>QED</dt>
                        <dd style={{ color: "var(--text)" }}>{selectedMolecule.qed.toFixed(2)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        }
      />

      <Card
        className="viz-surface overflow-hidden"
        header={
          <SectionHeading
            eyebrow="Section 2"
            title="Chemical Space Visualization"
            description="Explore embeddings derived from real pipeline molecules and click a point to sync the 3D viewer."
          />
        }
        content={
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--muted-text)" }}>
              <span className="viz-chip rounded-full px-3 py-1">
                {embeddings.length} points loaded (real pipeline molecules)
              </span>
              <span className="viz-chip rounded-full px-3 py-1">
                Color by {chemicalColorMode === "activity" ? "Activity" : "Drug-likeness"}
              </span>
              {chemicalSpaceSelectedPoint ? (
                <span className="viz-chip active rounded-full px-3 py-1 text-cyan-900 dark:text-cyan-100">
                  Selected {chemicalSpaceSelectedPoint.molecule_id} | A {chemicalSpaceSelectedPoint.activity.toFixed(2)} | DL {chemicalSpaceSelectedPoint.drugLikeness.toFixed(2)}
                </span>
              ) : (
                <span className="viz-chip rounded-full px-3 py-1">
                  Click a point to sync the molecule viewer
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {([
                { key: "activity", label: "Activity" },
                { key: "drugLikeness", label: "Drug-likeness" },
              ] as const).map((option) => {
                const isActive = chemicalColorMode === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setChemicalColorMode(option.key)}
                    className={`viz-chip rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "active"
                        : "hover:opacity-90"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="viz-glow-soft overflow-hidden rounded-2xl border p-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <ChemicalSpaceScatter
                data={embeddings}
                colorMode={chemicalColorMode}
                selectedMoleculeId={selectedMoleculeId}
                onPointSelect={handleChemicalPointSelect}
                isLoading={isLoadingVisualization}
              />
              <div className="mt-3 rounded-xl border px-3 py-2 text-xs" style={{ borderColor: "var(--border)", background: "var(--muted-bg)", color: "var(--muted-text)" }}>
                Hover for molecule details. Scroll to zoom, drag to pan, and click a point to highlight/select it.
              </div>
            </div>
          </div>
        }
      />

      <Card
        className="viz-surface overflow-hidden"
        header={
          <SectionHeading
            eyebrow="Section 3"
            title="Simulation Viewer"
            description="Review RMSD trajectory playback with play/pause controls and stability status from pipeline outputs."
          />
        }
        content={
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {availableSimulationIds.length > 0 ? (
                availableSimulationIds.map((id) => {
                  const isActive = id === selectedSimulationId;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedMoleculeId(id)}
                      className={`viz-chip rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? "active"
                          : "hover:opacity-90"
                      }`}
                    >
                      {id}
                    </button>
                  );
                })
              ) : (
                <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: "var(--border)", background: "var(--muted-bg)", color: "var(--muted-text)" }}>
                  No simulation trajectories loaded yet
                </span>
              )}
            </div>

            {selectedSimulationId && selectedTrajectory.length > 0 ? (
              <SimulationViewer
                moleculeId={selectedSimulationId}
                frames={selectedTrajectory}
                isLoading={isLoadingVisualization}
              />
            ) : isLoadingVisualization ? (
              <SimulationViewer moleculeId={selectedMoleculeId} frames={[]} isLoading />
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-400">
                No simulation trajectory matched the selected molecule yet.
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}