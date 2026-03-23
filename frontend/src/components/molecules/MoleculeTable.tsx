"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import type { Molecule } from "@/types/api";

const MOCK_MOLECULES: Molecule[] = [
  { molecule_id: "MOL-001", smiles: "CC(=O)Oc1ccccc1C(=O)O", mw: 180.16, logp: 1.19, qed: 0.55, dataset: "FDA Approved" },
  { molecule_id: "MOL-002", smiles: "CC1=CC=C(C=C1)CC(=NN2C3=CC=CC=C3C(=O)C2=O)...", mw: 381.37, logp: 3.53, qed: 0.62, dataset: "FDA Approved" },
  { molecule_id: "MOL-003", smiles: "CN1C=NC2=C1C(=O)N(C(=O)N2C)C", mw: 194.19, logp: -0.07, qed: 0.54, dataset: "Natural Products" },
  { molecule_id: "MOL-004", smiles: "CC(C)CC1=CC=C(C=C1)C(C)C(=O)O", mw: 206.29, logp: 3.97, qed: 0.74, dataset: "FDA Approved" },
  { molecule_id: "MOL-005", smiles: "CN1C2CCC1C(C2)OC(=O)C3=CC=CC=C3C(=O)OCC", mw: 303.35, logp: 2.28, qed: 0.48, dataset: "Natural Products" },
  { molecule_id: "MOL-006", smiles: "CC(=O)NC1=CC=C(C=C1)O", mw: 151.16, logp: 0.46, qed: 0.73, dataset: "FDA Approved" },
  { molecule_id: "MOL-007", smiles: "C1=CC=C(C=C1)CC(C(=O)O)NC(=O)C(CC2=CC=CC=C2)NC...", mw: 432.51, logp: 4.21, qed: 0.380, dataset: "Screening" },
  { molecule_id: "MOL-008", smiles: "COC1=C(C=C2C(=C1)C(=NC=N2)NC3=CC(=C(C=C3)F)Cl)...", mw: 446.90, logp: 3.75, qed: 0.440, dataset: "FDA Approved" },
  { molecule_id: "MOL-009", smiles: "CC1=C(C(=C(C=C1)C)C)C2=CC=CC=C2", mw: 196.29, logp: 4.85, qed: 0.810, dataset: "Screening" },
  { molecule_id: "MOL-010", smiles: "CC(=O)OC1=CC=CC=C1C(=O)OC", mw: 194.18, logp: 1.89, qed: 0.680, dataset: "Screening" },
  { molecule_id: "MOL-011", smiles: "CN(C)CCC1=CNC2=C1C=C(C=C2)O", mw: 176.22, logp: 0.21, qed: 0.650, dataset: "Natural Products" },
  { molecule_id: "MOL-012", smiles: "C1=CC=C(C(=C1)C(=O)O)NC2=CC=CC=C2C1", mw: 261.11, logp: 5.12, qed: 0.520, dataset: "FDA Approved" },
  { molecule_id: "MOL-013", smiles: "CC1=CC2=C(C=C1C)N(C=N2)C3=CC=CC=C3", mw: 222.28, logp: 3.21, qed: 0.770, dataset: "Screening" },
  { molecule_id: "MOL-014", smiles: "COC1=CC=C(C=C1)C2=CC(=O)C3=C(O2)C=C(C=C3O)O", mw: 286.24, logp: 1.97, qed: 0.580, dataset: "Natural Products" },
  { molecule_id: "MOL-015", smiles: "CC(C)NCC(O)C1=CC=C(O)C=C1", mw: 193.27, logp: 0.64, qed: 0.710, dataset: "FDA Approved" },
];

const getDatasetBadge = (dataset: string) => {
  switch (dataset) {
    case "FDA Approved":
      return <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:border-teal-800 dark:bg-[#064e3b] dark:text-teal-400">FDA Approved</span>;
    case "Natural Products":
      return <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-[#312e81] dark:text-indigo-400">Natural Products</span>;
    case "Screening":
      return <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-900 dark:bg-[#78350f] dark:text-amber-500">Screening</span>;
    default:
      return <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 dark:border-[#334155] dark:bg-[#1e293b] dark:text-slate-400">{dataset}</span>;
  }
};

const columns: ColumnDef<Molecule>[] = [
  {
    accessorKey: "molecule_id",
    header: "Molecule ID",
    cell: ({ getValue }) => (
      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "smiles",
    header: "SMILES",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-slate-500 truncate max-w-[200px] block dark:text-slate-400">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "mw",
    header: "MW",
    cell: ({ getValue }) => (
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {(getValue() as number).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "logp",
    header: "LogP",
    cell: ({ getValue }) => (
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {(getValue() as number).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "qed",
    header: "QED",
    cell: ({ getValue }) => (
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {(getValue() as number).toFixed(3)}
      </span>
    ),
  },
  {
    accessorKey: "dataset",
    header: "Dataset",
    cell: ({ getValue }) => getDatasetBadge(getValue() as string),
  },
];

interface MoleculeTableProps {
  data?: Molecule[];
  onRowSelect?: (molecule: Molecule) => void;
  selectedId?: string | null;
}

export default function MoleculeTable({
  data = MOCK_MOLECULES,
  onRowSelect,
  selectedId,
}: MoleculeTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0b0f19]">
      <div className="flex-1 overflow-auto overflow-y-auto scrollbar-thin scrollbar-track-slate-50 scrollbar-thumb-slate-200 dark:scrollbar-track-[#0b0f19] dark:scrollbar-thumb-[#1e293b]">
        <table className="w-full min-w-[600px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm dark:bg-[#0b0f19]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-slate-200 dark:border-[#1e293b]"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#64748b]"
                  >
                    {header.column.columnDef.header as string}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const molecule = row.original;
              const isSelected = selectedId === molecule.molecule_id;
              return (
                <tr
                  key={row.id}
                  onClick={() => onRowSelect?.(molecule)}
                  className={`relative cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-[#1e293b] dark:hover:bg-[#1e293b]/40 ${
                    isSelected ? "bg-slate-100 dark:bg-[#1e293b]/60" : ""
                  }`}
                >
                  {/* Selection Indicator bar */}
                  {isSelected && (
                    <td className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />
                  )}
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
