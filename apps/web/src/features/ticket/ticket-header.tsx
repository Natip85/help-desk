"use client";

import { useQuery } from "@tanstack/react-query";
import { Forward, GitBranchPlus, Reply, Trash2 } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc";
import { AddNoteDialog } from "./add-note-dialog";
import { CloseTicketButton } from "./close-ticket-button";
import { ToggleContactSidebarButton } from "./toggle-contact-sidebar-button";
import { ToggleTicketStatusesSidebarButton } from "./toggle-ticket-statuses-sidebar-button";

export const TicketHeader = ({ ticketId }: { ticketId: string }) => {
  const trpc = useTRPC();
  const { data: ticket } = useQuery(trpc.ticket.getById.queryOptions(ticketId));
  const [, setActiveEditor] = useQueryState(
    "editor",
    parseAsStringLiteral(["reply", "forward"] as const)
  );
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => void setActiveEditor("reply")}
        >
          <Reply />
          Reply
        </Button>
        <AddNoteDialog ticketId={ticketId} />
        <Button
          variant="outline"
          onClick={() => void setActiveEditor("forward")}
        >
          <Forward />
          Forward
        </Button>
        {ticket?.status !== "closed" && <CloseTicketButton ticketId={ticketId} />}
        <Button variant="outline">
          <GitBranchPlus />
          Merge
        </Button>
        <Button variant="outline">
          <Trash2 />
          Delete
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <ToggleContactSidebarButton contactId={ticket?.contact?.id} />
        <ToggleTicketStatusesSidebarButton ticketId={ticketId} />
      </div>
    </div>
  );
};
