"use client";

import { useEffect, useState } from "react";
import { getStats } from "@/services/api";
import { useUiStore } from "@/store";
import type { StatsResponse } from "@/types/api";
import DatasetSelector from "@/components/dashboard/DatasetSelector";
import SummaryCards from "@/components/dashboard/SummaryCards";
import MwDistributionChart from "@/components/dashboard/MwDistributionChart";
import LogpDistributionChart from "@/components/dashboard/LogpDistributionChart";
import ChartCard from "@/components/dashboard/ChartCard";
import ChartSkeleton from "@/components/dashboard/ChartSkeleton";
import QedDistributionChart from "@/components/dashboard/QedDistributionChart";
import TpsaDistributionChart from "@/components/dashboard/TpsaDistributionChart";

export default function DashboardPage() {
  const selectedDataset = useUiStore((s) => s.selectedDataset);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

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

    return () => {
      active = false;
    };
  }, [selectedDataset]);

  return (
    <div className="flex flex-col space-y-8 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Dataset statistics and molecular properties
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden sm:inline-block">Active Dataset:</span>
          <DatasetSelector />
        </div>
      </div>

      {loading && (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-lg dark:border-[#1e293b] dark:bg-[#0b0f19]"
              >
                <div className="h-4 w-24 rounded-md bg-slate-200 skeleton-shimmer" />
                <div className="mt-4 h-8 w-20 rounded-md bg-slate-200 skeleton-shimmer" />
                <div className="mt-3 h-3 w-32 rounded-md bg-slate-200 skeleton-shimmer" />
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton titleWidthClass="w-28" />
            <ChartSkeleton titleWidthClass="w-32" />
            <ChartSkeleton titleWidthClass="w-24" />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/10">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {stats && !loading && !error && (
        <>
          <SummaryCards summary={stats.summary} />

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Molecular Weight Distribution">
              <MwDistributionChart distribution={stats.distributions.mw} />
            </ChartCard>
            <ChartCard title="LogP Distribution">
              <LogpDistributionChart distribution={stats.distributions.logp} />
            </ChartCard>
            <ChartCard title="TPSA Distribution">
              <TpsaDistributionChart distribution={stats.distributions.tpsa} />
            </ChartCard>
            <ChartCard title="QED Distribution">
              <QedDistributionChart distribution={stats.distributions.qed} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
