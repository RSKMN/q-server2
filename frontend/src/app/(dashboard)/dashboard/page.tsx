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
import ChartSkeleton from "@/components/dashboard/ChartSkeleton";
import ActivityPanel from "@/components/dashboard/ActivityPanel";
import ChartsSection from "@/components/dashboard/Charts";
import DatasetInsightsPanel from "@/components/dashboard/DatasetInsightsPanel";
import StatCardSkeleton from "@/components/dashboard/StatCardSkeleton";

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
          setError(err.message || "Failed to load dashboard data");
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
          setExperimentsError(err?.message || "Failed to load experiment count");
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
          setRecentRunsError(err?.message || "Failed to load recent runs");
          setRecentRunsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedDataset, reloadTick]);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col space-y-8 pb-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
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

      {loading && (
        <div className="space-y-6 fade-in-soft">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-[#1e293b] dark:bg-[#0b0f19]">
            <div className="h-4 w-32 rounded-md bg-slate-200 skeleton-shimmer" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <div className="h-3 w-20 rounded-md bg-slate-200 skeleton-shimmer" />
                  <div className="mt-2 h-4 w-32 rounded-md bg-slate-200 skeleton-shimmer" />
                  <div className="mt-2 h-3 w-24 rounded-md bg-slate-200 skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <StatCardSkeleton key={idx} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartSkeleton />
              <ChartSkeleton titleWidthClass="w-28" />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-lg dark:border-[#1e293b] dark:bg-[#0b0f19]">
              <div className="h-4 w-24 rounded-md bg-slate-200 skeleton-shimmer" />
              <div className="mt-6 space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <div className="h-3 w-20 rounded-md bg-slate-200 skeleton-shimmer" />
                    <div className="mt-2 h-4 w-40 rounded-md bg-slate-200 skeleton-shimmer" />
                    <div className="mt-2 h-3 w-32 rounded-md bg-slate-200 skeleton-shimmer" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {hasApiError && !loading && (
        <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-red-600 dark:text-red-400">
              {error || experimentsError || recentRunsError || "Failed to load dashboard data."}
            </p>
            <p className="mt-1 text-xs text-red-500/90 dark:text-red-300/90">
              Showing available data where possible.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-900/40"
          >
            Retry
          </button>
        </div>
      )}

      {stats && !loading && (
        <div className="space-y-8 fade-in-soft">
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
