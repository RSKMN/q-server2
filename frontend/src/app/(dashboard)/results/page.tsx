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
        setError(err instanceof Error ? err.message : "Failed to load results");
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
  }, []);

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

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden pb-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-500/10 to-transparent" />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
            Results Research Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Consolidated evidence across candidate generation, docking, simulation, and quantum analysis.
          </p>
        </div>
      </div>

      <SectionTabs activeSection={activeSection} onChange={setActiveSection} />

      <ResultsFilterBar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        scoreBand={scoreBand}
        onScoreBandChange={setScoreBand}
        stabilityBand={stabilityBand}
        onStabilityBandChange={setStabilityBand}
        onClear={handleClearFilters}
      />

      {error ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-24 rounded-xl bg-slate-900/70 skeleton-shimmer" />
          ))}
        </div>
      ) : null}

      {overview ? <MetricGrid items={metricItems} /> : null}

      {!error ? (
        <div className="space-y-4">
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