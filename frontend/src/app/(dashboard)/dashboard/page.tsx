"use client";

import { useEffect, useState } from "react";
import {
  getDataset,
  getDatasets,
  getExperimentSummary,
  getRecentRuns,
} from "@/services/api";
import { useUiStore } from "@/store";
import type { RecentRun } from "@/types/api";
import DatasetSelector from "@/components/dashboard/DatasetSelector";
import SummaryCards from "@/components/dashboard/SummaryCards";
import ActivityPanel from "@/components/dashboard/ActivityPanel";
import ChartsSection from "@/components/dashboard/Charts";
import DatasetInsightsPanel from "@/components/dashboard/DatasetInsightsPanel";
import RankingsTable from "@/components/dashboard/RankingsTable";
import { DashboardPageSkeleton } from "@/components/shared/skeletons";
import { ApiErrorState } from "@/components/shared/states";
import { toFriendlyErrorMessage } from "@/services/api";

export default function DashboardPage() {
  const selectedDataset = useUiStore((s) => s.selectedDataset);
  const setSelectedDataset = useUiStore((s) => s.setSelectedDataset);
  const [reloadTick, setReloadTick] = useState(0);
  const [datasetNames, setDatasetNames] = useState<string[]>([]);
  const [totalDatasets, setTotalDatasets] = useState(0);
  const [totalMolecules, setTotalMolecules] = useState<number | null>(null);
  const [experimentCount, setExperimentCount] = useState<number | null>(null);
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [experimentsLoading, setExperimentsLoading] = useState(true);
  const [experimentsError, setExperimentsError] = useState<string | null>(null);
  const [recentRunsLoading, setRecentRunsLoading] = useState(true);
  const [recentRunsError, setRecentRunsError] = useState<string | null>(null);

  const activeDatasetLabel = selectedDataset ?? datasetNames[0] ?? "All Datasets";
  const hasApiError = Boolean(error || experimentsError || recentRunsError);
  const dashboardError = error || experimentsError || recentRunsError;

  function handleRetry() {
    setReloadTick((prev) => prev + 1);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setExperimentsLoading(true);
    setExperimentsError(null);
    setRecentRunsLoading(true);
    setRecentRunsError(null);

    getDatasets()
      .then(async (data) => {
        if (!active) {
          return;
        }

        setDatasetNames(data.datasets);
        setTotalDatasets(data.count);

        const resolvedDataset =
          selectedDataset && data.datasets.includes(selectedDataset)
            ? selectedDataset
            : data.datasets[0] ?? null;
        if (resolvedDataset && resolvedDataset !== selectedDataset) {
          setSelectedDataset(resolvedDataset);
        }

        if (!resolvedDataset) {
          setTotalMolecules(null);
          return;
        }

        const datasetDetails = await getDataset(resolvedDataset);
        if (active) {
          setTotalMolecules(datasetDetails.count);
        }
      })
      .catch((err) => {
        if (active) {
          setDatasetNames([]);
          setTotalDatasets(0);
          setTotalMolecules(null);
          setError(toFriendlyErrorMessage(err, "Dataset data is temporarily unavailable."));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    getExperimentSummary()
      .then((data) => {
        if (active) {
          setExperimentCount(data.experiment_count);
          setExperimentsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setExperimentCount(null);
          setExperimentsError(toFriendlyErrorMessage(err, "Experiment metrics are not available right now."));
          setExperimentsLoading(false);
        }
      });

    getRecentRuns(10)
      .then((data) => {
        if (active) {
          setRecentRuns(data.items ?? []);
          setRecentRunsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setRecentRuns([]);
          setRecentRunsError(toFriendlyErrorMessage(err, "Recent activity could not be loaded."));
          setRecentRunsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedDataset, reloadTick, setSelectedDataset]);

  return (
    <div className="page-shell ui-fade-in">
      <div className="ui-state-transition flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title" style={{ color: "var(--text)" }}>
            Dashboard
          </h1>
          <p className="page-subtitle mt-2" style={{ color: "var(--muted-text)" }}>
            Dataset statistics and molecular properties
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] sm:inline-block" style={{ color: "var(--muted-text)" }}>
            Active Dataset:
          </span>
          <DatasetSelector />
        </div>
      </div>

      {loading ? <DashboardPageSkeleton /> : null}

      {hasApiError && !loading && (
        <ApiErrorState
          error={dashboardError}
          onRetry={handleRetry}
          title="Dashboard is partially unavailable"
          fallbackMessage="Some dashboard sections are temporarily unavailable."
        />
      )}

      {!loading && (
        <div className="space-y-8 fade-in-soft ui-state-transition">
          <DatasetInsightsPanel
            totalDatasets={totalDatasets}
            activeDataset={activeDatasetLabel}
            totalMolecules={totalMolecules}
          />

          <section className="space-y-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted-text)" }}>
                Metrics
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                Overview
              </h2>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--muted-text)" }}>
                Core metrics for the currently selected dataset.
              </p>
            </div>
            <SummaryCards
              totalMolecules={totalMolecules}
              totalDatasets={totalDatasets}
              experimentCount={experimentCount}
              experimentsLoading={experimentsLoading}
              experimentsError={experimentsError}
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted-text)" }}>
                  Visualization
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                  Charts
                </h2>
                <p className="mt-1 text-sm leading-6" style={{ color: "var(--muted-text)" }}>
                  Distribution views for key molecular properties.
                </p>
              </div>

              <ChartsSection />
            </section>

            <ActivityPanel
              recentRuns={recentRuns}
              loading={recentRunsLoading}
              error={recentRunsError}
            />
          </div>

          <section className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted-text)" }}>
                Pipeline Results
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                Lead Optimization Rankings
              </h2>
            </div>
            <RankingsTable />
          </section>

          <section className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted-text)" }}>
                Workflow
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                Research Pipeline Timeline
              </h2>
            </div>
            <div className="ui-card-surface p-10 flex items-center justify-between overflow-x-auto gap-8">
              {[
                { label: "Target Prep", status: "completed" },
                { label: "Ligand Screening", status: "completed" },
                { label: "Docking Prep", status: "active" },
                { label: "MD Simulation", status: "pending" },
                { label: "QM Reranking", status: "pending" },
                { label: "Validation", status: "pending" },
              ].map((step, i, arr) => (
                <div key={i} className="flex items-center gap-8 min-w-fit">
                  <div className="flex flex-col items-center gap-3">
                    <div className={`h-12 w-12 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all duration-500 shadow-lg ${
                      step.status === 'completed' ? 'border-success bg-success/10 text-success' : 
                      step.status === 'active' ? 'border-primary bg-primary animate-pulse text-white ring-4 ring-primary/20 shadow-primary/40' : 
                      'border-border/40 bg-surface-subtle/30 text-text-secondary/40'
                    }`}>
                      {step.status === 'completed' ? '✓' : i + 1}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      step.status === 'active' ? 'text-primary' : 'text-text-secondary/60'
                    }`}>{step.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`h-0.5 w-16 md:w-24 rounded-full ${
                      step.status === 'completed' ? 'bg-success/40' : 'bg-border/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
