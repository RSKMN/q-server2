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
  getEmbeddings,
  getMoleculeStructure,
  getSimulationData,
  type VisualizationEmbeddingPoint,
  type VisualizationMoleculeStructure,
} from "@/services";
import type { SimulationResult } from "@/types/api";

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
      <p className="viz-subtitle text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
        {eyebrow}
      </p>
      <h2 className="viz-title text-xl tracking-tight text-slate-100">{title}</h2>
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
  const [structureCache, setStructureCache] = useState<
    Record<string, VisualizationMoleculeStructure>
  >({});
  const [isLoadingVisualization, setIsLoadingVisualization] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrapVisualizationData() {
      try {
        setIsLoadingVisualization(true);
        const [embeddingRows, simulationRows] = await Promise.all([
          getEmbeddings(),
          getSimulationData(),
        ]);
        if (!active) return;

        setEmbeddings(embeddingRows);
        setSimulationResults(simulationRows);

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
    if (!selectedMoleculeId) return;
    if (structureCache[selectedMoleculeId]) return;

    let active = true;

    async function loadStructure() {
      const row = await getMoleculeStructure(selectedMoleculeId);
      if (!active || !row) return;

      setStructureCache((current) => ({
        ...current,
        [selectedMoleculeId]: row,
      }));
    }

    loadStructure();

    return () => {
      active = false;
    };
  }, [selectedMoleculeId, structureCache]);

  const selectedMolecule = selectedMoleculeId
    ? structureCache[selectedMoleculeId] ?? null
    : null;
  const isStructureLoading = Boolean(selectedMoleculeId) && !selectedMolecule;

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
      embeddings.map((molecule) => ({
        id: molecule.molecule_id,
        label: `${molecule.molecule_id} (${molecule.dataset})`,
        source: { format: "smiles" as const, value: molecule.smiles, label: "SMILES" },
      })),
    [embeddings],
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
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/55 to-slate-950/40 p-5 shadow-[0_18px_50px_rgba(2,6,23,0.35)]">
        <div>
          <h1 className="viz-title text-3xl tracking-tight text-slate-100">Visualization</h1>
          <p className="viz-subtitle mt-2 max-w-3xl text-sm leading-6">
            Review molecular structure, embedding topology, and simulation stability in a single stacked workspace.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
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
            description="Inspect a representative molecule in 3D and switch samples from the built-in dropdown."
          />
        }
        content={
          <div className="space-y-6 transition-opacity duration-300 ease-out">
            {isLoadingVisualization || isStructureLoading ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                        <div className="h-3 w-20 rounded-md bg-white/10 skeleton-shimmer" />
                        <div className="mt-2 h-4 w-24 rounded-md bg-white/10 skeleton-shimmer" />
                      </div>
                    ))}
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 p-2">
                    <div className="h-[560px] rounded-xl bg-white/10 skeleton-shimmer" />
                  </div>
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <div key={idx} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <div className="h-3 w-24 rounded-md bg-white/10 skeleton-shimmer" />
                      <div className="mt-3 h-3 w-full rounded-md bg-white/10 skeleton-shimmer" />
                      <div className="mt-2 h-3 w-4/5 rounded-md bg-white/10 skeleton-shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedMolecule ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Molecule
                      </p>
                      <p className="mt-2 font-mono text-sm font-semibold text-slate-100">
                        {selectedMolecule.molecule_id}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Dataset
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-100">
                        {selectedMolecule.dataset}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Properties
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-100">
                        MW {selectedMolecule.mw.toFixed(1)} | QED {selectedMolecule.qed.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 p-2">
                    <ThreeDMoleculeViewer
                      title={selectedMolecule.molecule_id}
                      subtitle="3D structure preview synchronized with the selected molecule."
                      moleculeOptions={viewerMoleculeOptions}
                      selectedMoleculeId={selectedMoleculeId}
                      onMoleculeSelect={setSelectedMoleculeId}
                      className="min-h-[560px] border-0 bg-transparent shadow-none dark:bg-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Selected sample
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      The current 3D viewer is linked to {selectedMolecule.molecule_id}. Select a point in the chemical space view to update this molecule and compare its neighborhood.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Quick metadata
                    </p>
                    <dl className="mt-3 grid gap-3 text-sm text-slate-300">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-slate-500">SMILES</dt>
                        <dd className="text-right font-mono text-xs text-slate-200">
                          {selectedMolecule.smiles}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-slate-500">LogP</dt>
                        <dd className="text-slate-200">{selectedMolecule.logp.toFixed(2)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-slate-500">QED</dt>
                        <dd className="text-slate-200">{selectedMolecule.qed.toFixed(2)}</dd>
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
            description="Explore the UMAP projection of molecular embeddings and click a point to sync the 3D viewer."
          />
        }
        content={
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="viz-chip rounded-full px-3 py-1">
                {embeddings.length} points loaded (placeholder)
              </span>
              <span className="viz-chip rounded-full px-3 py-1">
                Color by {chemicalColorMode === "activity" ? "Activity" : "Drug-likeness"}
              </span>
              {chemicalSpaceSelectedPoint ? (
                <span className="viz-chip active rounded-full px-3 py-1 text-cyan-100">
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
                        : "hover:bg-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="viz-glow-soft overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50 p-3">
              <ChemicalSpaceScatter
                data={embeddings}
                colorMode={chemicalColorMode}
                selectedMoleculeId={selectedMoleculeId}
                onPointSelect={handleChemicalPointSelect}
                isLoading={isLoadingVisualization}
              />
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
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
            description="Review RMSD trajectory playback with play/pause controls and stability status from mock simulation data."
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
                          : "hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {id}
                    </button>
                  );
                })
              ) : (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
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
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-400">
                No simulation trajectory matched the selected molecule yet.
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}