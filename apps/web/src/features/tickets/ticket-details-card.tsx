"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { TicketCardData } from "./ticket-card";
import { useTRPC } from "@/trpc";
import { useSidebarParams } from "../right-sidebars/query-params";
import {
  TicketCard,
  TicketCardAssignee,
  TicketCardFooter,
  TicketCardHeader,
  TicketCardTags,
} from "./ticket-card";
import { TicketPrioritySelect } from "./ticket-priority-select";
import { TicketStatusSelect } from "./ticket-status-select";

type TicketDetailsCardProps = Omit<React.ComponentProps<typeof TicketCard>, "data"> & {
  item: TicketCardData;
};

export const TicketDetailsCard = ({ item, ...props }: TicketDetailsCardProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toggleContactSidebarId, sidebarParams } = useSidebarParams();

  const invalidateTicket = () => {
    void queryClient.invalidateQueries({ queryKey: trpc.ticket.getById.queryKey(item.id) });
    void queryClient.invalidateQueries({ queryKey: trpc.ticket.all.queryKey() });
  };

  const { mutate: updateAssignee } = useMutation(
    trpc.ticket.updateAssignee.mutationOptions({
      onSuccess: () => {
        invalidateTicket();
        toast.success("Assignee updated successfully");
      },
    })
  );

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
        <div className="flex items-center gap-2">
          <TicketStatusSelect
            ticketId={item.id}
            value={item.status}
          />
          <TicketPrioritySelect
            ticketId={item.id}
            value={item.priority}
          />
          <TicketCardAssignee
            onAssigneeChange={(assigneeId) =>
              updateAssignee({ id: item.id, assignedToId: assigneeId })
            }
          />
        </div>
      </TicketCardFooter>
    </TicketCard>
  );
};
