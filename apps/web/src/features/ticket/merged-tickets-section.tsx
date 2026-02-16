"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { GitBranchPlus } from "lucide-react";

import { useTRPC } from "@/trpc";

type MergedTicketsSectionProps = {
  ticketId: string;
};

export function MergedTicketsSection({ ticketId }: MergedTicketsSectionProps) {
  const trpc = useTRPC();
  const { data: mergedTickets } = useQuery(trpc.ticket.getMergedTickets.queryOptions(ticketId));

  if (!mergedTickets || mergedTickets.length === 0) {
    return null;
  }

  return (
    <div className="mx-6 rounded-lg border p-3">
      <div className="flex items-center gap-2 pb-2">
        <GitBranchPlus className="text-muted-foreground size-4" />
        <h3 className="text-sm font-medium">Merged Tickets ({mergedTickets.length})</h3>
      </div>
      <div className="space-y-1">
        {mergedTickets.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/tickets/${ticket.id}`}
            className="hover:bg-muted flex items-center justify-between rounded-md px-2 py-1.5 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{ticket.subject ?? "(no subject)"}</p>
              <p className="text-muted-foreground text-xs">
                {ticket.contact?.displayName ?? ticket.contact?.email ?? "Unknown contact"}
              </p>
            </div>
            <span className="bg-muted text-muted-foreground ml-2 shrink-0 rounded px-1.5 py-0.5 text-xs">
              merged
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
