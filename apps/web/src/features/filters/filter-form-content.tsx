"use client";

import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";

import type { Tag } from "@help-desk/db/schema/tags";
import type { TicketFilter } from "@help-desk/db/validators/ticket-filter";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { useDefaultFilters } from "@/features/settings/ticket-filters/use-default-filters";
import { useTRPC } from "@/trpc";
import { FilterRenderer } from "../right-sidebars/filter-components";
import { CreatedDateFilter } from "../tickets/created-date-filter";

type MemberItem = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export type FilterFormContentProps = {
  filter: TicketFilter;
  onFilterChange: (filter: TicketFilter) => void;
};

const UNASSIGNED_ID = "__unassigned__" as const;

const unassignedItem: MemberItem = {
  id: UNASSIGNED_ID,
  name: "Unassigned",
  email: "",
  image: null,
};

const SYSTEM_FILTER_PARAM_KEY: Record<string, keyof TicketFilter> = {
  priority: "priorities",
  status: "statuses",
  channel: "channels",
};

function getUserInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

type SystemFilterSectionProps = {
  displayName: string;
  filterKey: string;
  values: string[];
  selectedValues: string[] | undefined;
  getLabel: (key: string, value: string) => string;
  onValueChange: (values: string[]) => void;
};

function SystemFilterSection({
  displayName,
  filterKey,
  values,
  selectedValues,
  getLabel,
  onValueChange,
}: SystemFilterSectionProps) {
  const anchor = useComboboxAnchor();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{displayName}</SidebarGroupLabel>
      <Combobox
        key={(selectedValues ?? []).join("|")}
        multiple
        autoHighlight
        items={values}
        value={selectedValues?.length ? selectedValues : null}
        onValueChange={(vals: string[] | null) => onValueChange(vals ?? [])}
      >
        <ComboboxChips
          ref={anchor}
          className="w-full max-w-xs"
        >
          <ComboboxValue>
            {(vals: string[] | null) => {
              const selected = vals ?? [];
              return (
                <Fragment>
                  {selected.map((value: string) => (
                    <ComboboxChip key={value}>{getLabel(filterKey, value)}</ComboboxChip>
                  ))}
                  <ComboboxChipsInput placeholder="" />
                </Fragment>
              );
            }}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem
                key={item}
                value={item}
              >
                <span>{getLabel(filterKey, item)}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </SidebarGroup>
  );
}

export function FilterFormContent({ filter, onFilterChange }: FilterFormContentProps) {
  const trpc = useTRPC();
  const assigneeAnchor = useComboboxAnchor();
  const tagAnchor = useComboboxAnchor();

  // All filters from the API, sorted by position (system + custom)
  const { filters, getValues, getLabel } = useDefaultFilters();

  const { data: members = [] } = useQuery(trpc.user.getOrganizationMembers.queryOptions());
  const { data: tagsData } = useQuery(trpc.tags.list.queryOptions());
  const allTags = tagsData?.items ?? [];
  const selectedTags = (filter.tagIds ?? [])
    .map((id) => allTags.find((t) => t.id === id))
    .filter((t): t is Tag => !!t);

  // Build items list with "Unassigned" at the top
  const assigneeItems = [unassignedItem, ...members];

  // Map selected assignee IDs to member objects for the combobox value
  const selectedAssignees: MemberItem[] = [
    ...(filter.isUnassigned ? [unassignedItem] : []),
    ...(filter.assignedToIds ?? [])
      .map((id) => members.find((m) => m.id === id))
      .filter((m): m is MemberItem => !!m),
  ];

  return (
    <>
      {/* All filters rendered dynamically by position (system + custom) */}
      {filters.map((f) => {
        const paramKey = SYSTEM_FILTER_PARAM_KEY[f.name];

        // System filters (priority, status, channel) → combobox
        if (f.isSystem && paramKey) {
          return (
            <SystemFilterSection
              key={f.name}
              displayName={f.displayName}
              filterKey={f.name}
              values={getValues(f.name)}
              selectedValues={filter[paramKey] as string[] | undefined}
              getLabel={getLabel}
              onValueChange={(values) => {
                onFilterChange({
                  ...filter,
                  [paramKey]: values.length > 0 ? values : undefined,
                });
              }}
            />
          );
        }

        // Custom filters → FilterRenderer (select, multi-select, radio, checkbox)
        return (
          <FilterRenderer
            key={f.name}
            type={f.type ?? "multi-select"}
            filterName={f.name}
            displayName={f.displayName}
            options={f.options}
            selectedValues={filter.customFields?.[f.name] ?? []}
            onValueChange={(name, values) => {
              const prevCustom = filter.customFields ?? {};
              const nextCustom = { ...prevCustom };
              if (values.length > 0) {
                nextCustom[name] = values;
              } else {
                delete nextCustom[name];
              }
              onFilterChange({
                ...filter,
                customFields: Object.keys(nextCustom).length > 0 ? nextCustom : undefined,
              });
            }}
          />
        );
      })}

      {/* ── Pinned filters (no DB entry, always at the bottom) ── */}

      <SidebarGroup>
        <SidebarGroupLabel>Assignee</SidebarGroupLabel>

        <Combobox
          key={[filter.isUnassigned ? "u" : "", ...(filter.assignedToIds ?? [])].join("|")}
          multiple
          autoHighlight
          items={assigneeItems}
          value={selectedAssignees.length > 0 ? selectedAssignees : null}
          onValueChange={(values: MemberItem[] | null) => {
            const selected = values ?? [];
            const isUnassigned = selected.some((m) => m.id === UNASSIGNED_ID) || undefined;
            const assignedToIds = selected.filter((m) => m.id !== UNASSIGNED_ID).map((m) => m.id);
            onFilterChange({
              ...filter,
              isUnassigned,
              assignedToIds: assignedToIds.length > 0 ? assignedToIds : undefined,
            });
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
                    <ComboboxChipsInput placeholder={selected.length > 0 ? "" : ""} />
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

      <SidebarGroup>
        <SidebarGroupLabel>Tags</SidebarGroupLabel>

        <Combobox
          key={(filter.tagIds ?? []).join("|")}
          multiple
          autoHighlight
          items={allTags}
          value={selectedTags.length > 0 ? selectedTags : null}
          onValueChange={(values: Tag[] | null) => {
            const tagIds = (values ?? []).map((t) => t.id);
            onFilterChange({
              ...filter,
              tagIds: tagIds.length > 0 ? tagIds : undefined,
            });
          }}
          isItemEqualToValue={(a, b) => a?.id === b?.id}
          itemToStringLabel={(item) => item.name}
        >
          <ComboboxChips
            ref={tagAnchor}
            className="w-full max-w-xs"
          >
            <ComboboxValue>
              {(values: Tag[] | null) => {
                const selected = values ?? [];
                return (
                  <Fragment>
                    {selected.map((tag: Tag) => (
                      <ComboboxChip key={tag.id}>
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </ComboboxChip>
                    ))}
                    <ComboboxChipsInput placeholder={selected.length > 0 ? "" : ""} />
                  </Fragment>
                );
              }}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={tagAnchor}>
            <ComboboxEmpty>No tags found.</ComboboxEmpty>
            <ComboboxList>
              {(item: Tag) => (
                <ComboboxItem
                  key={item.id}
                  value={item}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Created</SidebarGroupLabel>
        <CreatedDateFilter
          value={filter.createdAt}
          onChange={(createdAt) => {
            onFilterChange({
              ...filter,
              createdAt,
            });
          }}
        />
      </SidebarGroup>
    </>
  );
}
