import { useMemo, useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Input } from "../atoms/Input";
import { Button } from "../atoms/Button";

export type DataTableColumn<T> = {
  /** Unique key — used as column id and for accessing the field when no custom cell. */
  key: keyof T & string;
  /** Header label. */
  header: string;
  /** Custom cell renderer. If omitted, String(row[key]) is used. */
  cell?: (row: T) => ReactNode;
  /** If false, this column is not sortable. Default: true. */
  sortable?: boolean;
  /** Minimum width (CSS value). */
  minWidth?: string;
  /** Text alignment. */
  align?: "left" | "right" | "center";
};

type Props<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  /** If provided, a search input filters rows across all columns (or only these keys). */
  searchKeys?: (keyof T & string)[];
  searchPlaceholder?: string;
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  /** Optional action area (e.g., "New" button) shown in the toolbar. */
  toolbar?: ReactNode;
  /** Stable row id for keying. Defaults to index. */
  getRowId?: (row: T, index: number) => string;
};

/**
 * Standard casino-themed data table. Built on TanStack Table for battle-tested
 * sort / filter / paginate semantics; styling is fully custom.
 *
 * Usage:
 *   <DataTable<AppUser>
 *     data={users}
 *     columns={[
 *       { key: "matricula", header: "Matrícula" },
 *       { key: "fullName", header: "Nombre", cell: (u) => u.fullName ?? "—" },
 *     ]}
 *     searchKeys={["matricula", "fullName"]}
 *   />
 */
export function DataTable<T>({
  data,
  columns,
  searchKeys,
  searchPlaceholder = "Buscar…",
  pageSize = 10,
  loading,
  emptyMessage = "Sin resultados",
  toolbar,
  getRowId,
}: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const tanstackColumns = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((c) => ({
        id: c.key,
        accessorFn: (row: T) => row[c.key],
        header: c.header,
        enableSorting: c.sortable !== false,
        cell: ({ row }) =>
          c.cell ? c.cell(row.original) : String(row.original[c.key] ?? ""),
      })),
    [columns],
  );

  const globalFilterFn = useMemo(() => {
    return (row: { original: T }, _columnId: string, filterValue: string) => {
      if (!filterValue) return true;
      const needle = filterValue.toLowerCase();
      const keys = (searchKeys ?? columns.map((c) => c.key)) as (keyof T &
        string)[];
      return keys.some((k) => {
        const v = row.original[k];
        return v != null && String(v).toLowerCase().includes(needle);
      });
    };
  }, [columns, searchKeys]);

  const table = useReactTable({
    data,
    columns: tanstackColumns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
    getRowId: getRowId
      ? (row, index) => getRowId(row, index)
      : (_row, index) => String(index),
  });

  const rows = table.getRowModel().rows;
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: search + optional action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        {searchKeys !== null && (
          <div className="sm:max-w-sm sm:flex-1">
            <Input
              label="Buscar"
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
        )}
        {toolbar && <div className="flex gap-2">{toolbar}</div>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl bg-[--color-smoke-800]/70 shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
        <table className="w-full text-left text-sm">
          <thead className="font-label text-xs tracking-widest text-[--color-cream]/70">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-[--color-felt-900]/70">
                {hg.headers.map((h) => {
                  const colDef = columns.find((c) => c.key === h.column.id);
                  const sortDir = h.column.getIsSorted();
                  const canSort = h.column.getCanSort();
                  return (
                    <th
                      key={h.id}
                      scope="col"
                      style={{
                        minWidth: colDef?.minWidth,
                        textAlign: colDef?.align ?? "left",
                      }}
                      className={[
                        "px-4 py-3 whitespace-nowrap",
                        canSort ? "cursor-pointer select-none" : "",
                      ].join(" ")}
                      onClick={
                        canSort
                          ? h.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(
                          h.column.columnDef.header,
                          h.getContext(),
                        )}
                        {canSort && (
                          <span
                            aria-hidden
                            className={[
                              "text-[10px]",
                              sortDir
                                ? "text-[--color-gold-400]"
                                : "text-[--color-cream]/30",
                            ].join(" ")}
                          >
                            {sortDir === "asc"
                              ? "▲"
                              : sortDir === "desc"
                                ? "▼"
                                : "⇅"}
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="text-[--color-ivory]">
            {loading && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center font-label text-[--color-cream]/60"
                >
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center font-label text-[--color-cream]/60"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={[
                    "border-t border-[--color-gold-500]/10 transition hover:bg-[--color-felt-700]/15",
                    i % 2 === 0
                      ? "bg-transparent"
                      : "bg-[--color-smoke-700]/30",
                  ].join(" ")}
                >
                  {row.getVisibleCells().map((cell) => {
                    const colDef = columns.find(
                      (c) => c.key === cell.column.id,
                    );
                    return (
                      <td
                        key={cell.id}
                        style={{ textAlign: colDef?.align ?? "left" }}
                        className="px-4 py-3 whitespace-nowrap"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-label text-xs tracking-wider text-[--color-cream]/60">
          {totalFiltered === 0
            ? "0 resultados"
            : `${pageIndex * pageSize + 1}–${Math.min(
                (pageIndex + 1) * pageSize,
                totalFiltered,
              )} de ${totalFiltered}`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            ← Anterior
          </Button>
          <span className="font-label text-xs text-[--color-cream]/70">
            {pageCount === 0 ? "—" : `${pageIndex + 1} / ${pageCount}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente →
          </Button>
        </div>
      </div>
    </div>
  );
}
