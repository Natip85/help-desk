"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { ChevronDown, Forward, GitBranchPlus, Notebook, Paperclip, Undo2 } from "lucide-react";

import type { RouterOutputs } from "@help-desk/api";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc";

type ThreadData = RouterOutputs["contact"]["conversationThread"];
type ThreadMessage = ThreadData["messages"][number];
type ThreadNote = ThreadData["notes"][number];
type TicketEvent = RouterOutputs["ticket"]["getTicketEvents"][number];

type TimelineItem =
  | { kind: "message"; data: ThreadMessage }
  | { kind: "note"; data: ThreadNote }
  | { kind: "event"; data: TicketEvent };

function formatMessageDateTime(date: Date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target"],
  });
}

function buildTimeline(
  messages: ThreadMessage[],
  notes: ThreadNote[],
  events: TicketEvent[] = []
): TimelineItem[] {
  const items: TimelineItem[] = [
    ...messages.map((m) => ({ kind: "message" as const, data: m })),
    ...notes.map((n) => ({ kind: "note" as const, data: n })),
    ...events.map((e) => ({ kind: "event" as const, data: e })),
  ];

  return items.sort(
    (a, b) => new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime()
  );
}

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: ThreadMessage }) {
  const [showDetails, setShowDetails] = useState(false);
  const isOutbound = message.direction === "outbound";
  const isForward = message.messageType === "forward";

  const authorName =
    isOutbound ?
      (message.sender?.name ?? "Agent")
    : (message.contact?.displayName ?? message.contact?.email ?? message.fromEmail);

  const authorImage = isOutbound ? message.sender?.image : message.contact?.avatarUrl;
  const initials = getInitials(authorName);

  const htmlBody = message.htmlBody?.trim();
  const textBody = message.textBody?.trim();

  const hasCc = (message.cc?.length ?? 0) > 0;
  const hasBcc = isOutbound && (message.bcc?.length ?? 0) > 0;
  const hasEmailDetails = hasCc || hasBcc;

  return (
    <div
      className={cn(
        "rounded-lg p-4",
        isForward ?
          "border border-blue-300/50 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-950/30"
        : isOutbound ? "bg-primary/30 dark:bg-primary/30"
        : "bg-transparent"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          {authorImage && (
            <AvatarImage
              src={authorImage}
              alt={authorName}
            />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="truncate text-sm font-semibold">{authorName}</span>
          {isForward ?
            <span className="inline-flex items-center gap-1 text-xs text-blue-700 dark:text-blue-400">
              <Forward className="size-3" />
              forwarded to {message.toEmail?.[0] ?? "unknown"}
            </span>
          : isOutbound ?
            <span className="text-xs italic">replied</span>
          : null}
          {hasEmailDetails && (
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 text-xs transition-colors"
            >
              <ChevronDown
                className={cn(
                  "size-3 transition-transform duration-150",
                  showDetails && "rotate-180"
                )}
              />
              {showDetails ? "hide" : "details"}
            </button>
          )}
        </div>
        <time className="shrink-0 text-xs">{formatMessageDateTime(message.createdAt)}</time>
      </div>

      {/* Email details (To, CC, BCC) */}
      {showDetails && hasEmailDetails && (
        <div className="text-muted-foreground mt-1.5 space-y-0.5 pl-9 text-xs">
          <p>
            <span className="font-medium">To:</span> {message.toEmail?.join(", ") ?? "—"}
          </p>
          {hasCc && (
            <p>
              <span className="font-medium">Cc:</span> {message.cc?.join(", ")}
            </p>
          )}
          {hasBcc && (
            <p>
              <span className="font-medium">Bcc:</span> {message.bcc?.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Body */}
      <div className="mt-3 pl-9">
        {htmlBody ?
          <div
            className="prose prose-sm dark:prose-invert max-w-none wrap-break-word"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlBody) }}
          />
        : <p className="text-sm whitespace-pre-wrap">{textBody ?? "(no content)"}</p>}

        {/* Attachments */}
        {message.attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.attachments.map((a) => (
              <span
                key={a.id}
                className="text-muted-foreground bg-muted inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs"
              >
                <Paperclip className="size-3" />
                {a.filename}
                {a.size != null && (
                  <span className="text-muted-foreground/60">({Math.round(a.size / 1024)}KB)</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NoteBubble
// ---------------------------------------------------------------------------

function NoteBubble({ note }: { note: ThreadNote }) {
  const authorName = note.author?.name ?? "Agent";
  const authorImage = note.author?.image;
  const initials = getInitials(authorName);

  return (
    <div className="rounded-lg border border-amber-300/50 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-950/30">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          {authorImage && (
            <AvatarImage
              src={authorImage}
              alt={authorName}
            />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="truncate text-sm font-semibold">{authorName}</span>
          <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
            <Notebook className="size-3" />
            added a note
          </span>
        </div>
        <time className="text-muted-foreground shrink-0 text-xs">
          {formatMessageDateTime(note.createdAt)}
        </time>
      </div>

      {/* Body */}
      <div className="mt-3 pl-9">
        <div
          className="prose prose-sm dark:prose-invert max-w-none wrap-break-word"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.body) }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MergeEventBubble
// ---------------------------------------------------------------------------

function MergeEventBubble({ event }: { event: TicketEvent }) {
  const actorName = event.actor?.name ?? "System";
  const payload = event.payload as Record<string, string> | null;
  const isUnmerge = event.type === "ticket_unmerged";

  if (isUnmerge) {
    const unmergedTicketId = payload?.unmergedTicketId;
    const unmergedTicketSubject = payload?.unmergedTicketSubject;
    const previouslyMergedIntoId = payload?.previouslyMergedIntoId;

    return (
      <div className="flex items-center gap-3 rounded-lg px-4 py-3">
        <div className="bg-muted flex size-6 items-center justify-center rounded-full">
          <Undo2 className="text-muted-foreground size-3.5" />
        </div>
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">{actorName}</span>{" "}
          {unmergedTicketId ?
            <>
              unmerged{" "}
              <Link
                href={`/tickets/${unmergedTicketId}`}
                className="text-foreground font-medium underline underline-offset-2"
              >
                {unmergedTicketSubject ?? "a ticket"}
              </Link>{" "}
              from this ticket
            </>
          : previouslyMergedIntoId ?
            <>
              unmerged this ticket from{" "}
              <Link
                href={`/tickets/${previouslyMergedIntoId}`}
                className="text-foreground font-medium underline underline-offset-2"
              >
                its parent ticket
              </Link>
            </>
          : "unmerged a ticket"}
        </p>
        <time className="text-muted-foreground ml-auto shrink-0 text-xs">
          {formatMessageDateTime(event.createdAt)}
        </time>
      </div>
    );
  }

  const isMergedInto = !!payload?.mergedIntoTicketId;
  const linkedTicketId = isMergedInto ? payload?.mergedIntoTicketId : payload?.mergedTicketId;
  const linkedTicketSubject =
    isMergedInto ? payload?.mergedIntoTicketSubject : payload?.mergedTicketSubject;

  return (
    <div className="flex items-center gap-3 rounded-lg px-4 py-3">
      <div className="bg-muted flex size-6 items-center justify-center rounded-full">
        <GitBranchPlus className="text-muted-foreground size-3.5" />
      </div>
      <p className="text-muted-foreground text-sm">
        <span className="text-foreground font-medium">{actorName}</span>{" "}
        {isMergedInto ?
          <>
            merged this ticket into{" "}
            {linkedTicketId ?
              <Link
                href={`/tickets/${linkedTicketId}`}
                className="text-foreground font-medium underline underline-offset-2"
              >
                {linkedTicketSubject ?? "another ticket"}
              </Link>
            : "another ticket"}
          </>
        : <>
            merged{" "}
            {linkedTicketId ?
              <Link
                href={`/tickets/${linkedTicketId}`}
                className="text-foreground font-medium underline underline-offset-2"
              >
                {linkedTicketSubject ?? "a ticket"}
              </Link>
            : "a ticket"}{" "}
            into this ticket
          </>
        }
      </p>
      <time className="text-muted-foreground ml-auto shrink-0 text-xs">
        {formatMessageDateTime(event.createdAt)}
      </time>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConversationThread
// ---------------------------------------------------------------------------

type ConversationThreadProps = {
  ticketId: string;
};

export function ConversationThread({ ticketId }: ConversationThreadProps) {
  const trpc = useTRPC();

  const {
    data: thread,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(trpc.contact.conversationThread.queryOptions({ conversationId: ticketId }));

  const { data: ticketEvents } = useQuery(trpc.ticket.getTicketEvents.queryOptions(ticketId));

  const timeline = useMemo(() => {
    if (!thread) return [];
    return buildTimeline(thread.messages ?? [], thread.notes ?? [], ticketEvents ?? []);
  }, [thread, ticketEvents]);

  // Loading
  if (isPending) {
    return (
      <div className="space-y-4 pb-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <div className="flex-1" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="pl-9">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-1.5 h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <p className="text-sm font-medium">Failed to load conversation</p>
        <p className="text-muted-foreground text-sm">{error.message}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
        No messages in this conversation yet.
      </div>
    );
  }

  return (
    <div className="space-y-1 pb-2">
      {timeline.map((item, idx) => (
        <div key={item.data.id}>
          {item.kind === "message" ?
            <MessageBubble message={item.data} />
          : item.kind === "note" ?
            <NoteBubble note={item.data} />
          : <MergeEventBubble event={item.data} />}
          {idx < timeline.length - 1 && <Separator className="my-1" />}
        </div>
      ))}
    </div>
  );
}
