"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { skipToken, useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Mail,
  MessageSquareText,
  Tag,
  Ticket,
  UserRound,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc";
import {
  getContactDisplayName,
  getContactInitials,
  priorityConfig,
  statusConfig,
} from "../tickets/ticket-card";
import { useSidebarParams } from "./query-params";

export const ContactInfoSidebar = () => {
  const trpc = useTRPC();
  const {
    sidebarParams: { contactId },
    setSidebarParams,
  } = useSidebarParams();

  const [activeTab, setActiveTab] = useState<"overview" | "conversations">("overview");
  // Keep the Accordion controlled at all times.
  // Radix "single" Accordion uses an empty string ("") when fully collapsed.
  const [openConversationId, setOpenConversationId] = useState<string>("");

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [copied]);
  const contactQuery = useQuery(trpc.contact.getById.queryOptions(contactId ?? skipToken));

  const conversationsQuery = useQuery(
    trpc.contact.conversations.queryOptions(
      contactId ?
        {
          contactId,
          limit: 25,
        }
      : skipToken
    )
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

  const data = contactQuery.data;

  const headerTitle = useMemo(() => {
    if (!data) return "Contact Info";
    return getContactDisplayName(data.contact) ?? data.contact.email;
  }, [data]);

  if (contactQuery.isPending) {
    return (
      <>
        <SidebarHeader className="border-accent/50 relative border-b p-3">
          <div className="flex items-start gap-3">
            <Skeleton className="size-12 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="scrollbar-gutter-stable flex-1 overflow-y-auto p-3">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </SidebarContent>
        <SidebarFooter className="border-accent/50 border-t p-3">
          <Skeleton className="h-8 w-full" />
        </SidebarFooter>
      </>
    );
  }

  if (contactQuery.isError) {
    return (
      <>
        <SidebarHeader className="border-accent/50 relative border-b p-2">
          <h2 className="text-lg font-medium">Contact Info</h2>
        </SidebarHeader>
        <SidebarContent className="scrollbar-gutter-stable flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">Failed to load contact</p>
            <p className="text-muted-foreground text-sm">{contactQuery.error.message}</p>
            <Button
              variant="outline"
              onClick={() => contactQuery.refetch()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </SidebarContent>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <SidebarHeader className="border-accent/50 relative border-b p-2">
          <h2 className="text-lg font-medium">Contact Info</h2>
        </SidebarHeader>
        <SidebarContent className="scrollbar-gutter-stable flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">Contact not found</p>
            <p className="text-muted-foreground text-sm">
              This contact may have been deleted or you don’t have access to it.
            </p>
          </div>
        </SidebarContent>
        <SidebarFooter className="border-accent/50 border-t p-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => void setSidebarParams(null)}
          >
            Close
          </Button>
        </SidebarFooter>
      </>
    );
  }

  const contact = data.contact;
  const displayName = getContactDisplayName(contact) ?? contact.email;
  const initials = getContactInitials(contact);

  const recentTicketsContent =
    data.recentTickets.length === 0 ?
      <EmptyHint text="No tickets yet for this contact." />
    : data.recentTickets.map((t) => {
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
      });

  const timelineContent =
    data.recentEvents.length === 0 ?
      <EmptyHint text="No timeline events yet." />
    : data.recentEvents.map((e) => (
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
      ));

  let conversationsContent: React.ReactNode;
  if (conversationsQuery.isPending) {
    conversationsContent = (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    );
  } else if (conversationsQuery.isError) {
    conversationsContent = (
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
    conversationsContent = <EmptyHint text="No conversations yet for this contact." />;
  } else {
    conversationsContent = (
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
                      contactEmail={contact.email}
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
    <>
      <SidebarHeader className="border-accent/50 relative border-b p-4 pr-6">
        <div className="flex items-start gap-2">
          <Avatar className="size-12 shrink-0">
            {contact.avatarUrl && (
              <AvatarImage
                src={contact.avatarUrl}
                alt={displayName}
              />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold">{headerTitle}</h2>
                <p className="text-muted-foreground truncate text-sm">{contact.email}</p>
                {data.company?.name && (
                  <p className="text-muted-foreground truncate text-xs">
                    {data.company.name}
                    {data.company.domain ? ` · ${data.company.domain}` : ""}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(contact.email).then(() => {
                    setCopied(true);
                  });
                }}
              >
                <Mail className="size-3.5" />
                Copy email
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      void navigator.clipboard.writeText(contact.email).then(() => {
                        setCopied(true);
                      });
                    }}
                    className="h-auto p-1"
                  >
                    {copied ?
                      <Check className="size-5" />
                    : <Copy className="size-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copied ? "Copied" : "Copy to clipboard"}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-gutter-stable flex-1 overflow-y-auto p-2">
        <Tabs
          value={activeTab}
          onValueChange={(t) => setActiveTab(t as typeof activeTab)}
        >
          <TabsList className="mb-3 grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="mt-0"
          >
            <SidebarGroup>
              <SectionHeader
                title="Recent tickets"
                icon={<Ticket className="size-4" />}
              />
              <div className="mt-3 space-y-2">{recentTicketsContent}</div>
            </SidebarGroup>

            <Separator className="my-4" />

            <SidebarGroup className="p-0">
              <SectionHeader
                title="Timeline"
                icon={<CalendarClock className="size-4" />}
              />
              <div className="mt-3 space-y-3">{timelineContent}</div>
            </SidebarGroup>
          </TabsContent>

          <TabsContent
            value="conversations"
            className="mt-0"
          >
            <SidebarGroup>
              <SectionHeader
                title="Conversations"
                icon={<MessageSquareText className="size-4" />}
              />

              <div className="mt-3">{conversationsContent}</div>
            </SidebarGroup>
          </TabsContent>
        </Tabs>
      </SidebarContent>

      <SidebarFooter className="border-accent/50 border-t p-3">
        <Button
          className="w-full"
          onClick={() => void setSidebarParams(null)}
        >
          Close
        </Button>
      </SidebarFooter>
    </>
  );
};

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-muted-foreground">{icon}</div>
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="text-muted-foreground rounded-lg border border-dashed p-3 text-sm">{text}</div>
  );
}

function formatCompactDateTime(date: Date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
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

function MessageThread({
  messages,
  contactEmail,
}: {
  messages: {
    id: string;
    direction: "inbound" | "outbound";
    createdAt: Date;
    subject: string | null;
    textBody: string | null;
    htmlBody: string | null;
    fromEmail: string;
    toEmail: string[];
    cc: string[] | null;
    bcc: string[] | null;
    senderId: string | null;
    contactId: string | null;
    resendEmailId: string | null;
    emailMessageId: string | null;
    inReplyTo: string | null;
    references: string | null;
    rawHeaders: unknown;
    sender: { id: string; name: string | null; image: string | null } | null;
    contact: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      displayName: string | null;
      avatarUrl: string | null;
    } | null;
    attachments: {
      id: string;
      filename: string;
      mimeType: string;
      size: number | null;
      storageUrl: string | null;
      createdAt: Date;
    }[];
  }[];
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
