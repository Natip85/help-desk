"use client";

import { useQueryStates } from "nuqs";
import { parseAsBoolean, parseAsString } from "nuqs/server";

export const globalSearchParamsParser = {
  globalSearchOpen: parseAsBoolean.withDefault(false),
  globalSearchQuery: parseAsString.withDefault(""),
};

export function useGlobalSearchParams() {
  const [globalSearchParams, setGlobalSearchParams] = useQueryStates(globalSearchParamsParser);

  const openGlobalSearch = () => {
    void setGlobalSearchParams((prev) => ({
      ...prev,
      globalSearchOpen: true,
    }));
  };

  const closeGlobalSearch = () => {
    void setGlobalSearchParams((prev) => ({
      ...prev,
      globalSearchOpen: false,
      globalSearchQuery: "",
    }));
  };

  const toggleGlobalSearch = () => {
    if (globalSearchParams.globalSearchOpen) {
      closeGlobalSearch();
    } else {
      openGlobalSearch();
    }
  };

  const setGlobalSearchQuery = (query: string) => {
    void setGlobalSearchParams((prev) => ({
      ...prev,
      globalSearchQuery: query,
    }));
  };

  return {
    globalSearchParams,
    toggleGlobalSearch,
    openGlobalSearch,
    closeGlobalSearch,
    setGlobalSearchQuery,
  };
}
