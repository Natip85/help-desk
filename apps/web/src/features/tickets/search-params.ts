import { useMemo } from "react";
import { debounce } from "lodash-es";
import { useQueryStates } from "nuqs";
import { createLoader, parseAsInteger, parseAsJson, parseAsString } from "nuqs/server";
import z from "zod";

import type { TicketFilter } from "@help-desk/db/validators/ticket-filter";
import { ticketFilterSchema } from "@help-desk/db/validators/ticket-filter";
import { ticketSortSchema } from "@help-desk/db/validators/ticket-sort";

const viewModeSchema = z.enum(["list", "card"]);
export type ViewMode = z.infer<typeof viewModeSchema>;

export const ticketSearchParamsParser = {
  q: parseAsString.withDefault(""),
  limit: parseAsInteger.withDefault(50),
  page: parseAsInteger.withDefault(1),
  viewMode: parseAsJson((value) => viewModeSchema.parse(value)).withDefault("card"),
  sort: parseAsJson((value) => ticketSortSchema.parse(value)).withDefault([
    { field: "createdAt", direction: "desc" },
  ]),
  filter: parseAsJson((value) => ticketFilterSchema.optional().parse(value)).withDefault({}),
};

export const loadTicketSearchParams = createLoader(ticketSearchParamsParser);

export const useTicketSearchParams = ({ debounceMs = 500 }: { debounceMs?: number } = {}) => {
  const [searchParams, setSearchParams] = useQueryStates(ticketSearchParamsParser);

  const debouncedSetSearchParams = useMemo(
    () => debounce(setSearchParams, debounceMs),
    [setSearchParams, debounceMs]
  );

  const resetFilters = async (filter?: TicketFilter) => {
    const newFilter = filter ?? {};
    await setSearchParams({ filter: newFilter });
  };

  return {
    searchParams,
    setSearchParams,
    debouncedSetSearchParams,
    resetFilters,
  };
};
