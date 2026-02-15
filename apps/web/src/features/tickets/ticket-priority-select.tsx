"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ConversationPriority } from "@help-desk/db/schema/conversations";

import { useTRPC } from "@/trpc";
import { priorityConfig } from "./ticket-card";
import { TicketCardActions } from "./ticket-card-actions";

type TicketPrioritySelectProps = {
  ticketId: string;
  value: ConversationPriority;
};

export const TicketPrioritySelect = ({ ticketId, value }: TicketPrioritySelectProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: updatePriority } = useMutation(
    trpc.ticket.updatePriority.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.ticket.getById.queryKey(ticketId) });
        void queryClient.invalidateQueries({ queryKey: trpc.ticket.all.queryKey() });
        toast.success("Priority updated successfully");
      },
    })
  );

  return (
    <TicketCardActions
      actions={[
        {
          type: "select",
          label: "Priority",
          value,
          options: Object.entries(priorityConfig).map(([val, config]) => ({
            value: val,
            label: config.label,
            className: config.className,
          })),
          onValueChange: (v) =>
            updatePriority({ id: ticketId, priority: v as ConversationPriority }),
        },
      ]}
    />
  );
};
