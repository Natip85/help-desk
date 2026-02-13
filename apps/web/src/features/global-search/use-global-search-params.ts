"use client";

import { useQueryStates } from "nuqs";
import { parseAsString } from "nuqs/server";

export const globalSearchParamsParser = {
  globalSearchQuery: parseAsString.withDefault(""),
};

export function useGlobalSearchParams() {
  const [globalSearchParams, setGlobalSearchParams] = useQueryStates(globalSearchParamsParser);

  const setGlobalSearchQuery = (query: string) => {
    void setGlobalSearchParams((prev) => ({
      ...prev,
      globalSearchQuery: query,
    }));
  };

  return {
    globalSearchParams,
    setGlobalSearchQuery,
  };
}
