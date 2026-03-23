"use client";

import { StatsSummary } from "@/types/api";
import SummaryCard from "./SummaryCard";

// Mock icons using simple SVGs
const MoleculeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
    <path d="M11.998 2.5A2.5 2.5 0 0 0 9.5 5c0 .6.2 1.1.6 1.5L8.2 9H6.5A2.5 2.5 0 0 0 4 11.5a2.5 2.5 0 0 0 2.5 2.5h1.7l1.9 2.5c-.4.4-.6.9-.6 1.5a2.5 2.5 0 1 0 5 0c0-.6-.2-1.1-.6-1.5l1.9-2.5h1.7a2.5 2.5 0 1 0 0-5h-1.7l-1.9-2.5c.4-.4.6-.9.6-1.5A2.5 2.5 0 0 0 11.998 2.5z"></path>
  </svg>
);

const WeightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
    <path d="M5 22h14"></path>
    <path d="M5 20v-2a7 7 0 0 1 14 0v2"></path>
    <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path>
  </svg>
);

const DropIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path>
  </svg>
);

const QedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
);

interface SummaryCardsProps {
  summary: StatsSummary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        label="Total Molecules"
        value={summary.molecule_count.toLocaleString()}
        subtitle="In selected dataset"
        icon={<MoleculeIcon />}
      />
      <SummaryCard 
        label="Avg Molecular Weight" 
        value={summary.avg_mw} 
        unit="g/mol" 
        subtitle="Mean mass of molecules"
        icon={<WeightIcon />}
      />
      <SummaryCard 
        label="Avg LogP" 
        value={summary.avg_logp} 
        subtitle="Calculated lipophilicity"
        icon={<DropIcon />}
      />
      <SummaryCard 
        label="Avg QED" 
        value={summary.avg_qed} 
        subtitle="Quantitative Estimate of Druglikeness"
        icon={<QedIcon />}
      />
    </div>
  );
}
