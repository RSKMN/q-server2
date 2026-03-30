"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import type { Molecule } from "@/types/api";
import { MOCK_MOLECULES } from "./mockMolecules";

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
  isLoading?: boolean;
}

export default function MoleculeTable({
  data = MOCK_MOLECULES,
  onRowSelect,
  selectedId,
  isLoading = false,
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
            {isLoading
              ? Array.from({ length: 9 }).map((_, index) => (
                  <tr
                    key={`skeleton-${index}`}
                    className="border-b border-slate-100 dark:border-[#1e293b]"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-4 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-4 w-14 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-4 w-14 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                    </td>
                  </tr>
                ))
              : table.getRowModel().rows.map((row) => {
              const molecule = row.original;
              const isSelected = selectedId === molecule.molecule_id;
              return (
                <tr
                  key={row.id}
                  onClick={() => onRowSelect?.(molecule)}
                  className={`group relative cursor-pointer border-b border-slate-100 transform-gpu transition-all duration-200 hover:scale-[1.01] hover:bg-slate-50 dark:border-[#1e293b] dark:hover:bg-[#1e293b]/40 ${
                    isSelected ? "bg-slate-100 dark:bg-[#1e293b]/60" : ""
                  }`}
                >
                  {/* Selection Indicator bar */}
                  {isSelected && (
                    <td className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />
                  )}
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-3 transition-transform duration-200 group-hover:translate-x-[1px]">
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
