"use client";

import type { Editor, JSONContent } from "@tiptap/react";
import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, Loader2, Reply, X } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTRPC } from "@/trpc";
import { RichTextEditor } from "./rich-text-editor";

type EmailEditorProps = {
  ticketId: string;
};

export function EmailEditor({ ticketId }: EmailEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const trpc = useTRPC();

  const { data: ticket } = useQuery(trpc.ticket.getById.queryOptions(ticketId));

  const { mutate: sendReply, isPending } = useMutation(trpc.ticket.sendReply.mutationOptions({}));

  const handleSendSuccess = useCallback(() => {
    editorRef.current?.commands.clearContent();
    setIsOpen(false);
  }, []);

  const handleEditorReady = useCallback((editor: Editor) => {
    editorRef.current = editor;
  }, []);

  const handleSend = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const htmlBody = editor.getHTML();
    const textBody = editor.getText();

    if (!textBody.trim()) return;

    sendReply(
      {
        conversationId: ticketId,
        htmlBody,
        textBody,
      },
      { onSuccess: handleSendSuccess }
    );
  };

  const handleDiscard = () => {
    editorRef.current?.commands.clearContent();
    setIsOpen(false);
  };

  const fromEmail = ticket?.fromEmail ?? "";
  const fromName = ticket?.mailbox?.name ?? fromEmail.split("@")[0] ?? "Support";
  const fromInitials = fromName.slice(0, 2).toUpperCase();
  const toEmail = ticket?.contact?.email ?? "";

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors">
        <Avatar size="sm">
          <AvatarFallback>{fromInitials}</AvatarFallback>
        </Avatar>

        {isOpen ?
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground truncate text-xs">
              From: <span className="text-foreground">{fromEmail}</span>
            </p>
            <p className="text-muted-foreground truncate text-xs">
              To: <span className="text-foreground">{toEmail}</span>
            </p>
          </div>
        : <div className="flex flex-1 items-center gap-2">
            <Reply className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">Reply</span>
          </div>
        }

        <ChevronDown
          className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="flex flex-col">
          <RichTextEditor
            key={ticketId}
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
                disabled={isPending}
              >
                {isPending ?
                  <Loader2 className="h-4 w-4 animate-spin" />
                : "Send"}
              </Button>
            </div>
          </RichTextEditor>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
