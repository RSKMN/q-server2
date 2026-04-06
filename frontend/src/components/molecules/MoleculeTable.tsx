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
      return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium" style={{ borderColor: "var(--success)", backgroundColor: "var(--muted-bg)", color: "var(--success)" }}>FDA Approved</span>;
    case "Natural Products":
      return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium" style={{ borderColor: "var(--info)", backgroundColor: "var(--muted-bg)", color: "var(--info)" }}>Natural Products</span>;
    case "Screening":
      return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium" style={{ borderColor: "var(--warning)", backgroundColor: "var(--muted-bg)", color: "var(--warning)" }}>Screening</span>;
    default:
      return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium" style={{ borderColor: "var(--border)", backgroundColor: "var(--muted-bg)", color: "var(--muted-text)" }}>{dataset}</span>;
  }
};

const columns: ColumnDef<Molecule>[] = [
  {
    accessorKey: "molecule_id",
    header: "Molecule ID",
    cell: ({ getValue }) => (
      <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "smiles",
    header: "SMILES",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs truncate max-w-[200px] block" style={{ color: "var(--muted-text)" }}>
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "mw",
    header: "MW",
    cell: ({ getValue }) => (
      <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
        {(getValue() as number).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "logp",
    header: "LogP",
    cell: ({ getValue }) => (
      <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
        {(getValue() as number).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "qed",
    header: "QED",
    cell: ({ getValue }) => (
      <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
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
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--card)" }}>
      <div className="flex-1 overflow-auto overflow-y-auto scrollbar-thin" style={{ scrollbarColor: "var(--border) transparent" }}>
        <table className="w-full min-w-[600px] border-collapse text-left">
          <thead className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: "var(--card)" }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b"
                style={{ borderColor: "var(--border)" }}
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="whitespace-nowrap px-4 py-4 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--muted-text)" }}
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
                    className="border-b"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-4 w-20 animate-pulse rounded" style={{ backgroundColor: "var(--border)" }} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-4 w-44 animate-pulse rounded" style={{ backgroundColor: "var(--border)" }} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-4 w-16 animate-pulse rounded" style={{ backgroundColor: "var(--border)" }} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-4 w-14 animate-pulse rounded" style={{ backgroundColor: "var(--border)" }} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-4 w-14 animate-pulse rounded" style={{ backgroundColor: "var(--border)" }} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="h-5 w-24 animate-pulse rounded-full" style={{ backgroundColor: "var(--border)" }} />
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
                  className={`group relative cursor-pointer border-b transform-gpu transition-all duration-200 hover:scale-[1.01] ${
                    isSelected ? "" : ""
                  }`}
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: isSelected ? "var(--muted-bg)" : "transparent",
                  }}
                >
                  {/* Selection Indicator bar */}
                  {isSelected && (
                    <td className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: "var(--accent)" }} />
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
