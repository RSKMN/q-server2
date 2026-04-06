"use client";

import type { SimilarityResult } from "@/types/api";

interface ResultsTableProps {
  results: SimilarityResult[];
  isLoading?: boolean;
  onRowClick?: (result: SimilarityResult) => void;
}

export default function ResultsTable({
  results,
  isLoading = false,
  onRowClick,
}: ResultsTableProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
        <div className="h-6 w-6 animate-spin rounded-full border-2" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border shadow-sm" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted-bg)" }}>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-text)" }}>
                molecule_id
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-text)" }}>
                similarity score
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-text)" }}>
                MW
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-text)" }}>
                QED
              </th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: "var(--muted-text)" }}
                >
                  No results yet. Enter a SMILES and click Search.
                </td>
              </tr>
            ) : (
              results.map((result) => (
                <tr
                  key={result.molecule_id}
                  onClick={() => onRowClick?.(result)}
                  className="border-b text-sm transition-colors"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>
                    {result.molecule_id}
                  </td>
                  <td className="px-4 py-3">{result.similarity.toFixed(4)}</td>
                  <td className="px-4 py-3">
                    {typeof result.mw === "number" ? result.mw.toFixed(2) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {typeof result.qed === "number" ? result.qed.toFixed(3) : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}