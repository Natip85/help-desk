"use client";

import { createSerializer, useQueryStates } from "nuqs";
import { parseAsBoolean, parseAsString } from "nuqs/server";

import { useSidebar } from "./right-sidebar";

type Sidebars =
  | "filterOpen"
  | "filterSaving"
  | "contactId"
  | "ticketStatusesId"
  | "cannedResponsesId"
  | "editSavedFilterId";

export const sidebarParamsParser = {
  filterOpen: parseAsString,
  filterSaving: parseAsBoolean.withDefault(false),
  contactId: parseAsString,
  ticketStatusesId: parseAsString,
  cannedResponsesId: parseAsString,
  editSavedFilterId: parseAsString,
};

const emptySidebarParams: Record<Sidebars, null> = {
  filterOpen: null,
  filterSaving: null,
  contactId: null,
  ticketStatusesId: null,
  cannedResponsesId: null,
  editSavedFilterId: null,
};

export const sidebarParamsSerializer = createSerializer(sidebarParamsParser);

export const useSidebarParams = () => {
  const [sidebarParams, setSidebarParams] = useQueryStates(sidebarParamsParser);
  const { setOpen, setOpenMobile, isMobile } = useSidebar("right");

  // Helper to set the correct sidebar state based on device
  const setSidebarOpen = (open: boolean) => {
    if (isMobile) {
      setOpenMobile(open);
    } else {
      setOpen(open);
    }
  };

  const toggleFilterOpen = (filter = "new") => {
    void setSidebarParams((prev) => {
      const filterOpen = prev.filterOpen === filter ? null : filter;
      setSidebarOpen(!!filterOpen);
      return {
        ...emptySidebarParams,
        filterOpen,
      };
    });
  };

  const toggleFilterSaving = () => {
    void setSidebarParams((prev) => {
      const filterSaving = !prev.filterSaving || null;
      setSidebarOpen(!!filterSaving);
      return {
        ...emptySidebarParams,
        filterSaving,
      };
    });
  };

  const toggleContactSidebarId = (id: string) => {
    void setSidebarParams((prev) => {
      const contactId = prev.contactId === id ? null : id;
      setSidebarOpen(!!contactId);
      return {
        ...emptySidebarParams,
        contactId,
      };
    });
  };
  const toggleTicketStatusesSidebarId = (id: string, open?: boolean) => {
    void setSidebarParams((prev) => {
      const ticketStatusesId = open ?? (prev.ticketStatusesId === id ? null : id);
      setSidebarOpen(!!ticketStatusesId);
      return {
        ...emptySidebarParams,
        ticketStatusesId: ticketStatusesId ? id : null,
      };
    });
  };
  const toggleCannedResponsesSidebarId = (id: string, open?: boolean) => {
    void setSidebarParams((prev) => {
      const cannedResponsesId = open ?? (prev.cannedResponsesId === id ? null : id);
      setSidebarOpen(!!cannedResponsesId);
      return {
        ...emptySidebarParams,
        cannedResponsesId: cannedResponsesId ? id : null,
      };
    });
  };

  const setFilterOpenId = (newFilterOpen: string) => {
    void setSidebarParams((prev) => {
      const filterOpen = prev.filterOpen === newFilterOpen ? null : newFilterOpen;
      setSidebarOpen(!!filterOpen);
      return {
        ...emptySidebarParams,
        filterOpen,
      };
    });
  };

  const toggleEditSavedFilter = (id: string) => {
    void setSidebarParams((prev) => {
      const editSavedFilterId = prev.editSavedFilterId === id ? null : id;
      setSidebarOpen(!!editSavedFilterId);
      return {
        ...emptySidebarParams,
        editSavedFilterId,
      };
    });
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    void setSidebarParams(null);
  };

  return {
    sidebarParams,
    toggleFilterSaving,
    toggleFilterOpen,
    toggleContactSidebarId,
    setFilterOpenId,
    setSidebarParams,
    closeSidebar,
    toggleTicketStatusesSidebarId,
    toggleCannedResponsesSidebarId,
    toggleEditSavedFilter,
  };
};
