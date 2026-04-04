"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getDockingResults,
  getGeneratedMolecules,
  getRankedCandidates,
  getResultArtifacts,
  getResultsOverview,
  getSimulationResults,
  getQuantumResults,
} from "@/services/api";
import type {
  DockingResult,
  RankedCandidatesResponse,
  GeneratedMoleculeResult,
  ResultArtifactsResponse,
  ResultArtifact,
  QuantumResult,
  ResultsOverview,
  SimulationResult,
} from "@/types/api";
import { ArtifactGrid } from "./components/artifact-grid";
import { FilteredCandidatesSection } from "./components/filtered-candidates-section";
import { DockingResultsTable } from "./components/docking-results-table";
import { GeneratedMoleculesTable } from "./components/generated-molecules-table";
import { ResultsFilterBar } from "./components/results-filter-bar";
import type { ScoreBand, StabilityBand } from "./components/results-filter-types";
import { MetricGrid } from "./components/metric-grid";
import { SimulationResultsSection } from "./components/simulation-results-section";
import { QuantumResultsSection } from "./components/quantum-results-section";
import { SectionTabs } from "./components/section-tabs";
import { type ResultSection } from "./components/results-types";
import { ResultsPageSkeleton } from "@/components/shared/skeletons";
import { ApiErrorState } from "@/components/shared/states";
import { EmptyState } from "@/components/shared/states";
import { toFriendlyErrorMessage } from "@/services/api";

function filterArtifacts(items: ResultArtifact[], keywords: string[]): ResultArtifact[] {
  return items.filter((artifact) => {
    const searchable = `${artifact.name} ${artifact.path}`.toLowerCase();
    return keywords.some((keyword) => searchable.includes(keyword));
  });
}

export default function ResultsPage() {
  const [activeSection, setActiveSection] = useState<ResultSection>("generated");
  const [searchQuery, setSearchQuery] = useState("");
  const [scoreBand, setScoreBand] = useState<ScoreBand>("all");
  const [stabilityBand, setStabilityBand] = useState<StabilityBand>("all");
  const [overview, setOverview] = useState<ResultsOverview | null>(null);
  const [generatedMolecules, setGeneratedMolecules] = useState<GeneratedMoleculeResult[]>([]);
  const [dockingResults, setDockingResults] = useState<DockingResult[]>([]);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [quantumResults, setQuantumResults] = useState<QuantumResult[]>([]);
  const [filteredRanked, setFilteredRanked] = useState<RankedCandidatesResponse | null>(null);
  const [artifacts, setArtifacts] = useState<ResultArtifactsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadResults() {
      try {
        setLoading(true);
        setError(null);

        const [
          overviewData,
          generatedData,
          dockingData,
          simulationData,
          quantumData,
          filteredData,
          artifactsData,
        ] = await Promise.all([
          getResultsOverview(),
          getGeneratedMolecules(25),
          getDockingResults(25),
          getSimulationResults(60),
          getQuantumResults(25),
          getRankedCandidates("existing", 25),
          getResultArtifacts(120),
        ]);

        if (!active) return;
        setOverview(overviewData);
        setGeneratedMolecules(generatedData);
        setDockingResults(dockingData);
        setSimulationResults(simulationData);
        setQuantumResults(quantumData);
        setFilteredRanked(filteredData);
        setArtifacts(artifactsData);
      } catch (err) {
        if (!active) return;
        setError(toFriendlyErrorMessage(err, "Results are temporarily unavailable."));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadResults();
    return () => {
      active = false;
    };
  }, [reloadTick]);

  function handleRetry() {
    setReloadTick((prev) => prev + 1);
  }

  function handleClearFilters() {
    setSearchQuery("");
    setScoreBand("all");
    setStabilityBand("all");
  }

  const metricItems = useMemo(() => {
    if (!overview) return [] as Array<{ label: string; value: string | number }>;
    return Object.entries(overview.counts).map(([key, value]) => ({
      label: key.replace(/_/g, " "),
      value,
    }));
  }, [overview]);

  const dockingArtifacts = useMemo(
    () => filterArtifacts(artifacts?.items ?? [], ["dock", "docking", "vina", "pose"]),
    [artifacts]
  );

  const simulationArtifacts = useMemo(
    () => filterArtifacts(artifacts?.items ?? [], ["md", "rmsd", "stability", "traj", "simulation"]),
    [artifacts]
  );

  const quantumArtifacts = useMemo(
    () => filterArtifacts(artifacts?.items ?? [], ["qm", "quantum", "dft", "energy", "homo", "lumo"]),
    [artifacts]
  );

  const hasAnyResults =
    generatedMolecules.length > 0 ||
    dockingResults.length > 0 ||
    simulationResults.length > 0 ||
    quantumResults.length > 0 ||
    (filteredRanked?.items?.length ?? 0) > 0;

  return (
    <div className="page-shell ui-fade-in relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-500/10 to-transparent" />

      <div className="ui-state-transition relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title text-slate-100 sm:text-3xl">
            Results Research Dashboard
          </h1>
          <p className="page-subtitle mt-1 text-slate-400">
            Consolidated evidence across candidate generation, docking, simulation, and quantum analysis.
          </p>
        </div>
      </div>

      <div className="ui-state-transition">
        <SectionTabs activeSection={activeSection} onChange={setActiveSection} />
      </div>

      <div className="ui-state-transition">
        <ResultsFilterBar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          scoreBand={scoreBand}
          onScoreBandChange={setScoreBand}
          stabilityBand={stabilityBand}
          onStabilityBandChange={setStabilityBand}
          onClear={handleClearFilters}
        />
      </div>

      {error ? (
        <ApiErrorState
          error={error}
          onRetry={handleRetry}
          title="Results are taking a little longer"
          fallbackMessage="We could not load the latest results yet."
        />
      ) : null}

      {loading ? <ResultsPageSkeleton /> : null}

      {overview ? <MetricGrid items={metricItems} /> : null}

      {!loading && !error && !hasAnyResults ? (
        <EmptyState
          title="No results available"
          description="Run pipeline to see data and compare candidates across stages."
          ctaLabel="Go to Workspace"
          ctaHref="/workspace"
          className="min-h-[260px]"
        />
      ) : null}

      {!error ? (
        <div className="ui-state-transition space-y-4">
          {activeSection === "generated" ? (
            <GeneratedMoleculesTable
              items={generatedMolecules}
              searchQuery={searchQuery}
              scoreBand={scoreBand}
              stabilityBand={stabilityBand}
              loading={loading}
            />
          ) : null}

          {activeSection === "filtered" ? (
            <FilteredCandidatesSection
              rows={filteredRanked?.items ?? []}
              searchQuery={searchQuery}
              scoreBand={scoreBand}
              stabilityBand={stabilityBand}
              loading={loading}
            />
          ) : null}

          {activeSection === "docking" ? (
            <>
              <DockingResultsTable
                items={dockingResults}
                searchQuery={searchQuery}
                scoreBand={scoreBand}
                stabilityBand={stabilityBand}
                loading={loading}
              />
              {!loading ? (
                <ArtifactGrid
                  title={`Docking Artifacts (${dockingArtifacts.length})`}
                  subtitle="Pose files, scoring outputs, and docked structure artifacts."
                  items={dockingArtifacts}
                />
              ) : null}
            </>
          ) : null}

          {activeSection === "simulation" ? (
            <>
              <SimulationResultsSection
                items={simulationResults}
                searchQuery={searchQuery}
                scoreBand={scoreBand}
                stabilityBand={stabilityBand}
                loading={loading}
              />
              {!loading ? (
                <ArtifactGrid
                  title={`Simulation Artifacts (${simulationArtifacts.length})`}
                  subtitle="Trajectory summaries, RMSD exports, and MD analysis files."
                  items={simulationArtifacts}
                />
              ) : null}
            </>
          ) : null}

          {activeSection === "quantum" ? (
            <>
              <QuantumResultsSection
                items={quantumResults}
                searchQuery={searchQuery}
                scoreBand={scoreBand}
                stabilityBand={stabilityBand}
                loading={loading}
              />
              {!loading ? (
                <ArtifactGrid
                  title={`Quantum Artifacts (${quantumArtifacts.length})`}
                  subtitle="QM logs, descriptor tables, and electronic property exports."
                  items={quantumArtifacts}
                />
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}