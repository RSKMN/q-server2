"use client";

import { useEffect, useMemo, useState } from "react";
import MoleculeTable from "@/components/molecules/MoleculeTable";
import { MOCK_MOLECULES } from "@/components/molecules/mockMolecules";
import { useUiStore } from "@/store/uiStore";

export default function MoleculesPage() {
  const selectedMoleculeId = useUiStore((s) => s.selectedMoleculeId);
  const setSelectedMolecule = useUiStore((s) => s.setSelectedMolecule);
  const setRightPanelOpen = useUiStore((s) => s.setRightPanelOpen);

  const [searchTerm, setSearchTerm] = useState("");
  const [dataset, setDataset] = useState("All datasets");
  const [isLoading, setIsLoading] = useState(true);

  const mwBounds = useMemo(() => {
    const values = MOCK_MOLECULES.map((m) => m.mw);
    return {
      min: Math.floor(Math.min(...values)),
      max: Math.ceil(Math.max(...values)),
    };
  }, []);

  const logpBounds = useMemo(() => {
    const values = MOCK_MOLECULES.map((m) => m.logp);
    return {
      min: Math.floor(Math.min(...values)),
      max: Math.ceil(Math.max(...values)),
    };
  }, []);

  const [mwMin, setMwMin] = useState(mwBounds.min);
  const [mwMax, setMwMax] = useState(mwBounds.max);
  const [logpMin, setLogpMin] = useState(logpBounds.min);
  const [logpMax, setLogpMax] = useState(logpBounds.max);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsLoading(false), 700);
    return () => window.clearTimeout(timeout);
  }, []);

  const datasets = useMemo(
    () => ["All datasets", ...Array.from(new Set(MOCK_MOLECULES.map((m) => m.dataset))).sort()],
    []
  );

  const filteredMolecules = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    return MOCK_MOLECULES.filter((molecule) => {
      const matchDataset = dataset === "All datasets" || molecule.dataset === dataset;
      const matchMw = molecule.mw >= mwMin && molecule.mw <= mwMax;
      const matchLogp = molecule.logp >= logpMin && molecule.logp <= logpMax;
      const matchQuery =
        !normalizedQuery ||
        molecule.molecule_id.toLowerCase().includes(normalizedQuery) ||
        molecule.smiles.toLowerCase().includes(normalizedQuery);
      return matchDataset && matchMw && matchLogp && matchQuery;
    });
  }, [dataset, logpMax, logpMin, mwMax, mwMin, searchTerm]);

  const resetFilters = () => {
    setDataset("All datasets");
    setSearchTerm("");
    setMwMin(mwBounds.min);
    setMwMax(mwBounds.max);
    setLogpMin(logpBounds.min);
    setLogpMax(logpBounds.max);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Molecule Explorer
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {filteredMolecules.length} molecules
        </p>
      </div>

      <div className="mb-4 space-y-4 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-[#1e293b] dark:bg-[#0b0f19]/90">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="block w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-[#1e293b] dark:bg-[#0b0f19] dark:text-slate-200"
              placeholder="Search by ID, name, or SMILES..."
            />
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={dataset}
              onChange={(event) => setDataset(event.target.value)}
              className="h-[38px] cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-[#1e293b] dark:bg-[#0b0f19] dark:text-slate-200"
            >
              {datasets.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="flex h-[38px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:-translate-y-px hover:bg-slate-50 dark:border-[#1e293b] dark:bg-[#0b0f19] dark:text-slate-200 dark:hover:bg-[#1e293b]"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-[#1e293b] dark:bg-[#020617]">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              <span>MW Range</span>
              <span>{mwMin} - {mwMax}</span>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min={mwBounds.min}
                max={mwBounds.max}
                value={mwMin}
                onChange={(event) => setMwMin(Math.min(Number(event.target.value), mwMax))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200"
              />
              <input
                type="range"
                min={mwBounds.min}
                max={mwBounds.max}
                value={mwMax}
                onChange={(event) => setMwMax(Math.max(Number(event.target.value), mwMin))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-[#1e293b] dark:bg-[#020617]">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              <span>LogP Range</span>
              <span>{logpMin.toFixed(1)} - {logpMax.toFixed(1)}</span>
            </div>
            <div className="space-y-2">
              <input
                type="range"
                min={logpBounds.min}
                max={logpBounds.max}
                step={0.1}
                value={logpMin}
                onChange={(event) => setLogpMin(Math.min(Number(event.target.value), logpMax))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200"
              />
              <input
                type="range"
                min={logpBounds.min}
                max={logpBounds.max}
                step={0.1}
                value={logpMax}
                onChange={(event) => setLogpMax(Math.max(Number(event.target.value), logpMin))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-[#1e293b] dark:bg-[#0b0f19] overflow-hidden flex flex-col">
        <MoleculeTable
          data={filteredMolecules}
          isLoading={isLoading}
          selectedId={selectedMoleculeId}
          onRowSelect={(molecule) => {
            setSelectedMolecule(molecule.molecule_id);
            setRightPanelOpen(true);
          }}
        />
      </div>
    </div>
  );
}
