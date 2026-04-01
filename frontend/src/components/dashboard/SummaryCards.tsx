"use client";

import { StatsSummary } from "@/types/api";
import StatCard from "./StatCard";

const MoleculeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
    <path d="M11.998 2.5A2.5 2.5 0 0 0 9.5 5c0 .6.2 1.1.6 1.5L8.2 9H6.5A2.5 2.5 0 0 0 4 11.5a2.5 2.5 0 0 0 2.5 2.5h1.7l1.9 2.5c-.4.4-.6.9-.6 1.5a2.5 2.5 0 1 0 5 0c0-.6-.2-1.1-.6-1.5l1.9-2.5h1.7a2.5 2.5 0 1 0 0-5h-1.7l-1.9-2.5c.4-.4.6-.9.6-1.5A2.5 2.5 0 0 0 11.998 2.5z"></path>
  </svg>
);

const ExperimentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
    <path d="M10 2v7.3L4.7 18A3 3 0 0 0 7.3 22h9.4a3 3 0 0 0 2.6-4l-5.3-8.7V2"></path>
    <path d="M8 2h8"></path>
    <path d="M8 12h8"></path>
  </svg>
);

const SuccessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

interface SummaryCardsProps {
  summary: StatsSummary;
  experimentCount: number | null;
  experimentsLoading: boolean;
  experimentsError: string | null;
}

export default function SummaryCards({
  summary,
  experimentCount,
  experimentsLoading,
  experimentsError,
}: SummaryCardsProps) {
  const successRate = Math.max(0, Math.min(100, Number(summary.avg_qed) * 100));
  const experimentValue = experimentsLoading
    ? "..."
    : (experimentCount ?? 0).toLocaleString();
  const experimentDescription = experimentsError
    ? "Unable to load experiment count"
    : "Total experiments registered in backend";

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        title="Total Molecules"
        value={summary.molecule_count.toLocaleString()}
        description="Records currently available in this dataset"
        icon={<MoleculeIcon />}
      />
      <StatCard
        title="Experiments"
        value={experimentValue}
        description={experimentDescription}
        icon={<ExperimentIcon />}
      />
      <StatCard
        title="Success Rate"
        value={`${successRate.toFixed(1)}%`}
        description="Proxy based on current average QED signal"
        icon={<SuccessIcon />}
      />
    </div>
  );
}
