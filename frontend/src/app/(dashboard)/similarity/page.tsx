"use client";

import { useState } from "react";
import SearchBar from "@/components/similarity/SearchBar";
import ResultsTable from "@/components/similarity/ResultsTable";
import { searchSimilar } from "@/services/api";
import { useUiStore } from "@/store";
import type { SimilarityResult } from "@/types/api";

export default function SimilarityPage() {
  const [results, setResults] = useState<SimilarityResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setSelectedMolecule = useUiStore((state) => state.setSelectedMolecule);
  const setRightPanelOpen = useUiStore((state) => state.setRightPanelOpen);

  const handleSearch = async (smiles: string, topK: number) => {
    if (!smiles) {
      setError("Please enter a SMILES string.");
      setResults([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await searchSimilar(smiles, topK);
      setResults(response.neighbors ?? []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to run similarity search.";
      setError(message);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (result: SimilarityResult) => {
    setSelectedMolecule(result.molecule_id);
    setRightPanelOpen(true);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Similarity Search
        </h1>
        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
          Search nearest molecules by SMILES and inspect results.
        </p>
      </div>

      <SearchBar isLoading={isLoading} onSearch={handleSearch} />

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <ResultsTable
        results={results}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />
    </div>
  );
}