"use client";

import { useState } from "react";

interface SearchBarProps {
  initialSmiles?: string;
  initialTopK?: number;
  isLoading?: boolean;
  onSearch: (smiles: string, topK: number) => void;
}

export default function SearchBar({
  initialSmiles = "",
  initialTopK = 10,
  isLoading = false,
  onSearch,
}: SearchBarProps) {
  const [smiles, setSmiles] = useState(initialSmiles);
  const [topK, setTopK] = useState(initialTopK);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(smiles.trim(), topK);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_120px_auto] md:items-end"
    >
      <div>
        <label
          htmlFor="smiles-input"
          className="mb-1 block text-xs font-medium text-slate-600"
        >
          SMILES
        </label>
        <input
          id="smiles-input"
          value={smiles}
          onChange={(event) => setSmiles(event.target.value)}
          placeholder="e.g. CC(=O)Oc1ccccc1C(=O)O"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      <div>
        <label
          htmlFor="top-k-select"
          className="mb-1 block text-xs font-medium text-slate-600"
        >
          top_k
        </label>
        <select
          id="top-k-select"
          value={topK}
          onChange={(event) => setTopK(Number(event.target.value))}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          {[5, 10, 20, 50].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Searching..." : "Search"}
      </button>
    </form>
  );
}