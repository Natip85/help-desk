import { useMemo } from "react";
import { debounce } from "lodash-es";
import { useQueryStates } from "nuqs";
import { createLoader, parseAsInteger, parseAsJson, parseAsString } from "nuqs/server";
import z from "zod";

import { contactSortSchema } from "@help-desk/db/validators/contact-sort";

const viewModeSchema = z.enum(["card", "list"]);
export type ViewMode = z.infer<typeof viewModeSchema>;

export const contactSearchParamsParser = {
  q: parseAsString.withDefault(""),
  limit: parseAsInteger.withDefault(50),
  page: parseAsInteger.withDefault(1),
  viewMode: parseAsJson((value) => viewModeSchema.parse(value)).withDefault("card"),
  sort: parseAsJson((value) => contactSortSchema.parse(value)).withDefault([
    { field: "createdAt", direction: "desc" },
  ]),
};

export const loadContactSearchParams = createLoader(contactSearchParamsParser);

export const useContactSearchParams = ({ debounceMs = 500 }: { debounceMs?: number } = {}) => {
  const [searchParams, setSearchParams] = useQueryStates(contactSearchParamsParser);

  const debouncedSetSearchParams = useMemo(
    () => debounce(setSearchParams, debounceMs),
    [setSearchParams, debounceMs]
  );

  return {
    searchParams,
    setSearchParams,
    debouncedSetSearchParams,
  };
};
