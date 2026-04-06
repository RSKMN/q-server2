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
          "animate-spin rounded-full",
          SPINNER_SIZE_STYLES[size],
        )}
        style={{
          borderColor: "var(--border)",
          borderTopColor: "var(--accent)",
        }}
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
    <section
      aria-label="Loading dashboard content"
      className="space-y-6 animate-pulse"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cardCount }).map((_, index) => (
          <div
            key={`skeleton-card-${index}`}
            className="rounded-2xl border p-5 shadow-lg shadow-black/20"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="h-4 w-28 rounded"
              style={{ backgroundColor: "var(--border)" }}
            />
            <div
              className="mt-4 h-8 w-20 rounded"
              style={{ backgroundColor: "var(--border)" }}
            />
            <div
              className="mt-3 h-3 w-36 rounded"
              style={{
                backgroundColor: "var(--border)",
                opacity: "0.8",
              }}
            />
          </div>
        ))}
      </div>

      <div
        className="rounded-2xl border shadow-lg shadow-black/20"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        <div
          className="border-b px-5 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="h-4 w-40 rounded"
            style={{ backgroundColor: "var(--border)" }}
          />
        </div>
        <div
          className="divide-y px-5"
          style={{ borderColor: "var(--border)" }}
        >
          {Array.from({ length: rowCount }).map((_, index) => (
            <div
              key={`skeleton-row-${index}`}
              className="grid grid-cols-12 gap-3 py-4"
            >
              <div
                className="col-span-3 h-4 rounded"
                style={{ backgroundColor: "var(--border)" }}
              />
              <div
                className="col-span-2 h-4 rounded"
                style={{ backgroundColor: "var(--border)" }}
              />
              <div
                className="col-span-2 h-4 rounded"
                style={{ backgroundColor: "var(--border)" }}
              />
              <div
                className="col-span-3 h-4 rounded"
                style={{ backgroundColor: "var(--border)" }}
              />
              <div
                className="col-span-2 h-4 rounded"
                style={{ backgroundColor: "var(--border)" }}
              />
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
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div
        className="flex flex-col items-center gap-4 rounded-2xl border px-6 py-7 shadow-xl shadow-black/25 backdrop-blur-sm"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        <Spinner size="lg" label={label} />
        <p className="text-sm" style={{ color: "var(--muted-text)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}
