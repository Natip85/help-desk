"use client";

import { useState } from "react";
import Link from "next/link";
import { skipToken, useQuery } from "@tanstack/react-query";
import { ChevronDown, Loader2, MessageSquareText, UserRound } from "lucide-react";

import type { RouterOutputs } from "@help-desk/api";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarGroup } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc";
import { priorityConfig, statusConfig } from "../tickets/ticket-card";
import { EmptyHint, formatCompactDateTime, SectionHeader } from "./contact-sidebar-utils";

export type ContactConversationsTabProps = {
  contactId: string;
  contactEmail: string;
};

export const ContactConversationsTab = ({
  contactId,
  contactEmail,
}: ContactConversationsTabProps) => {
  const trpc = useTRPC();

  // Keep the Accordion controlled at all times.
  // Radix "single" Accordion uses an empty string ("") when fully collapsed.
  const [openConversationId, setOpenConversationId] = useState<string>("");

  const conversationsQuery = useQuery(
    trpc.contact.conversations.queryOptions({
      contactId,
      limit: 25,
    })
  );

  const threadQuery = useQuery(
    trpc.contact.conversationThread.queryOptions(
      openConversationId ?
        {
          conversationId: openConversationId,
        }
      : skipToken
    )
  );

  let content: React.ReactNode;
  if (conversationsQuery.isPending) {
    content = (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    );
  } else if (conversationsQuery.isError) {
    content = (
      <div className="space-y-2">
        <p className="text-sm font-medium">Failed to load conversations</p>
        <p className="text-muted-foreground text-sm">{conversationsQuery.error.message}</p>
        <Button
          variant="outline"
          onClick={() => conversationsQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  } else if (conversationsQuery.data.items.length === 0) {
    content = <EmptyHint text="No conversations yet for this contact." />;
  } else {
    content = (
      <Accordion
        type="single"
        collapsible
        value={openConversationId}
        onValueChange={setOpenConversationId}
        className="space-y-3"
      >
        {conversationsQuery.data.items.map((c) => {
          const status = statusConfig[c.status];
          const priority = priorityConfig[c.priority];
          const isOpen = openConversationId === c.id;
          const lastPreview = c.lastMessage?.textBody?.trim() ? c.lastMessage.textBody.trim() : "";

          return (
            <AccordionItem
              key={c.id}
              value={c.id}
              className="border-accent/50 rounded-lg border"
            >
              <AccordionTrigger className="group p-3 hover:no-underline [&>svg]:hidden">
                <div className="grid w-full min-w-0 grid-cols-[1fr_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.subject ?? "(no subject)"}</p>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {lastPreview || "No message preview"}
                    </p>
                    <p className="text-muted-foreground mt-1 truncate text-[11px] whitespace-nowrap">
                      {c.lastMessageAt && (
                        <>Last message {formatCompactDateTime(c.lastMessageAt)}</>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-start gap-3">
                    <div className="flex flex-col items-end gap-1 pt-0.5">
                      <Badge
                        variant="outline"
                        className={cn("text-[11px]", status?.className)}
                      >
                        {status?.label ?? c.status}
                      </Badge>
                      <span className={cn("text-xs", priority?.className)}>
                        {priority?.label ?? c.priority}
                      </span>
                    </div>
                    <ChevronDown className="text-muted-foreground mt-1 size-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-3 pt-3 pb-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      asChild
                      size="sm"
                    >
                      <Link href={`/tickets/${c.id}`}>Open ticket</Link>
                    </Button>
                    {c.assignedTo?.name && (
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <UserRound className="size-3.5" />
                        Assigned to {c.assignedTo.name}
                      </div>
                    )}
                  </div>

                  {isOpen && threadQuery.isPending && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Loader2 className="text-muted-foreground size-4 animate-spin" />
                        <span className="text-muted-foreground">Loading thread…</span>
                      </div>
                      <Skeleton className="h-16 w-full rounded-lg" />
                      <Skeleton className="h-14 w-11/12 rounded-lg" />
                    </div>
                  )}

                  {isOpen && threadQuery.isError && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Failed to load thread</p>
                      <p className="text-muted-foreground text-sm">{threadQuery.error.message}</p>
                      <Button
                        variant="outline"
                        onClick={() => threadQuery.refetch()}
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  {isOpen && threadQuery.data?.id === c.id && (
                    <MessageThread
                      messages={threadQuery.data.messages}
                      contactEmail={contactEmail}
                    />
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  }

  return (
    <SidebarGroup>
      <SectionHeader
        title="Conversations"
        icon={<MessageSquareText className="size-4" />}
      />
      <div className="mt-3">{content}</div>
    </SidebarGroup>
  );
};

type ThreadMessages = RouterOutputs["contact"]["conversationThread"]["messages"];

function MessageThread({
  messages,
  contactEmail,
}: {
  messages: ThreadMessages;
  contactEmail: string;
}) {
  if (!messages.length) {
    return <EmptyHint text="No messages in this conversation yet." />;
  }

  return (
    <div className="space-y-3">
      {messages.map((m) => {
        const isInbound = m.direction === "inbound";
        const author =
          isInbound ?
            (m.contact?.displayName ?? m.contact?.email ?? contactEmail)
          : (m.sender?.name ?? "Agent");
        const body = (m.textBody ?? "").trim();
        return (
          <div
            key={m.id}
            className={cn("flex", isInbound ? "justify-start" : "justify-end")}
          >
            <div
              className={cn(
                "border-accent/50 max-w-[90%] rounded-lg p-3",
                isInbound ? "bg-background" : "bg-accent/10"
              )}
            >
              <div className="flex min-w-0 items-center justify-between gap-3">
                <p className="min-w-0 truncate text-xs font-semibold">{author}</p>
                <p className="text-muted-foreground shrink-0 text-[11px] whitespace-nowrap">
                  {formatCompactDateTime(m.createdAt)}
                </p>
              </div>
              <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                {body || "(no text body)"}
              </p>
              {m.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.attachments.map((a) => (
                    <span
                      key={a.id}
                      className="text-muted-foreground inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px]"
                    >
                      {a.filename}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
