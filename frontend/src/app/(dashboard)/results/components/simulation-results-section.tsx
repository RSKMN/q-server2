import type { ScoreBand, StabilityBand } from "./results-filter-types";
import { CsvDownloadButton } from "./csv-download-button";
import type { SimulationResult } from "@/types/api";
import { ChartSkeleton, ResultsEmptyState } from "./results-state";

const SUMMARY_METRICS = [
  { label: "Average RMSD", value: "1.57 Å" },
  { label: "Peak RMSD", value: "1.95 Å" },
  { label: "Drift", value: "+0.75 Å" },
  { label: "Frames", value: "13" },
];

const MARGIN = { top: 18, right: 18, bottom: 36, left: 42 };
const CHART_WIDTH = 760;
const CHART_HEIGHT = 300;

function formatTime(value: number): string {
  return `${value} ns`;
}

function formatRmsd(value: number): string {
  return `${value.toFixed(2)} Å`;
}

interface SimulationResultsSectionProps {
  items: SimulationResult[];
  searchQuery: string;
  scoreBand: ScoreBand;
  stabilityBand: StabilityBand;
  loading?: boolean;
}

function matchesSearch(item: SimulationResult, searchQuery: string): boolean {
  const normalized = searchQuery.trim().toLowerCase();
  if (!normalized) return true;

  return [item.molecule_id, item.smiles].join(" ").toLowerCase().includes(normalized);
}

export function SimulationResultsSection({
  items,
  searchQuery,
  scoreBand,
  stabilityBand,
  loading = false,
}: SimulationResultsSectionProps) {
  if (loading) {
    return <ChartSkeleton />;
  }

  const filteredItems = items
    .filter((item) => matchesSearch(item, searchQuery))
    .sort((a, b) => a.time - b.time);

  if (items.length === 0) {
    return (
      <ResultsEmptyState description="Run the pipeline from Workspace to generate a trajectory and stability summary." />
    );
  }

  if (filteredItems.length === 0) {
    return (
      <ResultsEmptyState
        title="No matching results"
        description="No simulation rows match the current search or filters. Clear the filters or broaden the range to continue."
      />
    );
  }

  const times = filteredItems.map((point) => point.time);
  const values = filteredItems.map((point) => point.rmsd);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const minValue = Math.max(0, Math.min(...values) - 0.15);
  const maxValue = Math.max(...values) + 0.2;
  const timeSpan = Math.max(1, maxTime - minTime);
  const valueSpan = Math.max(0.001, maxValue - minValue);
  const plotWidth = CHART_WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

  const points = filteredItems.map((point) => {
    const x = MARGIN.left + ((point.time - minTime) / timeSpan) * plotWidth;
    const y =
      MARGIN.top +
      (1 - (point.rmsd - minValue) / valueSpan) * plotHeight;
    return { ...point, x, y };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const averageRmsd = values.reduce((sum, value) => sum + value, 0) / values.length;
  const stable = averageRmsd < 2.0 && Math.max(...values) < 2.5;
  const stabilityLabel = stable ? "Stable" : "Unstable";
  const stabilityClass = stable
    ? "border-emerald-300/40 bg-emerald-500/15 text-emerald-100"
    : "border-rose-300/40 bg-rose-500/15 text-rose-100";
  const compositeScore = 3 - averageRmsd;
  const matchesScore =
    scoreBand === "all"
      ? true
      : scoreBand === "high"
        ? compositeScore >= 1.4
        : scoreBand === "medium"
          ? compositeScore >= 1.1 && compositeScore < 1.4
          : compositeScore < 1.1;
  const matchesStability =
    stabilityBand === "all"
      ? true
      : stabilityBand === "stable"
        ? stable
        : stabilityBand === "moderate"
          ? averageRmsd >= 1.8 && averageRmsd < 2.2
          : !stable;

  if (!matchesScore || !matchesStability) {
    return (
      <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-400">
        No simulation results match the current filters.
      </section>
    );
  }

  const csvRows = filteredItems.map((point) => ({
    "Molecule ID": point.molecule_id,
    SMILES: point.smiles,
    Time: `${point.time} ns`,
    RMSD: `${point.rmsd.toFixed(2)} Å`,
    "Stability Status": stabilityLabel,
  }));

  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Simulation Results</h2>
          <p className="mt-1 text-xs text-slate-400">
            API placeholder RMSD evolution across a 60 ns trajectory with a stability summary.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CsvDownloadButton
            filename="simulation-results.csv"
            columns={["Molecule ID", "SMILES", "Time", "RMSD", "Stability Status"]}
            rows={csvRows}
            disabled={csvRows.length === 0}
          />
          <span
            className={[
              "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
              stabilityClass,
            ].join(" ")}
          >
            {stabilityLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SUMMARY_METRICS.map((metric) => (
          <article
            key={metric.label}
            className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{metric.value}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)]">
        <article className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">RMSD vs Time</h3>
              <p className="mt-1 text-xs text-slate-400">Root mean square deviation across trajectory frames.</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>Min {formatRmsd(Math.min(...values))}</p>
              <p>Max {formatRmsd(Math.max(...values))}</p>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-slate-900/80">
            <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="h-[300px] w-full">
              <defs>
                <linearGradient id="rmsdFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgb(34 211 238 / 0.25)" />
                  <stop offset="100%" stopColor="rgb(34 211 238 / 0.02)" />
                </linearGradient>
              </defs>

              {[0, 0.5, 1, 1.5, 2].map((gridValue) => {
                const y =
                  MARGIN.top +
                  (1 - (gridValue - minValue) / valueSpan) *
                    (CHART_HEIGHT - MARGIN.top - MARGIN.bottom);
                return (
                  <g key={gridValue}>
                    <line
                      x1={MARGIN.left}
                      x2={CHART_WIDTH - MARGIN.right}
                      y1={y}
                      y2={y}
                      stroke="rgba(148,163,184,0.14)"
                      strokeDasharray="4 6"
                    />
                    <text x={12} y={y + 4} fill="rgba(226,232,240,0.55)" fontSize="11">
                      {gridValue.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              <polyline
                fill="url(#rmsdFill)"
                stroke="rgba(34,211,238,0.0)"
                strokeWidth="0"
                points={`${polylinePoints} ${CHART_WIDTH - MARGIN.right},${CHART_HEIGHT - MARGIN.bottom} ${MARGIN.left},${CHART_HEIGHT - MARGIN.bottom}`}
              />
              <polyline
                fill="none"
                stroke="rgb(34 211 238)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />

              {points.map((point) => (
                <g key={`${point.time}-${point.rmsd}`}>
                  <circle cx={point.x} cy={point.y} r="4.5" fill="rgb(34 211 238)" />
                  <circle cx={point.x} cy={point.y} r="9" fill="transparent">
                    <title>
                      {formatTime(point.time)}: {formatRmsd(point.rmsd)}
                    </title>
                  </circle>
                </g>
              ))}

              <line
                x1={MARGIN.left}
                x2={MARGIN.left}
                y1={MARGIN.top}
                y2={CHART_HEIGHT - MARGIN.bottom}
                stroke="rgba(148,163,184,0.22)"
              />
              <line
                x1={MARGIN.left}
                x2={CHART_WIDTH - MARGIN.right}
                y1={CHART_HEIGHT - MARGIN.bottom}
                y2={CHART_HEIGHT - MARGIN.bottom}
                stroke="rgba(148,163,184,0.22)"
              />

              {points.filter((_, index) => index % 2 === 0).map((point) => (
                <text
                  key={`x-${point.time}`}
                  x={point.x}
                  y={CHART_HEIGHT - 10}
                  fill="rgba(226,232,240,0.55)"
                  fontSize="11"
                  textAnchor="middle"
                >
                  {point.time}
                </text>
              ))}
            </svg>
          </div>
          <p className="mt-2 text-xs text-slate-400">Time in ns, RMSD in angstroms.</p>
        </article>

        <div className="space-y-4">
          <article className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
            <h3 className="text-sm font-semibold text-slate-100">Molecule Preview</h3>
            <div className="mt-3 flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-white/15 bg-slate-900/70 px-4 text-center text-sm text-slate-400">
              Preview placeholder for the selected simulated molecule or complex.
            </div>
          </article>

          <article className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
            <h3 className="text-sm font-semibold text-slate-100">Interpretation</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              The trajectory remains within a narrow RMSD band, suggesting a comparatively stable binding pose.
              Small oscillations are present, but there is no sustained upward drift that would indicate major instability.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
