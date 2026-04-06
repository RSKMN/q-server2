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
    <article
      className="group relative overflow-hidden rounded-2xl border p-5 shadow-[0_14px_35px_rgba(2,8,23,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(2,8,23,0.32)]"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full blur-2xl transition-opacity duration-200 group-hover:opacity-90"
        style={{ backgroundColor: "var(--accent-glow)" }}
      />

      <div className="relative flex items-start justify-between gap-3">
        {titleTooltip ? (
          <Tooltip content={titleTooltip}>
            <p className="cursor-help text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted-text)" }}>
              {title}
            </p>
          </Tooltip>
        ) : (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--muted-text)" }}>
            {title}
          </p>
        )}
        {icon ? (
          iconTooltip ? (
            <Tooltip content={iconTooltip}>
              <div
                className="rounded-lg border p-2"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--muted-bg)",
                  color: "var(--accent)",
                }}
              >
                {icon}
              </div>
            </Tooltip>
          ) : (
            <div
              className="rounded-lg border p-2"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--muted-bg)",
                color: "var(--accent)",
              }}
            >
              {icon}
            </div>
          )
        ) : null}
      </div>

      <p className="relative mt-5 text-4xl font-semibold leading-none tracking-tight" style={{ color: "var(--text)" }}>
        {value}
      </p>

      <p className="relative mt-3 text-xs leading-5" style={{ color: "var(--muted-text)" }}>{description}</p>
    </article>
  );
}
