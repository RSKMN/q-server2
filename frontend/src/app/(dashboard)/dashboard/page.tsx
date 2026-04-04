"use client";

import { useEffect, useState } from "react";
import {
  getDatasets,
  getExperimentSummary,
  getRecentRuns,
  getStats,
} from "@/services/api";
import { useUiStore } from "@/store";
import type { RecentRun, StatsResponse } from "@/types/api";
import DatasetSelector from "@/components/dashboard/DatasetSelector";
import SummaryCards from "@/components/dashboard/SummaryCards";
import ActivityPanel from "@/components/dashboard/ActivityPanel";
import ChartsSection from "@/components/dashboard/Charts";
import DatasetInsightsPanel from "@/components/dashboard/DatasetInsightsPanel";
import { DashboardPageSkeleton } from "@/components/shared/skeletons";
import { ApiErrorState } from "@/components/shared/states";
import { toFriendlyErrorMessage } from "@/services/api";

export default function DashboardPage() {
  const selectedDataset = useUiStore((s) => s.selectedDataset);
  const [reloadTick, setReloadTick] = useState(0);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [totalDatasets, setTotalDatasets] = useState(0);
  const [experimentCount, setExperimentCount] = useState<number | null>(null);
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [experimentsLoading, setExperimentsLoading] = useState(true);
  const [experimentsError, setExperimentsError] = useState<string | null>(null);
  const [recentRunsLoading, setRecentRunsLoading] = useState(true);
  const [recentRunsError, setRecentRunsError] = useState<string | null>(null);

  const activeDatasetLabel = selectedDataset ?? stats?.dataset ?? "All Datasets";
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

    getStats(selectedDataset ?? undefined)
      .then((data) => {
        if (active) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(toFriendlyErrorMessage(err, "Dashboard data is temporarily unavailable."));
          setLoading(false);
        }
      });

    getDatasets()
      .then((datasets) => {
        if (active) {
          setTotalDatasets(datasets.length);
        }
      })
      .catch(() => {
        if (active) {
          setTotalDatasets(0);
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
  }, [selectedDataset, reloadTick]);

  return (
    <div className="page-shell ui-fade-in">
      <div className="ui-state-transition flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title text-slate-900 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="page-subtitle mt-2 text-slate-500 dark:text-slate-400">
            Dataset statistics and molecular properties
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 sm:inline-block">
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

      {stats && !loading && (
        <div className="space-y-8 fade-in-soft ui-state-transition">
          <DatasetInsightsPanel
            totalDatasets={totalDatasets}
            activeDataset={activeDatasetLabel}
            summary={stats.summary}
          />

          <section className="space-y-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Metrics
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Overview
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Core metrics for the currently selected dataset.
              </p>
            </div>
            <SummaryCards
              summary={stats.summary}
              experimentCount={experimentCount}
              experimentsLoading={experimentsLoading}
              experimentsError={experimentsError}
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Visualization
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Charts
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
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
        </div>
      )}
    </div>
  );
}
