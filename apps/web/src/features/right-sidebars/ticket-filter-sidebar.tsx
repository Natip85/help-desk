import { Fragment } from "react";

import type { ConversationPriority, ConversationStatus } from "@help-desk/db/schema/conversations";
import { conversationPriority, conversationStatus } from "@help-desk/db/schema/conversations";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useTicketSearchParams } from "../tickets/search-params";
import { priorityConfig, statusConfig } from "../tickets/ticket-card";
import { useSidebarParams } from "./query-params";

export const TicketFilterSidebar = () => {
  const priorityAnchor = useComboboxAnchor();
  const statusAnchor = useComboboxAnchor();
  const {
    searchParams: { filter },
    setSearchParams,
    resetFilters,
  } = useTicketSearchParams();
  const {
    sidebarParams: { filterOpen },
    setSidebarParams,
  } = useSidebarParams();

  return (
    <>
      <SidebarHeader className="border-accent/50 relative border-b p-2">
        <h2 className="text-lg font-medium">Filters</h2>
      </SidebarHeader>

      <SidebarContent className="scrollbar-gutter-stable flex-1 overflow-y-auto p-3">
        <SidebarGroup>
          <Combobox
            key={(filter.priorities ?? []).join("|")}
            multiple
            autoHighlight
            items={conversationPriority}
            value={filter.priorities?.length ? filter.priorities : null}
            onValueChange={(values: ConversationPriority[] | null) => {
              const priorities = values ?? [];
              void setSearchParams((prev) => ({
                page: 1,
                filter: {
                  ...prev.filter,
                  priorities: priorities.length > 0 ? priorities : undefined,
                },
              }));
            }}
          >
            <ComboboxChips
              ref={priorityAnchor}
              className="w-full max-w-xs"
            >
              <ComboboxValue>
                {(values: ConversationPriority[] | null) => {
                  const selected = values ?? [];
                  return (
                    <Fragment>
                      {selected.map((value: ConversationPriority) => (
                        <ComboboxChip key={value}>
                          {priorityConfig[value]?.label ?? value}
                        </ComboboxChip>
                      ))}
                      <ComboboxChipsInput placeholder={selected.length > 0 ? "" : "priority"} />
                    </Fragment>
                  );
                }}
              </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent anchor={priorityAnchor}>
              <ComboboxEmpty>No items found.</ComboboxEmpty>
              <ComboboxList>
                {(item: ConversationPriority) => (
                  <ComboboxItem
                    key={item}
                    value={item}
                  >
                    <span>{priorityConfig[item]?.label ?? item}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </SidebarGroup>
        <SidebarGroup>
          <Combobox
            key={(filter.statuses ?? []).join("|")}
            multiple
            autoHighlight
            items={conversationStatus}
            value={filter.statuses?.length ? filter.statuses : null}
            onValueChange={(values: ConversationStatus[] | null) => {
              const statuses = values ?? [];
              void setSearchParams((prev) => ({
                page: 1,
                filter: {
                  ...prev.filter,
                  statuses: statuses.length > 0 ? statuses : undefined,
                },
              }));
            }}
          >
            <ComboboxChips
              ref={statusAnchor}
              className="w-full max-w-xs"
            >
              <ComboboxValue>
                {(values: ConversationStatus[] | null) => {
                  const selected = values ?? [];
                  return (
                    <Fragment>
                      {selected.map((value: ConversationStatus) => (
                        <ComboboxChip key={value}>
                          {statusConfig[value]?.label ?? value}
                        </ComboboxChip>
                      ))}
                      <ComboboxChipsInput placeholder={selected.length > 0 ? "" : "status"} />
                    </Fragment>
                  );
                }}
              </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent anchor={statusAnchor}>
              <ComboboxEmpty>No items found.</ComboboxEmpty>
              <ComboboxList>
                {(item: ConversationStatus) => (
                  <ComboboxItem
                    key={item}
                    value={item}
                  >
                    <span>{statusConfig[item]?.label ?? item}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-accent/50 flex items-center gap-4 border-t p-3">
        {filterOpen === "edit" && (
          <Button
            variant="outline"
            onClick={() => {
              // Clear other sidebar params (e.g. contact) when switching modes.
              void setSidebarParams({ contactId: null, filterOpen: "new", filterSaving: true });
            }}
          >
            Save as new smart list
          </Button>
        )}
        <Button
          className="w-full"
          onClick={() => {
            void resetFilters();
          }}
        >
          {filterOpen === "edit" ? "Reset filters" : "Clear all"}
        </Button>
      </SidebarFooter>
    </>
  );
};
