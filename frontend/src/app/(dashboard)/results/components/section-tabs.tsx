import { RESULT_SECTION_LABELS, RESULT_SECTIONS, type ResultSection } from "./results-types";

interface SectionTabsProps {
  activeSection: ResultSection;
  onChange: (section: ResultSection) => void;
}

export function SectionTabs({ activeSection, onChange }: SectionTabsProps) {
  return (
    <div className="ui-fade-in ui-state-transition rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-[0_1px_0_rgba(15,23,42,0.05)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/60 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)]">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {RESULT_SECTIONS.map((section) => {
          const isActive = section === activeSection;
          return (
            <button
              key={section}
              type="button"
              onClick={() => onChange(section)}
              className={[
                "ui-button group relative rounded-xl px-3 py-2 text-sm font-medium outline-none transition-all duration-200 ease-out",
                isActive
                  ? "bg-cyan-100 text-cyan-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-cyan-300/60 dark:bg-cyan-400/20 dark:text-cyan-50 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] dark:ring-cyan-300/40"
                  : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(15,23,42,0.12)] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white dark:hover:shadow-[0_6px_24px_rgba(15,23,42,0.25)]",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute inset-x-3 bottom-1 h-px rounded-full transition-opacity duration-200",
                  isActive ? "bg-cyan-200/70 opacity-100" : "bg-transparent opacity-0 group-hover:opacity-60",
                ].join(" ")}
              />
              {RESULT_SECTION_LABELS[section]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
