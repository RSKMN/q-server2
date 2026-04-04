import type { ScoreBand, StabilityBand } from "./results-filter-types";

interface ResultsFilterBarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  scoreBand: ScoreBand;
  onScoreBandChange: (value: ScoreBand) => void;
  stabilityBand: StabilityBand;
  onStabilityBandChange: (value: StabilityBand) => void;
  onClear: () => void;
}

export function ResultsFilterBar({
  searchQuery,
  onSearchQueryChange,
  scoreBand,
  onScoreBandChange,
  stabilityBand,
  onStabilityBandChange,
  onClear,
}: ResultsFilterBarProps) {
  return (
    <section className="ui-fade-in ui-hover-lift ui-state-transition rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Global Filters</h2>
          <p className="mt-1 text-xs text-slate-400">
            Search by molecule ID or SMILES, then narrow the active section by score and stability.
          </p>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="ui-button w-fit rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-white/10"
        >
          Clear filters
        </button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,0.8fr))]">
        <label className="flex flex-col gap-2 text-xs font-medium text-slate-300">
          Search
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Molecule ID or SMILES"
            className="rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs font-medium text-slate-300">
          Score Range
          <select
            value={scoreBand}
            onChange={(event) => onScoreBandChange(event.target.value as ScoreBand)}
            className="rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400/60 focus:outline-none"
          >
            <option value="all">All scores</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-xs font-medium text-slate-300">
          Stability
          <select
            value={stabilityBand}
            onChange={(event) => onStabilityBandChange(event.target.value as StabilityBand)}
            className="rounded-lg border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400/60 focus:outline-none"
          >
            <option value="all">All stability states</option>
            <option value="stable">Stable</option>
            <option value="moderate">Moderate</option>
            <option value="unstable">Unstable</option>
          </select>
        </label>
      </div>
    </section>
  );
}
