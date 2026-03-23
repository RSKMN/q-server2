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
      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-slate-200 bg-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                molecule_id
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                similarity score
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                MW
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                QED
              </th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  No results yet. Enter a SMILES and click Search.
                </td>
              </tr>
            ) : (
              results.map((result) => (
                <tr
                  key={result.molecule_id}
                  onClick={() => onRowClick?.(result)}
                  className="border-b border-slate-100 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
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