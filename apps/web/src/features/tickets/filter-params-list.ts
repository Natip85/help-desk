"use client";

import { useMemo } from "react";

import type { TicketFilter } from "@help-desk/db/validators/ticket-filter";

import { useTicketSearchParams } from "./search-params";

export const useFilterParamsList = () => {
  const {
    searchParams: { filter },
  } = useTicketSearchParams();
  const filterKeys = useMemo(() => mapFilters(filter), [filter]);

  const filterCount = useMemo(() => {
    // Count *active filter groups*, not the number of possible keys.
    // Example: 2 priorities + 1 status => 2 (priorities + statuses)
    return Object.values(filterKeys).filter((count) => count > 0).length;
  }, [filterKeys]);

  return { filterKeys, filterCount };
};

export const mapFilters = (filter?: TicketFilter): Record<string, number> => {
  const customFieldEntries = Object.fromEntries(
    Object.entries(filter?.customFields ?? {}).map(([key, values]) => [
      `custom:${key}`,
      values.length,
    ])
  );

  return {
    statuses: filter?.statuses?.length ?? 0,
    priorities: filter?.priorities?.length ?? 0,
    channels: filter?.channels?.length ?? 0,
    assignedToIds: (filter?.assignedToIds?.length ?? 0) + (filter?.isUnassigned ? 1 : 0),
    contactIds: filter?.contactIds?.length ?? 0,
    companyIds: filter?.companyIds?.length ?? 0,
    mailboxIds: filter?.mailboxIds?.length ?? 0,
    tagIds: filter?.tagIds?.length ?? 0,
    createdAt: filter?.createdAt?.from || filter?.createdAt?.to ? 1 : 0,
    lastMessageAt: filter?.lastMessageAt?.from || filter?.lastMessageAt?.to ? 1 : 0,
    closedAt: filter?.closedAt?.from || filter?.closedAt?.to ? 1 : 0,
    ...customFieldEntries,
  };
};
