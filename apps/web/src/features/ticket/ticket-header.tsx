"use client";

import { useQuery } from "@tanstack/react-query";
import { Forward, GitBranchPlus, Notebook, Reply, Trash2, X } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc";
import { ToggleContactSidebarButton } from "./toggle-contact-sidebar-button";

export const TicketHeader = ({ ticketId }: { ticketId: string }) => {
  const trpc = useTRPC();
  const { data: ticket } = useQuery(trpc.ticket.getById.queryOptions(ticketId));
  const [, setIsOpen] = useQueryState("emailEditorOpen", parseAsBoolean.withDefault(false));
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => void setIsOpen(true)}
        >
          <Reply />
          Reply
        </Button>
        <Button variant="outline">
          <Notebook />
          Add note
        </Button>
        <Button variant="outline">
          <Forward />
          Forward
        </Button>
        <Button variant="outline">
          <X />
          Close
        </Button>
        <Button variant="outline">
          <GitBranchPlus />
          Merge
        </Button>
        <Button variant="outline">
          <Trash2 />
          Delete
        </Button>
      </div>
      <div>
        <ToggleContactSidebarButton contactId={ticket?.contact?.id} />
      </div>
    </div>
  );
};
