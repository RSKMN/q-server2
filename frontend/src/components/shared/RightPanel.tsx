"use client";

import MoleculeViewer from "../molecules/MoleculeViewer";
import { useUiStore } from "@/store/uiStore";

interface RightPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const ChevronLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export default function RightPanel({ isOpen, onToggle }: RightPanelProps) {
  const selectedMoleculeId = useUiStore((s) => s.selectedMoleculeId);

  return (
    <>
      {/* Collapsed state - narrow strip with expand button */}
      <div
        className={`flex flex-shrink-0 flex-col border-l border-slate-200 bg-white transition-all duration-200 dark:border-slate-700 dark:bg-slate-800 ${
          isOpen ? "hidden" : "w-12"
        }`}
      >
        <div className="flex flex-1 flex-col items-center justify-start pt-4">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Open molecule viewer"
          >
            <ChevronLeftIcon />
          </button>
        </div>
      </div>

      {/* Expanded state */}
      <aside
        className={`flex flex-shrink-0 flex-col border-l border-slate-200 bg-white transition-all duration-200 dark:border-[#1e293b] dark:bg-[#0b0f19] ${
          isOpen ? "w-80 md:w-96" : "hidden w-0"
        }`}
      >
        <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-slate-200 px-3 dark:border-[#1e293b]">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Molecule Viewer
          </h2>
          <button
            type="button"
            onClick={onToggle}
            className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close molecule viewer"
          >
            <ChevronRightIcon />
          </button>
        </div>
        <div className="flex flex-1 flex-col min-h-0">
          <MoleculeViewer moleculeId={selectedMoleculeId} />
        </div>
      </aside>
    </>
  );
}
