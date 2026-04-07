"use client";

import { useEffect, useState } from "react";

import { ApiErrorState, EmptyState } from "@/components/shared/states";
import { ResultsPageSkeleton } from "@/components/shared/skeletons";
import { getPipelineExperiments, getPipelineResult, toFriendlyErrorMessage } from "@/services";
import {
  DEMO_SIMULATION_RESULTS,
  DEMO_VIDEO_URL,
  getDemoPipelinePayload,
} from "@/services/pipelineDemo";
import type { SimulationResult } from "@/types/api";
import { SimulationResultsSection } from "../results/components/simulation-results-section";

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

function extractSimulationRows(payload: Record<string, unknown> | null): SimulationResult[] {
  if (!payload) return [];

  const nested = asRecord(payload.results);
  const simulationNode = asRecord(nested?.simulation) ?? asRecord(payload.simulation);
  const rawRows = Array.isArray(simulationNode?.rmsd)
    ? simulationNode?.rmsd
    : Array.isArray(nested?.simulation_results)
      ? nested?.simulation_results
      : [];

  return rawRows
    .map((item, index) => {
      const row = asRecord(item) ?? {};
      return {
        molecule_id: String(findValue(row, ["molecule_id", "candidate_id", "id"]) ?? `sim-${index + 1}`),
        smiles: String(findValue(row, ["smiles", "canonical_smiles", "structure"]) ?? ""),
        time: toNumber(findValue(row, ["time", "ns", "frame"])),
        rmsd: toNumber(findValue(row, ["rmsd", "rmsd_value"])),
      } satisfies SimulationResult;
    })
    .filter((item) => Number.isFinite(item.time) && Number.isFinite(item.rmsd));
}

function extractVideoUrl(payload: Record<string, unknown> | null): string | null {
  const nested = asRecord(payload?.results);
  const nestedVideo = nested?.simulation_video;
  if (typeof nestedVideo === "string" && nestedVideo.trim()) {
    return nestedVideo;
  }
  const directVideo = payload?.simulation_video;
  if (typeof directVideo === "string" && directVideo.trim()) {
    return directVideo;
  }
  return null;
}

export default function SimulationPage() {
  const [rows, setRows] = useState<SimulationResult[]>([]);
  const [simulationVideoUrl, setSimulationVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const experiments = await getPipelineExperiments();
        if (!active) return;

        if (!experiments.length) {
          setRows(DEMO_SIMULATION_RESULTS);
          setSimulationVideoUrl(DEMO_VIDEO_URL);
          return;
        }

        const latest = [...experiments].sort((a, b) => {
          const left = new Date(a.created_at).getTime();
          const right = new Date(b.created_at).getTime();
          return right - left;
        })[0];

        const payload = asRecord(await getPipelineResult(latest.experiment_id));
        if (!active) return;

        const extractedRows = extractSimulationRows(payload);
        const extractedVideo = extractVideoUrl(payload);

        if (extractedRows.length === 0) {
          const demoPayload = asRecord(getDemoPipelinePayload(latest.experiment_id));
          setRows(extractSimulationRows(demoPayload));
          setSimulationVideoUrl(extractVideoUrl(demoPayload) ?? DEMO_VIDEO_URL);
          return;
        }

        setRows(extractedRows);
        setSimulationVideoUrl(extractedVideo);
      } catch (err) {
        if (!active) return;
        setRows(DEMO_SIMULATION_RESULTS);
        setSimulationVideoUrl(DEMO_VIDEO_URL);
        setError(toFriendlyErrorMessage(err, "Simulation data could not be loaded. Showing demo data."));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [reloadTick]);

  return (
    <div className="page-shell space-y-6">
      <header className="page-header">
        <p className="page-kicker" style={{ color: "var(--accent)" }}>Simulation</p>
        <h1 className="page-title" style={{ color: "var(--text)" }}>Simulation Workspace</h1>
        <p className="page-subtitle" style={{ color: "var(--muted-text)" }}>
          RMSD stability tracking and trajectory playback for the latest experiment run.
        </p>
      </header>

      {error ? (
        <ApiErrorState
          error={error}
          onRetry={() => setReloadTick((tick) => tick + 1)}
          title="Simulation data is temporarily unavailable"
          fallbackMessage="We could not load live simulation output right now."
        />
      ) : null}

      {loading ? <ResultsPageSkeleton /> : null}

      {!loading && rows.length === 0 ? (
        <EmptyState
          title="No simulation output yet"
          description="Run the pipeline from Workspace to generate simulation trajectories."
          ctaLabel="Go to Workspace"
          ctaHref="/workspace"
        />
      ) : null}

      {!loading && rows.length > 0 ? (
        <SimulationResultsSection
          items={rows}
          simulationVideoUrl={simulationVideoUrl}
          searchQuery=""
          scoreBand="all"
          stabilityBand="all"
        />
      ) : null}
    </div>
  );
}
