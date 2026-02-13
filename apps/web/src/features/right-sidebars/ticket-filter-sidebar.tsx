import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";

import type { ConversationPriority, ConversationStatus } from "@help-desk/db/schema/conversations";
import { conversationPriority, conversationStatus } from "@help-desk/db/schema/conversations";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useTRPC } from "@/trpc";
import { useTicketSearchParams } from "../tickets/search-params";
import { priorityConfig, statusConfig } from "../tickets/ticket-card";
import { useSidebarParams } from "./query-params";

type MemberItem = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

function getUserInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

export const TicketFilterSidebar = () => {
  const trpc = useTRPC();
  const priorityAnchor = useComboboxAnchor();
  const statusAnchor = useComboboxAnchor();
  const assigneeAnchor = useComboboxAnchor();
  const {
    searchParams: { filter },
    setSearchParams,
    resetFilters,
  } = useTicketSearchParams();
  const {
    sidebarParams: { filterOpen },
    setSidebarParams,
  } = useSidebarParams();

  const { data: members = [] } = useQuery(trpc.user.getOrganizationMembers.queryOptions());

  // Map selected assignee IDs to member objects for the combobox value
  const selectedAssignees = (filter.assignedToIds ?? [])
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is MemberItem => !!m);

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
        <SidebarGroup>
          <Combobox
            key={(filter.assignedToIds ?? []).join("|")}
            multiple
            autoHighlight
            items={members}
            value={selectedAssignees.length > 0 ? selectedAssignees : null}
            onValueChange={(values: MemberItem[] | null) => {
              const assignedToIds = (values ?? []).map((m) => m.id);
              void setSearchParams((prev) => ({
                page: 1,
                filter: {
                  ...prev.filter,
                  assignedToIds: assignedToIds.length > 0 ? assignedToIds : undefined,
                },
              }));
            }}
            isItemEqualToValue={(a, b) => a?.id === b?.id}
            itemToStringLabel={(item) => item.name}
          >
            <ComboboxChips
              ref={assigneeAnchor}
              className="w-full max-w-xs"
            >
              <ComboboxValue>
                {(values: MemberItem[] | null) => {
                  const selected = values ?? [];
                  return (
                    <Fragment>
                      {selected.map((member: MemberItem) => (
                        <ComboboxChip key={member.id}>{member.name}</ComboboxChip>
                      ))}
                      <ComboboxChipsInput placeholder={selected.length > 0 ? "" : "assignee"} />
                    </Fragment>
                  );
                }}
              </ComboboxValue>
            </ComboboxChips>
            <ComboboxContent anchor={assigneeAnchor}>
              <ComboboxEmpty>No members found.</ComboboxEmpty>
              <ComboboxList>
                {(item: MemberItem) => (
                  <ComboboxItem
                    key={item.id}
                    value={item}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="size-5">
                        {item.image && (
                          <AvatarImage
                            src={item.image}
                            alt={item.name}
                          />
                        )}
                        <AvatarFallback className="text-[10px]">
                          {getUserInitials(item.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{item.name}</span>
                    </div>
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
