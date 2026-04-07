"use client";

import { useEffect, useMemo, useState } from "react";
import MoleculeTable from "@/components/molecules/MoleculeTable";
import MoleculeViewer from "@/components/molecules/MoleculeViewer";
import { MOCK_MOLECULES } from "@/components/molecules/mockMolecules";
import { useUiStore } from "@/store/uiStore";

export default function MoleculesPage() {
  const selectedMoleculeId = useUiStore((s) => s.selectedMoleculeId);
  const setSelectedMolecule = useUiStore((s) => s.setSelectedMolecule);
  const isRightPanelOpen = useUiStore((s) => s.isRightPanelOpen);
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
        <h1 className="text-2xl font-semibold" style={{ color: "var(--text)" }}>
          Molecule Explorer
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-text)" }}>
          {filteredMolecules.length} molecules
        </p>
      </div>

      <div className="mb-4 space-y-4 rounded-xl border p-4 shadow-sm backdrop-blur-sm" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--muted-text)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="block w-full rounded-lg border py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-1"
              style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)", caretColor: "var(--accent)" }}
              placeholder="Search by ID, name, or SMILES..."
            />
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={dataset}
              onChange={(event) => setDataset(event.target.value)}
              className="h-[38px] cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1"
              style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
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
              className="flex h-[38px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all hover:-translate-y-px"
              style={{ borderColor: "var(--border)", background: "var(--card)", color: "var(--text)" }}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--muted-bg)" }}>
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-text)" }}>
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
                className="h-2 w-full cursor-pointer appearance-none rounded-full"
                style={{ background: "color-mix(in srgb, var(--border) 75%, var(--bg))" }}
              />
              <input
                type="range"
                min={mwBounds.min}
                max={mwBounds.max}
                value={mwMax}
                onChange={(event) => setMwMax(Math.max(Number(event.target.value), mwMin))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full"
                style={{ background: "color-mix(in srgb, var(--border) 75%, var(--bg))" }}
              />
            </div>
          </div>

          <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--muted-bg)" }}>
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-text)" }}>
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
                className="h-2 w-full cursor-pointer appearance-none rounded-full"
                style={{ background: "color-mix(in srgb, var(--border) 75%, var(--bg))" }}
              />
              <input
                type="range"
                min={logpBounds.min}
                max={logpBounds.max}
                step={0.1}
                value={logpMax}
                onChange={(event) => setLogpMax(Math.max(Number(event.target.value), logpMin))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full"
                style={{ background: "color-mix(in srgb, var(--border) 75%, var(--bg))" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-lg" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
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

        <aside
          className={`hidden min-h-0 flex-shrink-0 overflow-hidden rounded-xl border shadow-lg lg:flex lg:flex-col ${isRightPanelOpen ? "w-[26rem]" : "w-[3rem]"}`}
          style={{ borderColor: "var(--border)", background: "var(--card)", transition: "width 220ms ease" }}
        >
          {!isRightPanelOpen ? (
            <button
              type="button"
              onClick={() => setRightPanelOpen(true)}
              className="m-2 inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-semibold"
              style={{ borderColor: "var(--border)", color: "var(--text)", backgroundColor: "var(--muted-bg)" }}
              aria-label="Open molecule viewer"
            >
              <span aria-hidden="true">&lt;</span>
            </button>
          ) : (
            <>
              <div className="flex h-11 items-center justify-between border-b px-3" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-text)" }}>
                  Molecule Viewer
                </p>
                <button
                  type="button"
                  onClick={() => setRightPanelOpen(false)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border text-sm font-semibold"
                  style={{ borderColor: "var(--border)", color: "var(--text)", backgroundColor: "var(--muted-bg)" }}
                  aria-label="Close molecule viewer"
                >
                  <span aria-hidden="true">&gt;</span>
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                <MoleculeViewer moleculeId={selectedMoleculeId} />
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
