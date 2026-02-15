import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { FilterFormContent } from "@/features/filters/filter-form-content";
import { useTicketSearchParams } from "../tickets/search-params";
import { useSidebarParams } from "./query-params";

// ─── Main sidebar ───────────────────────────────────────────────────────────

export const TicketFilterSidebar = () => {
  const {
    searchParams: { filter },
    setSearchParams,
    resetFilters,
  } = useTicketSearchParams();
  const { setSidebarParams } = useSidebarParams();

  return (
    <>
      <SidebarHeader className="border-accent/50 relative border-b p-2">
        <h2 className="text-lg font-medium">Filters</h2>
      </SidebarHeader>

      <SidebarContent className="scrollbar-gutter-stable flex flex-1 flex-col overflow-y-auto p-3">
        <FilterFormContent
          filter={filter}
          onFilterChange={(newFilter) => {
            void setSearchParams({ page: 1, filter: newFilter });
          }}
        />
      </SidebarContent>

      <SidebarFooter className="border-accent/50 flex flex-col items-center gap-2 border-t p-3">
        <Button
          variant="outline"
          className="bg-accent/50 w-full"
          onClick={() => {
            void setSidebarParams({ contactId: null, filterSaving: true });
          }}
        >
          <Plus /> Save filter
        </Button>
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => {
            void resetFilters();
          }}
        >
          <Trash2 /> Reset filters
        </Button>
      </SidebarFooter>
    </>
  );
};
