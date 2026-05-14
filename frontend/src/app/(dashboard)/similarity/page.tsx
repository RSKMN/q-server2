"use client";

import { useState } from "react";
import SearchBar from "@/components/similarity/SearchBar";
import ResultsGrid from "@/components/similarity/ResultsTable";
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
      setError("Please enter a valid SMILES sequence.");
      setResults([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await searchSimilar(smiles, topK);
      setResults(response.neighbors ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Similarity search engine error.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (result: SimilarityResult) => {
    setSelectedMolecule(result.molecule_id);
    setRightPanelOpen(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 pb-12">
      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Discovery Tools</p>
        <h1 className="text-3xl font-black tracking-tight text-text">Similarity Search</h1>
        <p className="max-w-2xl text-sm font-medium text-text-secondary/70">
          Identify nearest chemical neighbors using fingerprint-based structural similarity. Useful for hit expansion and identifying potential off-target interactions.
        </p>
      </div>

      <SearchBar isLoading={isLoading} onSearch={handleSearch} />

      {error ? (
        <div className="rounded-2xl border-2 border-error/20 bg-error/5 p-4 text-sm font-bold text-error flex items-center gap-3">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      ) : null}

      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/30 pb-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-text-secondary">Search Results {results.length > 0 && `(${results.length})`}</h2>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary/40">
            Sorted by Tanimoto Coefficient
          </div>
        </div>
        <ResultsGrid
          results={results}
          isLoading={isLoading}
          onCardClick={handleCardClick}
        />
      </section>
    </div>
  );
}