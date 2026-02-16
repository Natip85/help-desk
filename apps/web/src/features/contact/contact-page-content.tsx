"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Building,
  CalendarClock,
  Mail,
  NotebookPen,
  PencilIcon,
  Phone,
  Plus,
  Tag,
  Ticket,
} from "lucide-react";

import type { RouterOutputs } from "@help-desk/api";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc";
import { priorityConfig, statusConfig } from "../tickets/ticket-card";
import { serializePrefillTicket } from "../tickets/ticket-prefill-query-params";
import { DeleteContactButton } from "./delete-contact-button";
import { EditContactDialog } from "./edit-contact-dialog";

type ContactGetById = RouterOutputs["contact"]["getById"];
type RecentEvent = ContactGetById["recentEvents"][number];
type RecentTicket = ContactGetById["recentTickets"][number];

function getDisplayName(contact: ContactGetById["contact"]) {
  if (contact.displayName) return contact.displayName;
  if (contact.firstName || contact.lastName) {
    return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  }
  return contact.email;
}

function getInitials(contact: ContactGetById["contact"]) {
  if (contact.firstName || contact.lastName) {
    return `${contact.firstName?.charAt(0) ?? ""}${contact.lastName?.charAt(0) ?? ""}`.toUpperCase();
  }
  if (contact.displayName) {
    return contact.displayName.charAt(0).toUpperCase();
  }
  return contact.email.charAt(0).toUpperCase();
}

function formatCompactDateTime(date: Date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function ContactPageContent({ contactId }: { contactId: string }) {
  const trpc = useTRPC();
  const [editOpen, setEditOpen] = useState(false);

  const { data, isPending, isError, error, refetch } = useQuery(
    trpc.contact.getById.queryOptions(contactId)
  );

  if (isPending) {
    return <ContactPageSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm font-medium">Failed to load contact</p>
        <p className="text-muted-foreground text-sm">{error.message}</p>
        <Button
          variant="outline"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const { contact, company, recentTickets, recentEvents } = data;
  const displayName = getDisplayName(contact);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Avatar className="size-16 shrink-0">
            {contact.avatarUrl && (
              <AvatarImage
                src={contact.avatarUrl}
                alt={displayName}
              />
            )}
            <AvatarFallback className="text-lg">{getInitials(contact)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">{displayName}</h1>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5" />
                {contact.email}
              </span>
              {contact.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  {contact.phone}
                </span>
              )}
              {company?.name && (
                <span className="inline-flex items-center gap-1.5">
                  <Building className="size-3.5" />
                  {company.name}
                  {company.domain ? ` · ${company.domain}` : ""}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              Created {formatCompactDateTime(contact.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
          >
            <PencilIcon className="mr-1.5 size-4" />
            Edit
          </Button>
          <DeleteContactButton
            contactId={contact.id}
            contactName={displayName}
          />
          <Button
            size="sm"
            asChild
          >
            <Link
              href={`/tickets/new${serializePrefillTicket({ contactId: contact.id, contactEmail: contact.email })}`}
            >
              <Plus className="mr-1.5 size-4" />
              New Ticket
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <TimelineTab events={recentEvents} />
        </TabsContent>

        <TabsContent value="tickets">
          <TicketsTab tickets={recentTickets} />
        </TabsContent>

        <TabsContent value="notes">
          <NotesTab />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <EditContactDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        contact={contact}
      />
    </div>
  );
}

function TimelineTab({ events }: { events: RecentEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        No timeline events yet.
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      {events.map((e) => (
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
      ))}
    </div>
  );
}

function TicketsTab({ tickets }: { tickets: RecentTicket[] }) {
  if (tickets.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        No tickets yet for this contact.
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      {tickets.map((t) => {
        const status = statusConfig[t.status];
        const priority = priorityConfig[t.priority];
        return (
          <Link
            key={t.id}
            href={`/tickets/${t.id}`}
            className={cn(
              "border-accent/50 hover:bg-accent/5 block rounded-lg border p-4 transition-colors",
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
            {t.tags?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {t.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className="text-muted-foreground inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]"
                  >
                    <Tag className="size-3" />
                    {tag.name}
                  </span>
                ))}
                {t.tags.length > 3 && (
                  <span className="text-muted-foreground text-[11px]">+{t.tags.length - 3}</span>
                )}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function NotesTab() {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center text-sm">
      <NotebookPen className="size-8 opacity-50" />
      <p>Notes coming soon.</p>
    </div>
  );
}

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

function ContactPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
