import { CalendarClock, Mail, Ticket } from "lucide-react";

import type { RouterOutputs } from "@help-desk/api";

import { SidebarGroup } from "@/components/ui/sidebar";
import { EmptyHint, formatCompactDateTime, SectionHeader } from "./contact-sidebar-utils";

type RecentEvent = RouterOutputs["contact"]["getById"]["recentEvents"][number];

export type ContactTimelineProps = {
  events: RecentEvent[];
};

export const ContactTimeline = ({ events }: ContactTimelineProps) => {
  return (
    <SidebarGroup className="p-0">
      <SectionHeader
        title="Timeline"
        icon={<CalendarClock className="size-4" />}
      />
      <div className="mt-3 space-y-3">
        {events.length === 0 ?
          <EmptyHint text="No timeline events yet." />
        : events.map((e) => (
            <div
              key={e.id}
              className="flex items-start gap-3"
            >
              <div className="bg-accent/20 text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full border">
                {eventIcon(e.type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{humanizeEventType(e.type)}</p>
                <p className="text-muted-foreground text-xs">
                  {e.actor?.name ? `${e.actor.name} · ` : ""}
                  {formatCompactDateTime(e.createdAt)}
                </p>
              </div>
            </div>
          ))
        }
      </div>
    </SidebarGroup>
  );
};

function humanizeEventType(type: string) {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function eventIcon(type: string) {
  switch (type) {
    case "email_received":
    case "email_sent":
      return <Mail className="size-4" />;
    case "conversation_created":
      return <Ticket className="size-4" />;
    default:
      return <CalendarClock className="size-4" />;
  }
}
