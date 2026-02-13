import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ConversationPriority, ConversationStatus } from "@help-desk/db/schema/conversations";
import { conversationPriority, conversationStatus } from "@help-desk/db/schema/conversations";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { SidebarContent, SidebarGroup, SidebarHeader } from "@/components/ui/sidebar";
import { useTRPC } from "@/trpc";
import { TicketAssigneeCombobox } from "../tickets/ticket-assignee-combobox";
import { priorityConfig, statusConfig } from "../tickets/ticket-card";
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

  const priorityOptions: OptionItem[] = conversationPriority.map((p) => ({
    value: p,
    label: priorityConfig[p]?.label ?? p,
    className: priorityConfig[p]?.className,
  }));

  const statusOptions: OptionItem[] = conversationStatus.map((s) => ({
    value: s,
    label: statusConfig[s]?.label ?? s,
    className: statusConfig[s]?.className,
  }));

  const currentPriority =
    ticket?.priority ? priorityOptions.find((o) => o.value === ticket.priority) : undefined;

  const currentStatus =
    ticket?.status ? statusOptions.find((o) => o.value === ticket.status) : undefined;

  return (
    <>
      <SidebarHeader className="border-accent/50 relative border-b p-3">
        <h2 className="text-lg font-medium">Ticket statuses</h2>
      </SidebarHeader>
      <SidebarContent className="scrollbar-gutter-stable flex-1 overflow-y-auto p-3">
        <SidebarGroup>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Priority</span>
            <Combobox
              items={priorityOptions}
              value={currentPriority ?? null}
              onValueChange={(option: OptionItem | null) => {
                if (option && ticketId) {
                  updatePriority({
                    id: ticketId,
                    priority: option.value as ConversationPriority,
                  });
                }
              }}
              isItemEqualToValue={(a, b) => a?.value === b?.value}
            >
              <ComboboxTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    <ComboboxValue placeholder="Select priority..." />
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

        <SidebarGroup>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Status</span>
            <Combobox
              items={statusOptions}
              value={currentStatus ?? null}
              onValueChange={(option: OptionItem | null) => {
                if (option && ticketId) {
                  updateStatus({
                    id: ticketId,
                    status: option.value as ConversationStatus,
                  });
                }
              }}
              isItemEqualToValue={(a, b) => a?.value === b?.value}
            >
              <ComboboxTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    <ComboboxValue placeholder="Select status..." />
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
