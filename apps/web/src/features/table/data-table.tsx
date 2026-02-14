"use client";
"use no memo";

import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  Row,
  RowSelectionState,
  SortingState,
  Table as TanTable,
  VisibilityState,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onClick?: (row: TData) => void;
  isActive?: (row: TData) => boolean;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  renderBulkActions?: (args: {
    selectedRows: Row<TData>[];
    table: TanTable<TData>;
  }) => React.ReactNode;
};

export const DataTable = <TData, TValue>({
  columns,
  data,
  onClick,
  isActive,
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange,
  renderBulkActions,
}: DataTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Use external column visibility if provided, otherwise use internal state
  const columnVisibility = externalColumnVisibility ?? internalColumnVisibility;
  const setColumnVisibility = onColumnVisibilityChange ?? setInternalColumnVisibility;

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: {
      //   pagination: {
      //     pageIndex: page - 1,
      //     pageSize: perPage,
      //   },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  return (
    <div className="relative w-full overflow-hidden">
      <Table className="contain-[paint]">
        <TableHeader className="bg-transparent">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className={cn(hasSelection && "border-primary border-b")}
            >
              {headerGroup.headers.map((header) => {
                const isSelectHeader = header.column.id === "select";
                const isActionsHeader = header.column.id === "actions";
                if (hasSelection) {
                  if (header.index === 1) {
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "text-foreground",
                          isSelectHeader &&
                            'after:content-[" "] sticky left-0 z-30 bg-transparent px-3 text-center after:absolute after:top-0 after:right-0 after:bottom-0 after:w-px after:bg-transparent dark:after:bg-transparent',
                          isActionsHeader &&
                            'after:content-[" "] sticky right-0 z-30 bg-transparent pr-3 pl-4 text-right after:absolute after:top-0 after:bottom-0 after:left-0 after:w-px after:bg-transparent dark:after:bg-transparent'
                        )}
                      >
                        {selectedRows.length} row{selectedRows.length !== 1 ? "s" : ""} selected
                      </TableHead>
                    );
                  }
                  if (isActionsHeader) {
                    return (
                      <TableHead
                        key={header.id}
                        className='after:content-[" "] sticky right-0 z-30 bg-transparent pr-3 pl-4 text-right after:absolute after:top-0 after:bottom-0 after:left-0 after:w-px after:bg-transparent dark:after:bg-transparent'
                      >
                        {renderBulkActions?.({ selectedRows, table })}
                      </TableHead>
                    );
                  }
                }
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      hasSelection && header.id !== "select" && "opacity-0",
                      isSelectHeader &&
                        'after:content-[" "] bg-background/60 sticky left-0 z-30 px-3 text-center backdrop-blur-sm after:absolute after:top-0 after:right-0 after:bottom-0 after:w-px after:bg-transparent dark:after:bg-transparent',
                      isActionsHeader &&
                        'after:content-[" "] bg-background/60 sticky right-0 z-30 pr-3 pl-4 text-right backdrop-blur-sm after:absolute after:top-0 after:bottom-0 after:left-0 after:w-px after:bg-transparent dark:after:bg-transparent'
                    )}
                  >
                    {header.isPlaceholder ? null : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        {/* } */}
        <TableBody>
          {table.getRowModel().rows?.length ?
            table.getRowModel().rows.map((row) => (
              <TableRow
                className={cn(
                  "hover:bg-primary/50 data-[state=selected]:bg-primary/80 cursor-pointer border-b transition-colors",
                  isActive && isActive(row.original) && "ring-primary rounded-md ring-2 ring-inset"
                )}
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => {
                  const isSelectCell = cell.column.id === "select";
                  const isActionsCell = cell.column.id === "actions";
                  return (
                    <TableCell
                      key={cell.id}
                      onClick={() => {
                        if (isActionsCell || isSelectCell) return;
                        onClick?.(row.original);
                      }}
                      className={cn(
                        isSelectCell &&
                          'after:content-[" "] bg-background/60 sticky left-0 z-20 px-3 text-center backdrop-blur-sm will-change-transform after:absolute after:top-0 after:right-0 after:bottom-0 after:w-px after:bg-transparent dark:after:bg-transparent',
                        isActionsCell &&
                          'after:content-[" "] bg-background/60 sticky right-0 z-20 pr-3 pl-4 text-right backdrop-blur-sm will-change-transform after:absolute after:top-0 after:bottom-0 after:left-0 after:w-px after:bg-transparent dark:after:bg-transparent',
                        isActionsCell && hasSelection && "pointer-events-none"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, {
                        ...cell.getContext(),
                        hasSelection,
                      })}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          : <TableRow>
              <TableCell colSpan={columns.length}>No results.</TableCell>
            </TableRow>
          }
        </TableBody>
      </Table>
    </div>
  );
};
