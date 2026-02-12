"use client";

import { useEffect, useState } from "react";
import { debounce } from "lodash-es";

import type { TicketSortOption } from "@help-desk/db/validators/ticket-sort";

import type { ViewMode } from "./search-params";
import { useSidebarParams } from "../right-sidebars/query-params";
import { useFilterParamsList } from "./filter-params-list";
import { useTicketSearchParams } from "./search-params";

export function useTicketListControls() {
  const { searchParams, setSearchParams } = useTicketSearchParams();
  const { sidebarParams, toggleFilterOpen } = useSidebarParams();
  const { filterCount } = useFilterParamsList();

  const [inputValue, setInputValue] = useState(searchParams.q);
  const [sorts, setSorts] = useState(searchParams.sort);
  const [viewMode, setViewMode] = useState(searchParams.viewMode);

  const debouncedSetSearchQuery = (value: string) => {
    void setSearchParams({ q: value, page: 1 });
  };

  const debouncedSetSorts = (value: TicketSortOption[]) => {
    void setSearchParams({ sort: value });
  };

  const debouncedSearch = debounce(debouncedSetSearchQuery, 500);
  const debouncedSorts = debounce(debouncedSetSorts, 500);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    debouncedSearch(value);
  };

  const handleSortChange = (value: TicketSortOption[]) => {
    setSorts(value);
    debouncedSorts(value);
  };

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    void setSearchParams({ viewMode: mode });
  };

  const reset = () => {
    setInputValue("");
    void setSearchParams({ q: "", page: 1 });
  };

  useEffect(
    () => () => {
      setSorts([]);
    },
    []
  );

  return {
    inputValue,
    filterCount,
    searchParams,
    sidebarParams,
    sorts,
    viewMode,
    handleInputChange,
    handleSetViewMode,
    handleSortChange,
    reset,
    toggleFilterOpen,
  };
}
