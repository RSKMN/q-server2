import type { HTMLAttributes } from "react";

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

interface DashboardSkeletonProps {
  cardCount?: number;
  rowCount?: number;
}

interface FullPageLoadingProps {
  label?: string;
}

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

const SPINNER_SIZE_STYLES: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

export function Spinner({
  size = "md",
  label = "Loading",
  className,
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={joinClasses("inline-flex items-center justify-center", className)}
      {...props}
    >
      <span
        className={joinClasses(
          "animate-spin rounded-full border-slate-600 border-t-cyan-400",
          SPINNER_SIZE_STYLES[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function DashboardSkeleton({
  cardCount = 3,
  rowCount = 6,
}: DashboardSkeletonProps) {
  return (
    <section aria-label="Loading dashboard content" className="space-y-6 animate-pulse">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cardCount }).map((_, index) => (
          <div
            key={`skeleton-card-${index}`}
            className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-black/20"
          >
            <div className="h-4 w-28 rounded bg-slate-700" />
            <div className="mt-4 h-8 w-20 rounded bg-slate-700/80" />
            <div className="mt-3 h-3 w-36 rounded bg-slate-800" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/70 shadow-lg shadow-black/20">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="h-4 w-40 rounded bg-slate-700" />
        </div>
        <div className="divide-y divide-white/10 px-5">
          {Array.from({ length: rowCount }).map((_, index) => (
            <div key={`skeleton-row-${index}`} className="grid grid-cols-12 gap-3 py-4">
              <div className="col-span-3 h-4 rounded bg-slate-800" />
              <div className="col-span-2 h-4 rounded bg-slate-800" />
              <div className="col-span-2 h-4 rounded bg-slate-800" />
              <div className="col-span-3 h-4 rounded bg-slate-800" />
              <div className="col-span-2 h-4 rounded bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FullPageLoading({
  label = "Loading application",
}: FullPageLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/70 px-6 py-7 shadow-xl shadow-black/25 backdrop-blur-sm">
        <Spinner size="lg" label={label} />
        <p className="text-sm text-slate-300">{label}</p>
      </div>
    </div>
  );
}
