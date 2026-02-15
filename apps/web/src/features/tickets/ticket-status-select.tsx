"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ConversationStatus } from "@help-desk/db/schema/conversations";

import { useTRPC } from "@/trpc";
import { statusConfig } from "./ticket-card";
import { TicketCardActions } from "./ticket-card-actions";

type TicketStatusSelectProps = {
  ticketId: string;
  value: ConversationStatus;
};

export const TicketStatusSelect = ({ ticketId, value }: TicketStatusSelectProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: updateStatus } = useMutation(
    trpc.ticket.updateStatus.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.ticket.getById.queryKey(ticketId) });
        void queryClient.invalidateQueries({ queryKey: trpc.ticket.all.queryKey() });
        toast.success("Status updated successfully");
      },
    })
  );

  return (
    <TicketCardActions
      actions={[
        {
          type: "select",
          label: "Status",
          value,
          options: Object.entries(statusConfig).map(([val, config]) => ({
            value: val,
            label: config.label,
            className: config.className,
          })),
          onValueChange: (v) => updateStatus({ id: ticketId, status: v as ConversationStatus }),
        },
      ]}
    />
  );
};
