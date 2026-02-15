"use client";

import { useQuery } from "@tanstack/react-query";
import { isEqual } from "lodash-es";
import { BookmarkIcon, CheckIcon, ChevronDown, ListFilter, Loader2 } from "lucide-react";

import type { TicketFilter } from "@help-desk/db/validators/ticket-filter";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTRPC } from "@/trpc";
import { useTicketSearchParams } from "./search-params";

/** Check whether two TicketFilter objects represent the same criteria. */
function filtersMatch(a: TicketFilter | undefined, b: TicketFilter | undefined): boolean {
  // Treat {} and undefined as equivalent (no filter)
  const normalize = (f: TicketFilter | undefined) =>
    f && Object.keys(f).length > 0 ? f : undefined;
  return isEqual(normalize(a), normalize(b));
}

export const SavedFilterDropdown = () => {
  const trpc = useTRPC();
  const { searchParams, setSearchParams, resetFilters } = useTicketSearchParams();

  const { data, isLoading } = useQuery(trpc.savedFilter.all.queryOptions());

  const savedFilters = data?.items ?? [];
  const currentFilter = searchParams.filter;

  const activeFilter = savedFilters.find((sf) => filtersMatch(sf.filter, currentFilter));

  const handleSelect = (filter: TicketFilter) => {
    void setSearchParams({ filter, page: 1 });
  };

  const handleClear = () => {
    void resetFilters();
  };

  const hasActiveFilter =
    currentFilter && Object.keys(currentFilter).length > 0 && !filtersMatch(currentFilter, {});

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2"
        >
          <ListFilter className="size-4" />
          {activeFilter ? activeFilter.title : "Saved Filters"}
          <ChevronDown className="size-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        {/* Clear / All Tickets option */}
        <DropdownMenuItem
          onClick={handleClear}
          className="flex items-center justify-between gap-4"
        >
          All Tickets
          {!hasActiveFilter && <CheckIcon className="size-3.5" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          </div>
        )}

        {!isLoading && savedFilters.length === 0 && (
          <div className="text-muted-foreground flex items-center gap-2 px-2 py-4 text-xs">
            <BookmarkIcon className="size-3.5" />
            No saved filters yet
          </div>
        )}

        {savedFilters.map((sf) => {
          const isActive = activeFilter?.id === sf.id;
          return (
            <DropdownMenuItem
              key={sf.id}
              onClick={() => handleSelect(sf.filter)}
              className="flex items-center justify-between gap-4"
            >
              <span className="truncate">{sf.title}</span>
              {isActive && <CheckIcon className="size-3.5" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
