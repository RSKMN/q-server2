"use client";

import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

export default function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl dark:border-[#1e293b] dark:bg-[#0b0f19]">
      <h3 className="mb-6 text-sm font-semibold tracking-[0.01em] text-slate-800 dark:text-slate-100">
        {title}
      </h3>
      <div className="h-64 flex-1">{children}</div>
    </div>
  );
}
