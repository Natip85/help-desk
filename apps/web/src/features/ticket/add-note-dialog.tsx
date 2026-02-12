"use client";

import type { Editor, JSONContent } from "@tiptap/react";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Notebook } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTRPC } from "@/trpc";
import { RichTextEditor } from "./rich-text-editor";

type AddNoteDialogProps = {
  ticketId: string;
};

export const AddNoteDialog = ({ ticketId }: AddNoteDialogProps) => {
  const [open, setOpen] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: addNote, isPending } = useMutation(trpc.ticket.addNote.mutationOptions({}));

  const handleEditorReady = (editor: Editor) => {
    editorRef.current = editor;
  };

  const handleSave = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const htmlBody = editor.getHTML();
    const textBody = editor.getText();

    if (!textBody.trim()) return;

    addNote(
      { conversationId: ticketId, body: htmlBody },
      {
        onSuccess: () => {
          editorRef.current?.commands.clearContent();
          setOpen(false);
          void queryClient.invalidateQueries({
            queryKey: trpc.contact.conversationThread.queryOptions({
              conversationId: ticketId,
            }).queryKey,
          });
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Notebook />
          Add note
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add note</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <RichTextEditor
            content={[] as JSONContent[]}
            onEditorReady={handleEditorReady}
          >
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isPending}
              >
                {isPending ?
                  <Loader2 className="h-4 w-4 animate-spin" />
                : "Save note"}
              </Button>
            </div>
          </RichTextEditor>
        </div>
      </DialogContent>
    </Dialog>
  );
};
