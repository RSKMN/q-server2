"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getPipelineExperiments,
  toFriendlyErrorMessage,
  type PipelineExperimentItem,
} from "@/services/api";
import { EmptyState, ApiErrorState } from "@/components/shared/states";
import { SkeletonTable } from "@/components/shared/skeletons";

type DateSort = "desc" | "asc";

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusClassName(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "completed") {
    return "border-emerald-400/40 bg-emerald-500/20 text-emerald-100";
  }
  if (normalized === "running" || normalized === "created" || normalized === "started") {
    return "border-amber-400/40 bg-amber-500/20 text-amber-100";
  }
  if (normalized === "failed" || normalized === "error") {
    return "border-rose-400/40 bg-rose-500/20 text-rose-100";
  }
  return "border-slate-400/30 bg-slate-600/20 text-slate-200";
}

export default function HistoryPage() {
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState<DateSort>("desc");
  const [experiments, setExperiments] = useState<PipelineExperimentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadExperiments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const rows = await getPipelineExperiments();
        if (!active) return;
        setExperiments(rows);
      } catch (err) {
        if (!active) return;
        setError(toFriendlyErrorMessage(err, "Failed to load experiment history."));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadExperiments();

    return () => {
      active = false;
    };
  }, []);

  const sortedExperiments = useMemo(() => {
    return [...experiments].sort((a, b) => {
      const left = new Date(a.created_at).getTime();
      const right = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? right - left : left - right;
    });
  }, [experiments, sortOrder]);

  return (
    <div className="mx-auto flex w-full max-w-[1450px] flex-col gap-7 pb-10 fade-in-soft">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>Research Log</p>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>Experiment List</h1>
        <p className="max-w-2xl text-sm leading-6" style={{ color: "var(--muted-text)" }}>
          Real-time history from the backend pipeline API.
        </p>
      </header>

      {error ? (
        <ApiErrorState
          error={error}
          onRetry={() => router.refresh()}
          title="Could not load experiment history"
          fallbackMessage="Please retry in a moment."
        />
      ) : null}

      {isLoading ? <SkeletonTable columns={4} rows={8} /> : null}

      {!isLoading ? (
        <section className="rounded-2xl border p-3 shadow-[0_10px_36px_-22px_rgba(15,23,42,0.7)]" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
          {sortedExperiments.length === 0 ? (
            <EmptyState
              title="No experiments yet"
              description="Run the pipeline to populate backend experiment history."
              ctaLabel="Go to Workspace"
              ctaHref="/workspace"
              className="min-h-[320px]"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.13em]" style={{ color: "var(--muted-text)" }}>
                    <th className="px-3 py-3 font-medium">Experiment ID</th>
                    <th className="px-3 py-3 font-medium">Protein</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">
                      <button
                        type="button"
                        onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                        className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-[11px] font-medium transition-all duration-200"
                        style={{ borderColor: "var(--border)", backgroundColor: "var(--muted-bg)", color: "var(--text)" }}
                      >
                        Created
                        <span style={{ color: "var(--muted-text)" }}>{sortOrder === "desc" ? "Newest" : "Oldest"}</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedExperiments.map((item) => (
                    <tr
                      key={item.experiment_id}
                      onClick={() => router.push(`/results/${item.experiment_id}`)}
                      className="cursor-pointer border-t transition-all duration-200"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="px-3 py-3 font-mono text-xs" style={{ color: "var(--muted-text)" }}>{item.experiment_id}</td>
                      <td className="px-3 py-3 text-sm font-semibold" style={{ color: "var(--text)" }}>{item.protein}</td>
                      <td className="px-3 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusClassName(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm" style={{ color: "var(--muted-text)" }}>{formatDate(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
