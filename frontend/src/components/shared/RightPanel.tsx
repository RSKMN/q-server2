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
    <aside
      className={`flex flex-shrink-0 flex-col border-l transition-all duration-300 ease-out ${
        isOpen ? "w-80 md:w-96" : "w-12"
      }`}
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--card)",
      }}
    >
      {!isOpen ? (
        <div className="flex flex-1 flex-col items-center justify-start pt-4">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center justify-center rounded-lg p-2 transition-all duration-200 hover:-translate-x-[1px]"
            style={{
              color: "var(--muted-text)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--button-hover)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--muted-text)";
            }}
            aria-label="Open molecule viewer"
          >
            <ChevronLeftIcon />
          </button>
        </div>
      ) : (
        <>
          <div
            className="flex h-12 flex-shrink-0 items-center justify-between border-b px-3"
            style={{ borderColor: "var(--border)" }}
          >
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              Molecule Viewer
            </h2>
            <button
              type="button"
              onClick={onToggle}
              className="rounded p-1.5 transition-colors"
              style={{
                color: "var(--muted-text)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "var(--button-hover)";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--text)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "transparent";
                (e.currentTarget as HTMLButtonElement).style.color =
                  "var(--muted-text)";
              }}
              aria-label="Close molecule viewer"
            >
              <ChevronRightIcon />
            </button>
          </div>
          <div className="panel-enter flex min-h-0 flex-1 flex-col">
            <MoleculeViewer moleculeId={selectedMoleculeId} />
          </div>
        </>
      )}
    </aside>
  );
}
