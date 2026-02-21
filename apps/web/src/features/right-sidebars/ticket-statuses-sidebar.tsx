import { Fragment } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";

import type { ConversationPriority, ConversationStatus } from "@help-desk/db/schema/conversations";
import type { FilterType } from "@help-desk/db/validators/default-filter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SidebarContent, SidebarGroup, SidebarHeader } from "@/components/ui/sidebar";
import { useDefaultFilters } from "@/features/settings/ticket-filters/use-default-filters";
import { SlaBadge } from "@/features/tickets/sla-badge";
import { useTRPC } from "@/trpc";
import { TicketAssigneeCombobox } from "../tickets/ticket-assignee-combobox";
import { TicketTagCombobox } from "../tickets/ticket-tag-combobox";
import { useSidebarParams } from "./query-params";

type OptionItem = { value: string; label: string; className?: string };

export const TicketStatusesSidebar = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const {
    sidebarParams: { ticketStatusesId },
  } = useSidebarParams();

  const ticketId = ticketStatusesId ?? "";

  const { data: ticket } = useQuery({
    ...trpc.ticket.getById.queryOptions(ticketId),
    enabled: !!ticketStatusesId,
  });

  const { mutate: updatePriority } = useMutation(
    trpc.ticket.updatePriority.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.ticket.getById.queryKey(ticketId),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.ticket.all.queryKey(),
        });
        toast.success("Priority updated successfully");
      },
    })
  );

  const { mutate: updateStatus } = useMutation(
    trpc.ticket.updateStatus.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.ticket.getById.queryKey(ticketId),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.ticket.all.queryKey(),
        });
        toast.success("Status updated successfully");
      },
    })
  );

  const { mutate: updateAssignee } = useMutation(
    trpc.ticket.updateAssignee.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.ticket.getById.queryKey(ticketId),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.ticket.all.queryKey(),
        });
        toast.success("Assignee updated successfully");
      },
    })
  );

  const { mutate: updateCustomFields } = useMutation(
    trpc.ticket.updateCustomFields.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.ticket.getById.queryKey(ticketId),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.ticket.all.queryKey(),
        });
        toast.success("Custom field updated successfully");
      },
    })
  );

  const { filters, getOptions } = useDefaultFilters();

  const priorityOptions: OptionItem[] = getOptions("priority").map((o) => ({
    value: o.value,
    label: o.label,
  }));

  const statusOptions: OptionItem[] = getOptions("status").map((o) => ({
    value: o.value,
    label: o.label,
  }));

  const currentPriority =
    ticket?.priority ? priorityOptions.find((o) => o.value === ticket.priority) : undefined;

  const currentStatus =
    ticket?.status ? statusOptions.find((o) => o.value === ticket.status) : undefined;

  // Helper to render a system filter combobox for single-select (priority / status)
  const renderSystemSelect = (
    key: string,
    label: string,
    items: OptionItem[],
    currentOption: OptionItem | undefined,
    onChange: (option: OptionItem | null) => void
  ) => (
    <SidebarGroup key={key}>
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs">{label}</span>
        <Combobox
          items={items}
          value={currentOption ?? null}
          onValueChange={onChange}
          isItemEqualToValue={(a, b) => a?.value === b?.value}
        >
          <ComboboxTrigger
            render={
              <Button
                variant="outline"
                className="w-full justify-between font-normal"
              >
                <ComboboxValue />
              </Button>
            }
          />
          <ComboboxContent className="w-42">
            <ComboboxInput
              showTrigger={false}
              placeholder="Search"
            />
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <ComboboxList>
              {(item: OptionItem) => (
                <ComboboxItem
                  key={item.value}
                  value={item}
                >
                  <span>{item.label}</span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </SidebarGroup>
  );

  return (
    <>
      <SidebarHeader className="border-accent/50 relative border-b p-3">
        <h2 className="text-lg font-medium">Ticket statuses</h2>
      </SidebarHeader>
      <SidebarContent className="scrollbar-gutter-stable flex-1 overflow-y-auto p-3">
        {/* All filters rendered dynamically by position (system + custom) */}
        {filters.map((f) => {
          // System filter: priority
          if (f.name === "priority") {
            return renderSystemSelect(
              f.name,
              f.displayName,
              priorityOptions,
              currentPriority,
              (option) => {
                if (option && ticketId) {
                  updatePriority({
                    id: ticketId,
                    priority: option.value as ConversationPriority,
                  });
                }
              }
            );
          }

          // System filter: status
          if (f.name === "status") {
            if (ticket?.status === "merged") {
              return (
                <SidebarGroup key={f.name}>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-xs">{f.displayName}</span>
                    <Badge
                      variant="outline"
                      className="w-fit"
                    >
                      Merged
                    </Badge>
                  </div>
                </SidebarGroup>
              );
            }
            return renderSystemSelect(
              f.name,
              f.displayName,
              statusOptions,
              currentStatus,
              (option) => {
                if (option && ticketId) {
                  updateStatus({
                    id: ticketId,
                    status: option.value as ConversationStatus,
                  });
                }
              }
            );
          }

          // System filter: channel – skip (not editable on a ticket)
          if (f.name === "channel") {
            return null;
          }

          // Custom filters
          const filterType: FilterType = f.type ?? "multi-select";
          return (
            <CustomFieldValueSetter
              key={f.name}
              filterName={f.name}
              displayName={f.displayName}
              type={filterType}
              options={f.options.map((o) => ({ value: o.value, label: o.label }))}
              currentValue={
                (ticket?.customFields as Record<string, string | string[]> | undefined)?.[f.name]
              }
              onSingleChange={(value) => {
                if (!ticketId) return;
                if (value) {
                  updateCustomFields({
                    id: ticketId,
                    customFields: { [f.name]: value },
                  });
                } else {
                  updateCustomFields({
                    id: ticketId,
                    customFields: {},
                    removeFields: [f.name],
                  });
                }
              }}
              onMultiChange={(values) => {
                if (!ticketId) return;
                if (values.length > 0) {
                  updateCustomFields({
                    id: ticketId,
                    customFields: { [f.name]: values },
                  });
                } else {
                  updateCustomFields({
                    id: ticketId,
                    customFields: {},
                    removeFields: [f.name],
                  });
                }
              }}
            />
          );
        })}

        {/* ── SLA status ── */}
        {ticket?.slaFirstResponseDueAt && (
          <SidebarGroup>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">SLA</span>
              <SlaBadge
                firstResponseAt={ticket.firstResponseAt}
                slaFirstResponseDueAt={ticket.slaFirstResponseDueAt}
                slaBreachedAt={ticket.slaBreachedAt}
              />
            </div>
          </SidebarGroup>
        )}

        {/* ── Pinned fields (no DB entry, always at the bottom) ── */}

        <SidebarGroup>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Assignee</span>
            <TicketAssigneeCombobox
              currentAssignee={ticket?.assignedTo ?? null}
              onValueChange={(assigneeId) => {
                if (ticketId) {
                  updateAssignee({ id: ticketId, assignedToId: assigneeId });
                }
              }}
              variant="button"
            />
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Tags</span>
            {ticketId && (
              <TicketTagCombobox
                ticketId={ticketId}
                currentTags={ticket?.tags ?? []}
              />
            )}
          </div>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
};

// ─── Custom field value setter with type-aware rendering ─────────────────────

type CustomFieldValueSetterProps = {
  filterName: string;
  displayName: string;
  type: FilterType;
  options: OptionItem[];
  currentValue: string | string[] | undefined;
  onSingleChange: (value: string | null) => void;
  onMultiChange: (values: string[]) => void;
};

function CustomFieldValueSetter({
  filterName,
  displayName,
  type,
  options,
  currentValue,
  onSingleChange,
  onMultiChange,
}: CustomFieldValueSetterProps) {
  // Normalize current value
  const singleValue = typeof currentValue === "string" ? currentValue : currentValue?.[0];
  const multiValues =
    Array.isArray(currentValue) ? currentValue
    : currentValue ? [currentValue]
    : [];

  if (type === "radio") {
    return (
      <SidebarGroup>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">{displayName}</span>
          <RadioGroup
            value={singleValue ?? ""}
            onValueChange={(value: string) => {
              if (value === singleValue) {
                onSingleChange(null);
              } else {
                onSingleChange(value);
              }
            }}
            className="gap-2 px-1"
          >
            {options.map((option) => (
              <div
                key={option.value}
                className="flex items-center gap-2"
              >
                <RadioGroupItem
                  value={option.value}
                  id={`${filterName}-val-${option.value}`}
                  onClick={() => {
                    if (option.value === singleValue) {
                      onSingleChange(null);
                    }
                  }}
                />
                <Label
                  htmlFor={`${filterName}-val-${option.value}`}
                  className="cursor-pointer text-sm font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </SidebarGroup>
    );
  }

  if (type === "checkbox") {
    const selectedSet = new Set(multiValues);
    return (
      <SidebarGroup>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">{displayName}</span>
          <div className="flex flex-col gap-2 px-1">
            {options.map((option) => (
              <div
                key={option.value}
                className="flex items-center gap-2"
              >
                <Checkbox
                  id={`${filterName}-val-${option.value}`}
                  checked={selectedSet.has(option.value)}
                  onCheckedChange={(checked) => {
                    let next: string[];
                    if (checked) {
                      next = [...multiValues, option.value];
                    } else {
                      next = multiValues.filter((v) => v !== option.value);
                    }
                    onMultiChange(next);
                  }}
                />
                <Label
                  htmlFor={`${filterName}-val-${option.value}`}
                  className="cursor-pointer text-sm font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </SidebarGroup>
    );
  }

  if (type === "multi-select") {
    return (
      <MultiSelectValueSetter
        filterName={filterName}
        displayName={displayName}
        options={options}
        selectedValues={multiValues}
        onValueChange={onMultiChange}
      />
    );
  }

  // Default: select (single-select combobox)
  const currentOption = options.find((o) => o.value === singleValue) ?? null;
  return (
    <SidebarGroup>
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs">{displayName}</span>
        <div className="relative">
          <Combobox
            items={options}
            value={currentOption}
            onValueChange={(option: OptionItem | null) => {
              onSingleChange(option?.value ?? null);
            }}
            isItemEqualToValue={(a, b) => a?.value === b?.value}
          >
            <ComboboxTrigger
              render={
                <Button
                  variant="outline"
                  className="w-full justify-between font-normal"
                >
                  <ComboboxValue />
                </Button>
              }
            />
            <ComboboxContent className="w-42">
              <ComboboxInput
                showTrigger={false}
                placeholder="Search"
              />
              <ComboboxEmpty>No items found.</ComboboxEmpty>
              <ComboboxList>
                {(item: OptionItem) => (
                  <ComboboxItem
                    key={item.value}
                    value={item}
                  >
                    <span>{item.label}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {currentOption && (
            <Button
              variant="ghost"
              type="button"
              className="absolute top-1/2 right-2 -translate-y-1/2 transition-colors"
              onClick={() => onSingleChange(null)}
              aria-label={`Clear ${displayName}`}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </SidebarGroup>
  );
}

function MultiSelectValueSetter({
  filterName: _filterName,
  displayName,
  options,
  selectedValues,
  onValueChange,
}: {
  filterName: string;
  displayName: string;
  options: OptionItem[];
  selectedValues: string[];
  onValueChange: (values: string[]) => void;
}) {
  const anchor = useComboboxAnchor();
  const items = options.map((o) => o.value);
  const labelMap = new Map(options.map((o) => [o.value, o.label]));

  return (
    <SidebarGroup>
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground text-xs">{displayName}</span>
        <Combobox
          key={selectedValues.join("|")}
          multiple
          autoHighlight
          items={items}
          value={selectedValues.length > 0 ? selectedValues : null}
          onValueChange={(values: string[] | null) => {
            onValueChange(values ?? []);
          }}
        >
          <ComboboxChips
            ref={anchor}
            className="w-full max-w-xs"
          >
            <ComboboxValue>
              {(values: string[] | null) => {
                const selected = values ?? [];
                return (
                  <Fragment>
                    {selected.map((value: string) => (
                      <ComboboxChip key={value}>{labelMap.get(value) ?? value}</ComboboxChip>
                    ))}
                    <ComboboxChipsInput placeholder="" />
                  </Fragment>
                );
              }}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>No options found.</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem
                  key={item}
                  value={item}
                >
                  <span>{labelMap.get(item) ?? item}</span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </SidebarGroup>
  );
}
