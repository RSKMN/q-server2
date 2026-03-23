"use client";

import MoleculeTable from "@/components/molecules/MoleculeTable";
import { useUiStore } from "@/store/uiStore";

export default function MoleculesPage() {
  const selectedMoleculeId = useUiStore((s) => s.selectedMoleculeId);
  const setSelectedMolecule = useUiStore((s) => s.setSelectedMolecule);
  const setRightPanelOpen = useUiStore((s) => s.setRightPanelOpen);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Molecule Explorer
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          150 molecules
        </p>
      </div>

      {/* Top Bar Navigation */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-[#1e293b] dark:bg-[#0b0f19] dark:text-slate-200"
              placeholder="Search by ID, name, or SMILES..."
            />
          </div>
          
          <select className="h-[38px] cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 dark:border-[#1e293b] dark:bg-[#0b0f19] dark:text-slate-200">
            <option>All datasets</option>
            <option>FDA Approved</option>
            <option>Natural Products</option>
            <option>Screening</option>
          </select>

          <button className="flex h-[38px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-[#1e293b] dark:bg-[#0b0f19] dark:text-slate-200 dark:hover:bg-[#1e293b]">
            <svg className="h-4 w-4 text-slate-400 items-center justify-center" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filters
          </button>
        </div>

        <button className="flex h-[38px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-[#1e293b] dark:bg-[#0b0f19] dark:text-slate-200 dark:hover:bg-[#1e293b]">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Export
        </button>
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-[#1e293b] dark:bg-[#0b0f19] overflow-hidden flex flex-col">
        <MoleculeTable 
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
