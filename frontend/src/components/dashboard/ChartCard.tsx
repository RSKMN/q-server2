"use client";

import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export default function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div
      className="flex flex-col rounded-xl border p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
    >
      <h3 className="mb-6 text-sm font-semibold tracking-[0.01em]" style={{ color: "var(--text)" }}>
        {title}
      </h3>
      <div className="h-64 flex-1">{children}</div>
    </div>
  );
}
