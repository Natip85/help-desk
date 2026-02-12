import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import type { parseAsJson } from "nuqs";
import { useMemo } from "react";
import { useQueryStates } from "nuqs";
import { z } from "zod/v4";

import type { ColumnMenuOption } from "./columns-menu";

export type GenericTableParams<T, TColumnsList extends Record<string, boolean>[]> = {
  columnLabelsMap: Record<string, string>;
  columnDefs: ColumnDef<T>[];
  availableColumns: readonly string[];
  tableParamsParser: {
    columns: ReturnType<typeof parseAsJson<TColumnsList>>;
  };
};

export type GenericTableReturn<T, TColumnsList extends Record<string, boolean>[]> = {
  columnOptions: ColumnMenuOption[];
  columnVisibility: VisibilityState;
  orderedColumns: ColumnDef<T>[];
  toggleColumnVisibility: (columnName: string) => void;
  updateColumnOrder: (newColumns: ColumnMenuOption[]) => void;
  resetTableParams: () => void;
  updateColumns: (newColumns: TColumnsList) => void;
};

export const useGenericTableParams = <T, TColumnsList extends Record<string, boolean>[]>({
  columnLabelsMap,
  columnDefs,
  availableColumns,
  tableParamsParser,
}: GenericTableParams<T, TColumnsList>): GenericTableReturn<T, TColumnsList> => {
  const [tableParams, setTableParams] = useQueryStates(tableParamsParser);

  const toggleColumnVisibility = (columnName: string) => {
    if (!z.enum(availableColumns).safeParse(columnName).success) {
      return;
    }

    void setTableParams((prev) => ({
      columns: prev.columns?.map((column) => {
        if (Object.keys(column)[0] !== columnName) return column;
        return {
          [columnName]: !column[columnName],
        };
      }) as TColumnsList,
    }));
  };

  const resetTableParams = () => {
    void setTableParams({ columns: null });
  };

  const updateColumnOrder = (newColumns: ColumnMenuOption[]) => {
    void setTableParams({
      columns: newColumns.map((col) => ({
        [col.value]: col.visible,
      })) as TColumnsList,
    });
  };

  const updateColumns = (newColumns: TColumnsList) => {
    void setTableParams({ columns: newColumns });
  };

  const columnOptions = useMemo((): ColumnMenuOption[] => {
    if (!tableParams.columns) return [];

    return tableParams.columns.map((col) => {
      const [value, visible] = Object.entries(col)[0];
      return {
        label: columnLabelsMap[value],
        value,
        visible,
      };
    });
  }, [tableParams.columns, columnLabelsMap]);

  const orderedColumns = useMemo(() => {
    return [...columnDefs].sort((a, b) => {
      if (a.id === "actions") return 1;
      if (b.id === "actions") return -1;
      const aIndex = columnOptions.findIndex((col) => col.value === a.id);
      const bIndex = columnOptions.findIndex((col) => col.value === b.id);
      return aIndex - bIndex;
    });
  }, [columnOptions, columnDefs]);

  const columnVisibility = useMemo(() => {
    if (!tableParams.columns) return {};
    return Object.assign({}, ...tableParams.columns) as VisibilityState;
  }, [tableParams.columns]);

  return {
    columnOptions,
    columnVisibility,
    orderedColumns,
    resetTableParams,
    toggleColumnVisibility,
    updateColumnOrder,
    updateColumns,
  };
};
