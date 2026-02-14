"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ConversationPriority, ConversationStatus } from "@help-desk/db/schema/conversations";

import type { TicketCardData } from "./ticket-card";
import type { TicketCardAction } from "./ticket-card-actions";
import { useTRPC } from "@/trpc";
import { useSidebarParams } from "../right-sidebars/query-params";
import {
  priorityConfig,
  statusConfig,
  TicketCard,
  TicketCardAssignee,
  TicketCardFooter,
  TicketCardHeader,
  TicketCardTags,
} from "./ticket-card";
import { TicketCardActions } from "./ticket-card-actions";

type SmartListDetailsCardProps = Omit<React.ComponentProps<typeof TicketCard>, "data"> & {
  item: TicketCardData;
};

export const TicketDetailsCard = ({ item, ...props }: SmartListDetailsCardProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toggleContactSidebarId, sidebarParams } = useSidebarParams();

  const invalidateTicket = () => {
    void queryClient.invalidateQueries({ queryKey: trpc.ticket.getById.queryKey(item.id) });
    void queryClient.invalidateQueries({ queryKey: trpc.ticket.all.queryKey() });
  };

  const { mutate: updatePriority } = useMutation(
    trpc.ticket.updatePriority.mutationOptions({
      onSuccess: () => {
        invalidateTicket();
        toast.success("Priority updated successfully");
      },
    })
  );

  const { mutate: updateStatus } = useMutation(
    trpc.ticket.updateStatus.mutationOptions({
      onSuccess: () => {
        invalidateTicket();
        toast.success("Status updated successfully");
      },
    })
  );

  const { mutate: updateAssignee } = useMutation(
    trpc.ticket.updateAssignee.mutationOptions({
      onSuccess: () => {
        invalidateTicket();
        toast.success("Assignee updated successfully");
      },
    })
  );

  const statusAction: TicketCardAction = {
    type: "select",
    label: "Status",
    value: item.status,
    options: Object.entries(statusConfig).map(([value, config]) => ({
      value,
      label: config.label,
      className: config.className,
    })),
    onValueChange: (value) => updateStatus({ id: item.id, status: value as ConversationStatus }),
  };

  const priorityAction: TicketCardAction = {
    type: "select",
    label: "Priority",
    value: item.priority,
    options: Object.entries(priorityConfig).map(([value, config]) => ({
      value,
      label: config.label,
      className: config.className,
    })),
    onValueChange: (value) =>
      updatePriority({
        id: item.id,
        priority: value as ConversationPriority,
      }),
  };

  return (
    <TicketCard
      data={item}
      key={item.id}
      {...props}
      onCardClick={() => {
        toggleContactSidebarId(item.contact.id);
      }}
      isActive={sidebarParams.contactId === item.contact.id}
    >
      <TicketCardHeader>
        <TicketCardTags tags={item.tags} />
      </TicketCardHeader>
      <TicketCardFooter>
        <TicketCardAssignee
          onAssigneeChange={(assigneeId) =>
            updateAssignee({ id: item.id, assignedToId: assigneeId })
          }
        />
        <div className="flex items-center gap-2">
          <TicketCardActions actions={[statusAction]} />
          <TicketCardActions actions={[priorityAction]} />
        </div>
      </TicketCardFooter>
    </TicketCard>
  );
};
