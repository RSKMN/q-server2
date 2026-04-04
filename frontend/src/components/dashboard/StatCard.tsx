"use client";

import type { ReactNode } from "react";
import { Tooltip } from "@/components/shared";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon?: ReactNode;
  titleTooltip?: string;
  iconTooltip?: string;
}

export default function StatCard({
  title,
  value,
  description,
  icon,
  titleTooltip,
  iconTooltip,
}: StatCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-900 p-5 shadow-[0_14px_35px_rgba(2,8,23,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(2,8,23,0.32)] dark:border-slate-700/70 dark:bg-slate-900">
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-teal-500/10 blur-2xl transition-opacity duration-200 group-hover:opacity-90" />

      <div className="relative flex items-start justify-between gap-3">
        {titleTooltip ? (
          <Tooltip content={titleTooltip}>
            <p className="cursor-help text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {title}
            </p>
          </Tooltip>
        ) : (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {title}
          </p>
        )}
        {icon ? (
          iconTooltip ? (
            <Tooltip content={iconTooltip}>
              <div className="rounded-lg border border-slate-700/80 bg-slate-800/70 p-2 text-teal-300">
                {icon}
              </div>
            </Tooltip>
          ) : (
            <div className="rounded-lg border border-slate-700/80 bg-slate-800/70 p-2 text-teal-300">
              {icon}
            </div>
          )
        ) : null}
      </div>

      <p className="relative mt-5 text-4xl font-semibold leading-none tracking-tight text-slate-100">
        {value}
      </p>

      <p className="relative mt-3 text-xs leading-5 text-slate-400">{description}</p>
    </article>
  );
}
