import type { ScoreBand, StabilityBand } from "./results-filter-types";
import { CsvDownloadButton } from "./csv-download-button";
import type { QuantumResult } from "@/types/api";
import { CardGridSkeleton, ResultsEmptyState } from "./results-state";

interface QuantumResultsSectionProps {
  items: QuantumResult[];
  searchQuery: string;
  scoreBand: ScoreBand;
  stabilityBand: StabilityBand;
  loading?: boolean;
}

function getInterpretationClass(label: string): string {
  if (label === "Highly Stable") {
    return "border-emerald-300/40 bg-emerald-500/15 text-emerald-100";
  }

  if (label === "Stable") {
    return "border-cyan-300/40 bg-cyan-500/15 text-cyan-100";
  }

  return "border-amber-300/40 bg-amber-500/15 text-amber-100";
}

function matchesSearch(candidate: QuantumResult, searchQuery: string): boolean {
  const normalized = searchQuery.trim().toLowerCase();
  if (!normalized) return true;

  return [candidate.molecule_id, candidate.smiles].join(" ").toLowerCase().includes(normalized);
}

export function QuantumResultsSection({
  items,
  searchQuery,
  scoreBand,
  stabilityBand,
  loading = false,
}: QuantumResultsSectionProps) {
  if (loading) {
    return <CardGridSkeleton cards={6} />;
  }

  const sortedCandidates = [...items]
    .filter((candidate) => matchesSearch(candidate, searchQuery))
    .filter((candidate) => {
      const compositeScore = candidate.homo_lumo_gap * 0.4 + candidate.qsvm_score * 3 + candidate.stability_score * 3;
      const scoreMatch =
        scoreBand === "all"
          ? true
          : scoreBand === "high"
            ? compositeScore >= 7.2
            : scoreBand === "medium"
              ? compositeScore >= 6.2 && compositeScore < 7.2
              : compositeScore < 6.2;

      const stabilityMatch =
        stabilityBand === "all"
          ? true
          : stabilityBand === "stable"
            ? candidate.interpretation === "Highly Stable"
            : stabilityBand === "moderate"
              ? candidate.interpretation === "Stable"
              : candidate.interpretation === "Monitor";

      return scoreMatch && stabilityMatch;
    })
    .sort((a, b) => {
      const aScore = a.homo_lumo_gap * 0.4 + a.qsvm_score * 3 + a.stability_score * 3;
      const bScore = b.homo_lumo_gap * 0.4 + b.qsvm_score * 3 + b.stability_score * 3;
      return bScore - aScore;
    });

  const csvRows = sortedCandidates.map((candidate) => ({
    "Molecule ID": candidate.molecule_id,
    SMILES: candidate.smiles,
    "HOMO-LUMO Gap (eV)": candidate.homo_lumo_gap.toFixed(2),
    "QSVM Score": candidate.qsvm_score.toFixed(3),
    "Stability Score": candidate.stability_score.toFixed(3),
    Interpretation: candidate.interpretation,
  }));

  if (sortedCandidates.length === 0) {
    return (
      <ResultsEmptyState
        title="No matching results"
        description="No quantum candidates match the current search or filters. Clear the filters or broaden the range to continue."
      />
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Quantum Results</h2>
          <p className="mt-1 text-xs text-slate-400">
            API placeholder quantum screening summary using HOMO-LUMO gap, QSVM score, and stability score.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-400">Top candidates highlighted for quick review</p>
          <CsvDownloadButton
            filename="quantum-results.csv"
            columns={[
              "Molecule ID",
              "SMILES",
              "HOMO-LUMO Gap (eV)",
              "QSVM Score",
              "Stability Score",
              "Interpretation",
            ]}
            rows={csvRows}
            disabled={csvRows.length === 0}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sortedCandidates.map((candidate, index) => {
          const isTop = index < 3;
          const compositeScore = candidate.homo_lumo_gap * 0.4 + candidate.qsvm_score * 3 + candidate.stability_score * 3;

          return (
            <article
              key={candidate.molecule_id}
              className={[
                "rounded-xl border p-4",
                isTop
                  ? "border-cyan-300/40 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]"
                  : "border-white/10 bg-slate-950/60",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{candidate.molecule_id}</p>
                  <p className="mt-1 text-xs text-slate-400">Composite quantum score {compositeScore.toFixed(2)}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {isTop ? (
                    <span className="rounded-full border border-cyan-300/40 bg-cyan-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-100">
                      Top {index + 1}
                    </span>
                  ) : null}
                  <span
                    className={[
                      "rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                      getInterpretationClass(candidate.interpretation),
                    ].join(" ")}
                  >
                    {candidate.interpretation}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">HOMO-LUMO Gap</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{candidate.homo_lumo_gap.toFixed(2)} eV</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">QSVM Score</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{candidate.qsvm_score.toFixed(3)}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Stability Score</p>
                  <p className="mt-1 text-sm font-semibold text-slate-100">{candidate.stability_score.toFixed(3)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Interpretation
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {candidate.interpretation === "Highly Stable"
                    ? "Strong electronic separation and high stability suggest a robust candidate for downstream validation."
                    : candidate.interpretation === "Stable"
                      ? "Balanced quantum descriptors support progression, with good stability and acceptable classifier confidence."
                      : "Candidate remains promising but should be monitored for improved electronic stability in follow-up screens."}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
