import { useState, useMemo, useCallback, useRef, type ReactNode } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type ColumnOrderState,
} from "@tanstack/react-table";
import { Pagination, Tooltip } from "@heroui/react";
import { Pencil, Trash2, ChevronUp, ChevronDown, Columns3, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

/* ------------------------------------------------------------------ */
/*  Public interface                                                    */
/* ------------------------------------------------------------------ */

export interface DataGridColumn<T> {
  id: string;
  header: string;
  accessorFn: (row: T) => unknown;
  cell: (value: unknown, row: T) => ReactNode;
  size?: number;
  minSize?: number;
  enableResizing?: boolean;
  enableSorting?: boolean;
}

export interface DataGridProps<T> {
  data: T[];
  columns: DataGridColumn<T>[];
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onBulkDelete?: (rows: T[]) => void;
  pageSize?: number;
  searchValue?: string;
  getRowId: (row: T) => string;
  /** Renders external toolbar — receives column toggle element */
  renderToolbar?: (columnToggle: ReactNode) => ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DataGrid<T>({
  data,
  columns: userColumns,
  onRowClick,
  onEdit,
  onDelete,
  onBulkDelete,
  pageSize = 15,
  searchValue = "",
  getRowId,
  renderToolbar,
}: DataGridProps<T>) {
  const { t } = useTranslation();

  /* ---- state ---- */
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [showColMenu, setShowColMenu] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  /* drag-and-drop state */
  const dragCol = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  /* ---- build TanStack columns ---- */
  const tanstackColumns = useMemo<ColumnDef<T, unknown>[]>(() => {
    const cols: ColumnDef<T, unknown>[] = [];

    // Checkbox column
    cols.push({
      id: "_select",
      size: 40,
      minSize: 40,
      maxSize: 40,
      enableResizing: false,
      enableSorting: false,
      header: ({ table }) => (
        <input
          type="checkbox"
          aria-label={t("common.all")}
          className="accent-tyro-navy w-3.5 h-3.5 cursor-pointer"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          aria-label={t("grid.selected")}
          className="accent-tyro-navy w-3.5 h-3.5 cursor-pointer"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    });

    // User-defined columns
    for (const uc of userColumns) {
      cols.push({
        id: uc.id,
        accessorFn: uc.accessorFn,
        header: uc.header,
        cell: (info) => uc.cell(info.getValue(), info.row.original),
        size: uc.size ?? 150,
        minSize: uc.minSize ?? 80,
        enableResizing: uc.enableResizing !== false,
        enableSorting: uc.enableSorting !== false,
      });
    }

    // Actions column — HeroUI style with Tooltips
    if (onEdit || onDelete || onRowClick) {
      cols.push({
        id: "_actions",
        size: 100,
        minSize: 100,
        maxSize: 100,
        enableResizing: false,
        enableSorting: false,
        header: "",
        cell: ({ row }) => (
          <div
            className="relative flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {onRowClick && (
              <Tooltip content={t("common.detail")} size="sm">
                <button
                  aria-label={t("common.detail")}
                  onClick={() => onRowClick(row.original)}
                  className="text-lg text-tyro-text-muted/60 cursor-pointer active:opacity-50 hover:text-tyro-navy transition-colors"
                >
                  <Eye size={16} />
                </button>
              </Tooltip>
            )}
            {onEdit && (
              <Tooltip content={t("common.edit")} size="sm">
                <button
                  aria-label={t("common.edit")}
                  onClick={() => onEdit(row.original)}
                  className="text-lg text-tyro-text-muted/60 cursor-pointer active:opacity-50 hover:text-tyro-navy transition-colors"
                >
                  <Pencil size={16} />
                </button>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip content={t("common.delete")} color="danger" size="sm">
                <button
                  aria-label={t("common.delete")}
                  onClick={() => {
                    if (window.confirm(t("grid.deleteConfirm"))) {
                      onDelete(row.original);
                    }
                  }}
                  className="text-lg text-tyro-text-muted/60 cursor-pointer active:opacity-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </Tooltip>
            )}
          </div>
        ),
      });
    }

    return cols;
  }, [userColumns, onEdit, onDelete, t]);

  /* ---- table instance ---- */
  const table = useReactTable({
    data,
    columns: tanstackColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnOrder: columnOrder.length > 0 ? columnOrder : undefined,
      globalFilter: searchValue,
    },
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    getRowId: (row) => getRowId(row),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: { pageSize },
    },
  });

  /* ---- helpers ---- */
  const selectedCount = Object.keys(rowSelection).length;
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();
  const startIdx = pageIndex * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalRows);

  const handleBulkDelete = useCallback(() => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((r) => r.original);
    if (selectedRows.length === 0) return;
    if (
      window.confirm(t("grid.deleteConfirm"))
    ) {
      if (onBulkDelete) {
        onBulkDelete(selectedRows);
      } else if (onDelete) {
        for (const row of selectedRows) onDelete(row);
      }
      setRowSelection({});
    }
  }, [table, onBulkDelete, onDelete]);

  /* ---- drag handlers ---- */
  const handleDragStart = useCallback((colId: string) => {
    dragCol.current = colId;
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, colId: string) => {
      e.preventDefault();
      if (dragCol.current && dragCol.current !== colId) {
        setDragOverCol(colId);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (colId: string) => {
      if (!dragCol.current || dragCol.current === colId) {
        dragCol.current = null;
        setDragOverCol(null);
        return;
      }
      const currentOrder =
        columnOrder.length > 0
          ? [...columnOrder]
          : table.getAllLeafColumns().map((c) => c.id);
      const fromIdx = currentOrder.indexOf(dragCol.current);
      const toIdx = currentOrder.indexOf(colId);
      if (fromIdx !== -1 && toIdx !== -1) {
        currentOrder.splice(fromIdx, 1);
        currentOrder.splice(toIdx, 0, dragCol.current);
        setColumnOrder(currentOrder);
      }
      dragCol.current = null;
      setDragOverCol(null);
    },
    [columnOrder, table]
  );

  const handleDragEnd = useCallback(() => {
    dragCol.current = null;
    setDragOverCol(null);
  }, []);

  /* ---- visibility toggle columns (exclude special) ---- */
  const toggleableColumns = table
    .getAllLeafColumns()
    .filter((c) => c.id !== "_select" && c.id !== "_actions");

  /* ---- column toggle element (for external toolbar) ---- */
  const columnToggleEl = (
    <div className="relative" ref={colMenuRef}>
      <button
        onClick={() => setShowColMenu((v) => !v)}
        className="flex items-center gap-1.5 h-9 px-3 rounded-button border border-tyro-border/60 bg-tyro-surface text-[11px] font-medium text-tyro-text-muted hover:text-tyro-text-primary hover:border-tyro-navy/20 shadow-tyro-sm transition-colors cursor-pointer"
      >
        <Columns3 size={14} />
        {t("common.columns")}
      </button>
      {showColMenu && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-tyro-surface border border-tyro-border/40 rounded-lg shadow-tyro-md z-50 py-1">
          {toggleableColumns.map((col) => (
            <label
              key={col.id}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-tyro-text-secondary hover:bg-tyro-bg cursor-pointer"
            >
              <input
                type="checkbox"
                checked={col.getIsVisible()}
                onChange={col.getToggleVisibilityHandler()}
                className="accent-tyro-navy w-3 h-3"
              />
              {typeof col.columnDef.header === "string" ? col.columnDef.header : col.id}
            </label>
          ))}
        </div>
      )}
    </div>
  );

  /* ---- visible user columns (for mobile card) ---- */
  const visibleUserColumns = useMemo(
    () => userColumns.filter((c) => columnVisibility[c.id] !== false),
    [userColumns, columnVisibility]
  );

  /* ---- render ---- */
  return (
    <>
    {/* External toolbar slot */}
    {renderToolbar && renderToolbar(columnToggleEl)}

    <div className="bg-tyro-surface/80 backdrop-blur-sm rounded-[18px] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] border border-tyro-border/15 overflow-hidden">
      {/* Selection toolbar — only visible when rows selected */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5">
          <span className="text-xs font-semibold text-tyro-navy">
            {selectedCount} {t("grid.selected")}
          </span>
          {(onDelete || onBulkDelete) && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
              {t("common.delete")}
            </button>
          )}
        </div>
      )}

      {/* ======== MOBILE CARD VIEW (< 640px) ======== */}
      <div className="block sm:hidden">
        {table.getRowModel().rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-tyro-text-muted">
            {t("common.noResults")}
          </div>
        ) : (
          <div className="divide-y divide-tyro-border/30">
            {table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className="px-4 py-3.5 active:bg-default-100 transition-colors cursor-pointer"
              >
                {/* Card body — show all visible columns as label:value pairs */}
                <div className="space-y-1.5">
                  {visibleUserColumns.map((col, idx) => {
                    const value = col.accessorFn(row.original);
                    return (
                      <div key={col.id} className={idx === 0 ? "mb-2" : ""}>
                        {idx === 0 ? (
                          <div className="text-sm font-semibold text-tyro-text-primary leading-snug">
                            {col.cell(value, row.original)}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-tyro-text-muted shrink-0">
                              {col.header}
                            </span>
                            <span className="text-[12px] text-tyro-text-secondary text-right truncate">
                              {col.cell(value, row.original)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Card actions */}
                {(onEdit || onDelete) && (
                  <div
                    className="flex items-center gap-3 mt-3 pt-2.5 border-t border-tyro-border/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {onRowClick && (
                      <button
                        aria-label={t("common.detail")}
                        onClick={() => onRowClick(row.original)}
                        className="flex items-center gap-1.5 px-3 h-9 min-w-[44px] rounded-lg text-xs font-medium text-tyro-navy bg-tyro-navy/5 hover:bg-tyro-navy/10 transition-colors"
                      >
                        <Eye size={14} /> {t("common.detail")}
                      </button>
                    )}
                    {onEdit && (
                      <button
                        aria-label={t("common.edit")}
                        onClick={() => onEdit(row.original)}
                        className="flex items-center gap-1.5 px-3 h-9 min-w-[44px] rounded-lg text-xs font-medium text-tyro-text-secondary bg-tyro-bg hover:bg-tyro-border/30 transition-colors"
                      >
                        <Pencil size={14} /> {t("common.edit")}
                      </button>
                    )}
                    {onDelete && (
                      <button
                        aria-label={t("common.delete")}
                        onClick={() => {
                          if (window.confirm(t("grid.deleteConfirm"))) {
                            onDelete(row.original);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 h-9 min-w-[44px] rounded-lg text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors ml-auto"
                      >
                        <Trash2 size={14} /> {t("common.delete")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======== DESKTOP TABLE VIEW (>= 640px) ======== */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-[13px]" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr className="bg-tyro-bg sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => {
                  const isSpecial =
                    header.id === "_select" || header.id === "_actions";
                  const isDraggable = !isSpecial;
                  const isDragTarget = dragOverCol === header.id;

                  return (
                    <th
                      key={header.id}
                      className={
                        "relative px-4 py-3 text-left text-[12px] font-semibold text-tyro-text-secondary select-none" +
                        (header.column.getCanSort()
                          ? " cursor-pointer hover:text-tyro-navy transition-colors"
                          : "") +
                        (isDragTarget ? " border-l-2 border-l-tyro-navy" : "") +
                        (header.id === "_select"
                          ? " sticky left-0 z-20 bg-tyro-bg"
                          : "") +
                        (header.id === "_actions"
                          ? " sticky right-0 z-20 bg-tyro-bg"
                          : "")
                      }
                      style={{ width: header.getSize() }}
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      draggable={isDraggable}
                      onDragStart={
                        isDraggable
                          ? () => handleDragStart(header.id)
                          : undefined
                      }
                      onDragOver={
                        isDraggable
                          ? (e) => handleDragOver(e, header.id)
                          : undefined
                      }
                      onDrop={
                        isDraggable
                          ? () => handleDrop(header.id)
                          : undefined
                      }
                      onDragEnd={handleDragEnd}
                    >
                      <span className="inline-flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getIsSorted() === "asc" && (
                          <ChevronUp size={12} className="text-tyro-navy" />
                        )}
                        {header.column.getIsSorted() === "desc" && (
                          <ChevronDown size={12} className="text-tyro-navy" />
                        )}
                      </span>
                      {/* Column separator — half-height subtle divider */}
                      {!isSpecial && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-4 bg-tyro-text-muted/20 pointer-events-none" />
                      )}
                      {/* Resize handle */}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          onClick={(e) => e.stopPropagation()}
                          className={
                            "absolute right-0 top-0 w-[3px] h-full cursor-col-resize select-none touch-none transition-colors" +
                            (header.column.getIsResizing()
                              ? " bg-tyro-navy/40"
                              : " bg-transparent hover:bg-tyro-navy/20")
                          }
                        />
                      )}
                    </th>
                  );
                })
              )}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const isSelected = row.getIsSelected();
              return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={
                    "group transition-all duration-150 cursor-pointer" +
                    (isSelected
                      ? " bg-primary/5"
                      : " hover:bg-default-100") +
                    " active:opacity-70"
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={
                        "px-4 py-3 text-tyro-text-secondary" +
                        (cell.column.id === "_select"
                          ? " sticky left-0 z-10 bg-inherit"
                          : "") +
                        (cell.column.id === "_actions"
                          ? " sticky right-0 z-10 bg-inherit"
                          : "")
                      }
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td
                  colSpan={tanstackColumns.length}
                  className="px-4 py-12 text-center text-sm text-tyro-text-muted"
                >
                  {t("common.noResults")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalRows > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-tyro-bg/50">
          <span className="text-xs text-tyro-text-muted">
            {startIdx + 1} - {endIdx} / {totalRows} {t("grid.records")}
          </span>
          <Pagination
            total={totalPages}
            page={pageIndex + 1}
            onChange={(p) => table.setPageIndex(p - 1)}
            size="sm"
            color="primary"
            showControls
            classNames={{ cursor: "bg-tyro-navy" }}
          />
        </div>
      )}
    </div>
    </>
  );
}
