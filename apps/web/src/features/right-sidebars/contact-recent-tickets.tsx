import Link from "next/link";
import { Ticket } from "lucide-react";

import type { RouterOutputs } from "@help-desk/api";

import { Badge } from "@/components/ui/badge";
import { SidebarGroup } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { priorityConfig, statusConfig } from "../tickets/ticket-card";
import { EmptyHint, formatCompactDateTime, SectionHeader } from "./contact-sidebar-utils";

type RecentTicket = RouterOutputs["contact"]["getById"]["recentTickets"][number];

export type ContactRecentTicketsProps = {
  tickets: RecentTicket[];
};

export const ContactRecentTickets = ({ tickets }: ContactRecentTicketsProps) => {
  return (
    <SidebarGroup>
      <SectionHeader
        title="Recent tickets"
        icon={<Ticket className="size-4" />}
      />
      <div className="mt-3 space-y-2">
        {tickets.length === 0 ?
          <EmptyHint text="No tickets yet for this contact." />
        : tickets.map((t) => {
            const status = statusConfig[t.status];
            const priority = priorityConfig[t.priority];
            return (
              <Link
                key={t.id}
                href={`/tickets/${t.id}`}
                className={cn(
                  "border-accent/50 hover:bg-accent/5 block rounded-lg border p-3 transition-colors",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.subject ?? "(no subject)"}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Created {formatCompactDateTime(t.createdAt)}
                      {t.lastMessageAt && (
                        <>
                          {" · "}Last message {formatCompactDateTime(t.lastMessageAt)}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className={cn("text-[11px]", status?.className)}
                    >
                      {status?.label ?? t.status}
                    </Badge>
                    <span className={cn("text-xs", priority?.className)}>
                      {priority?.label ?? t.priority}
                    </span>
                  </div>
                </div>
                {t.tags?.length && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px]"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                    {t.tags.length > 3 && (
                      <span className="text-muted-foreground text-[11px]">
                        +{t.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })
        }
      </div>
    </SidebarGroup>
  );
};
