import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  icon?: ReactNode;
  className?: string;
}

function EmptyPlaceholderIcon() {
  return (
    <svg
      viewBox="0 0 48 48"
      className="h-12 w-12 text-slate-400/80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="7" y="9" width="34" height="30" rx="8" stroke="currentColor" strokeWidth="2" />
      <path d="M14 19h20M14 25h14M14 31h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="33" cy="31" r="2" fill="currentColor" />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  icon,
  className = "",
}: EmptyStateProps) {
  const ctaBaseClass =
    "ui-button inline-flex items-center justify-center rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-3.5 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-500/20";

  return (
    <section
      className={`ui-fade-in ui-state-transition flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-slate-950/40 px-6 text-center ${className}`}
    >
      <div className="rounded-full border border-white/10 bg-white/5 p-3">
        {icon ?? <EmptyPlaceholderIcon />}
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-100">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>

      {ctaLabel ? (
        ctaHref ? (
          <Link href={ctaHref} className={`mt-4 ${ctaBaseClass}`}>
            {ctaLabel}
          </Link>
        ) : (
          <button type="button" onClick={onCtaClick} className={`mt-4 ${ctaBaseClass}`}>
            {ctaLabel}
          </button>
        )
      ) : null}
    </section>
  );
}