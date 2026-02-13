"use client";

import type { Editor, JSONContent } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Forward, Loader2, X } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc";
import { RichTextEditor } from "./rich-text-editor";

type ForwardEmailEditorProps = {
  ticketId: string;
};

function formatDate(date: Date) {
  return new Date(date).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ForwardEmailEditor({ ticketId }: ForwardEmailEditorProps) {
  const [activeEditor, setActiveEditor] = useQueryState(
    "editor",
    parseAsStringLiteral(["reply", "forward"] as const)
  );
  const isOpen = activeEditor === "forward";
  const setIsOpen = (open: boolean) => setActiveEditor(open ? "forward" : null);
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [toEmail, setToEmail] = useState("");
  const hasInjectedContent = useRef(false);
  const threadRef = useRef<typeof thread>(undefined);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: ticket } = useQuery(trpc.ticket.getById.queryOptions(ticketId));

  const { data: thread } = useQuery(
    trpc.contact.conversationThread.queryOptions({ conversationId: ticketId })
  );

  // Keep threadRef in sync so handleEditorReady can access latest data
  useEffect(() => {
    threadRef.current = thread;
  }, [thread]);

  const injectQuotedContent = () => {
    const currentThread = threadRef.current;
    if (!editorRef.current || !currentThread || hasInjectedContent.current) return;

    const messages = [...(currentThread.messages ?? [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latestMessage = messages.find((m) => m.direction === "inbound") ?? messages[0];

    if (latestMessage) {
      const from = latestMessage.fromEmail;
      const date = formatDate(latestMessage.createdAt);
      const subject = latestMessage.subject ?? "(no subject)";
      const to = latestMessage.toEmail?.join(", ") ?? "";
      const body = latestMessage.htmlBody ?? latestMessage.textBody ?? "";

      const quotedHtml =
        `<p></p>` +
        `<p>---------- Forwarded message ---------</p>` +
        `<p><strong>From:</strong> ${from}<br/>` +
        `<strong>Date:</strong> ${date}<br/>` +
        `<strong>Subject:</strong> ${subject}<br/>` +
        `<strong>To:</strong> ${to}</p>` +
        `<br/>` +
        body;

      editorRef.current.commands.setContent(quotedHtml);
      editorRef.current.commands.focus("start");
      hasInjectedContent.current = true;
    }
  };

  // Handle case where thread data arrives after the editor is already ready
  useEffect(() => {
    if (isOpen && thread) {
      injectQuotedContent();
    }
    if (!isOpen) {
      hasInjectedContent.current = false;
    }
  }, [isOpen, thread]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const { mutate: forwardEmail, isPending } = useMutation(
    trpc.ticket.forwardEmail.mutationOptions({})
  );

  const handleSendSuccess = () => {
    editorRef.current?.commands.clearContent();
    setToEmail("");
    void setIsOpen(false);
    void queryClient.invalidateQueries({
      queryKey: trpc.contact.conversationThread.queryOptions({
        conversationId: ticketId,
      }).queryKey,
    });
  };

  const handleEditorReady = (editor: Editor) => {
    editorRef.current = editor;
    injectQuotedContent();
  };

  const handleSend = () => {
    const editor = editorRef.current;
    if (!editor || !toEmail.trim()) return;

    const htmlBody = editor.getHTML();
    const textBody = editor.getText();

    if (!textBody.trim()) return;

    forwardEmail(
      {
        conversationId: ticketId,
        toEmail: toEmail.trim(),
        htmlBody,
        textBody,
      },
      { onSuccess: handleSendSuccess }
    );
  };

  const handleDiscard = () => {
    editorRef.current?.commands.clearContent();
    setToEmail("");
    void setIsOpen(false);
  };

  const fromEmail = ticket?.fromEmail ?? "";
  const fromName = ticket?.mailbox?.name ?? fromEmail.split("@")[0] ?? "Support";
  const fromInitials = fromName.slice(0, 2).toUpperCase();

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail.trim());
  const canSend = toEmail.trim().length > 0 && isValidEmail;

  return (
    <Collapsible
      ref={containerRef}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <CollapsibleTrigger className="hover:bg-accent/80 bg-accent/50 flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors">
        <Avatar size="sm">
          <AvatarFallback>{fromInitials}</AvatarFallback>
        </Avatar>

        {isOpen ?
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground truncate text-xs">
              From: <span className="text-foreground">{fromEmail}</span>
            </p>
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              To: <span className="text-foreground">{toEmail || "..."}</span>
            </div>
          </div>
        : <div className="flex flex-1 items-center gap-2">
            <Forward className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">Forward</span>
          </div>
        }

        <ChevronDown
          className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <label
              htmlFor="forward-to-email"
              className="text-muted-foreground shrink-0 text-xs"
            >
              To:
            </label>
            <Input
              id="forward-to-email"
              type="email"
              placeholder="recipient@example.com"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              size="sm"
              className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
          <RichTextEditor
            key={`${ticketId}-forward`}
            content={[] as JSONContent[]}
            onEditorReady={handleEditorReady}
          >
            <div className="flex items-center justify-end gap-2 pt-2 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                disabled={isPending}
              >
                <X className="mr-1 h-4 w-4" />
                Discard
              </Button>
              <Button
                size="lg"
                className="min-w-24"
                onClick={handleSend}
                disabled={isPending || !canSend}
              >
                {isPending ?
                  <Loader2 className="h-4 w-4 animate-spin" />
                : "Forward"}
              </Button>
            </div>
          </RichTextEditor>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
