"use client";

import type { RecentRun } from "@/types/api";

interface ActivityPanelProps {
  recentRuns: RecentRun[];
  loading: boolean;
  error: string | null;
}

type ExperimentStatus = "running" | "completed" | "failed" | "queued" | "unknown";

interface ActivityItem {
  id: string;
  experiment: string;
  status: ExperimentStatus;
  timestamp: string;
  details: string;
}

function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }
  return date.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeStatus(status: string): ExperimentStatus {
  const normalized = status.trim().toLowerCase();
  if (normalized === "running") return "running";
  if (normalized === "completed" || normalized === "ok" || normalized === "success") return "completed";
  if (normalized === "failed" || normalized === "error") return "failed";
  if (normalized === "queued" || normalized === "pending") return "queued";
  return "unknown";
}

function getStatusBadgeClass(status: ExperimentStatus): string {
  if (status === "running") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
  }
  if (status === "failed") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";
  }
  if (status === "queued") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300";
  }
  if (status === "unknown") {
    return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
}

function buildActivityItems(recentRuns: RecentRun[]): ActivityItem[] {
  return recentRuns.map((run) => {
    const status = normalizeStatus(run.status);
    return {
      id: run.run_id,
      experiment: run.experiment_name,
      status,
      timestamp: formatTimestamp(run.created_at),
      details: `Dataset: ${run.dataset_name}`,
    };
  });
}

export default function ActivityPanel({ recentRuns, loading, error }: ActivityPanelProps) {
  const items = buildActivityItems(recentRuns);
  const runningCount = items.filter((item) => item.status === "running").length;

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-lg transition-all duration-200 hover:shadow-xl dark:border-[#1e293b] dark:bg-[#0b0f19]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-[0.01em] text-slate-900 dark:text-slate-100">
            Activity
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Recent experiments and execution state
          </p>
        </div>
        <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
          {loading ? "Loading" : `${runningCount} running`}
        </span>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-300/70 bg-rose-50/80 p-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <div className="h-3 w-28 rounded-md bg-slate-200 skeleton-shimmer" />
              <div className="mt-2 h-3 w-24 rounded-md bg-slate-200 skeleton-shimmer" />
              <div className="mt-2 h-3 w-20 rounded-md bg-slate-200 skeleton-shimmer" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <div className="rounded-lg border border-slate-200/90 bg-slate-50/80 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
          No recent experiment runs found.
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-slate-200/90 bg-slate-50/80 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-100/90 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-900/95"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.experiment}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {item.details}
                </p>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  {item.timestamp}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ring-current/10 ${getStatusBadgeClass(item.status)}`}
              >
                {item.status}
              </span>
            </div>
          </div>
        ))}
        </div>
      ) : null}
    </aside>
  );
}
