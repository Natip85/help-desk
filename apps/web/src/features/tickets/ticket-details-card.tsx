"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ConversationPriority, ConversationStatus } from "@help-desk/db/schema/conversations";

import type { TicketCardData } from "./ticket-card";
import type { TicketCardAction } from "./ticket-card-actions";
import { useTRPC } from "@/trpc";
import { useSidebarParams } from "../right-sidebars/query-params";
import {
  priorityConfig,
  statusConfig,
  TicketCard,
  TicketCardContent,
  TicketCardFooter,
  TicketCardHeader,
  TicketCardTitle,
} from "./ticket-card";
import { TicketCardActions } from "./ticket-card-actions";

type SmartListDetailsCardProps = Omit<React.ComponentProps<typeof TicketCard>, "data"> & {
  item: TicketCardData;
};

export const TicketDetailsCard = ({ item, ...props }: SmartListDetailsCardProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toggleContactSidebarId, sidebarParams } = useSidebarParams();
  const { mutate: updatePriority } = useMutation(
    trpc.ticket.updatePriority.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.ticket.all.queryKey() });
      },
    })
  );

  const { mutate: updateStatus } = useMutation(
    trpc.ticket.updateStatus.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.ticket.all.queryKey() });
      },
    })
  );

  const createTicketActions = (ticket: TicketCardData): TicketCardAction[] => [
    {
      type: "select",
      label: "Priority",
      value: ticket.priority,
      options: Object.entries(priorityConfig).map(([value, config]) => ({
        value,
        label: config.label,
        className: config.className,
      })),
      onValueChange: (value) =>
        updatePriority({
          id: ticket.id,
          priority: value as ConversationPriority,
        }),
    },
    {
      type: "select",
      label: "Status",
      value: ticket.status,
      options: Object.entries(statusConfig).map(([value, config]) => ({
        value,
        label: config.label,
        className: config.className,
      })),
      onValueChange: (value) =>
        updateStatus({ id: ticket.id, status: value as ConversationStatus }),
    },
  ];

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
        <TicketCardTitle />
      </TicketCardHeader>
      <TicketCardContent>
        <TicketCardActions actions={createTicketActions(item)} />
      </TicketCardContent>
      <TicketCardFooter />
    </TicketCard>
  );
};
