"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { FilterType } from "@help-desk/db/validators/default-filter";

import { useTRPC } from "@/trpc";

type FilterOption = {
  value: string;
  label: string;
  position: number;
};

type DefaultFilterData = {
  id: string;
  name: string;
  displayName: string;
  type: FilterType;
  options: FilterOption[];
  isSystem: boolean;
  position: number;
};

/**
 * Fetches default filters from the API and provides helpers
 * to look up filter options by filter name.
 */
export function useDefaultFilters() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.defaultFilter.list.queryOptions());

  return useMemo(() => {
    const filters = (data?.items ?? []) as DefaultFilterData[];

    const filterMap = new Map<string, DefaultFilterData>();
    for (const f of filters) {
      filterMap.set(f.name, f);
    }

    /** Get all options for a filter by its key name (e.g. "priority") */
    function getOptions(name: string): FilterOption[] {
      const f = filterMap.get(name);
      if (!f) return [];
      return [...f.options].sort((a, b) => a.position - b.position);
    }

    /** Get the option values as a readonly tuple for a filter by name */
    function getValues(name: string): string[] {
      return getOptions(name).map((o) => o.value);
    }

    /** Look up a single option's label by filter name + value */
    function getLabel(name: string, value: string): string {
      const opt = getOptions(name).find((o) => o.value === value);
      return opt?.label ?? value;
    }

    /** Get all non-system (custom) filters */
    function getCustomFilters(): DefaultFilterData[] {
      return filters.filter((f) => !f.isSystem);
    }

    return {
      filters,
      filterMap,
      getOptions,
      getValues,
      getLabel,
      getCustomFilters,
    };
  }, [data]);
}
