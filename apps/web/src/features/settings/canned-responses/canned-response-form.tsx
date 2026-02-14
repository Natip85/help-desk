"use client";

import type { Editor } from "@tiptap/react";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/trpc";
import { RichTextEditor } from "../../ticket/rich-text-editor";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  body: z.string().min(1, "Body is required"),
});

type CannedResponseFormProps = {
  cannedId?: string;
  folderId?: string | null;
};

export function CannedResponseForm({ cannedId, folderId }: CannedResponseFormProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const editorRef = useRef<Editor | null>(null);
  const isEditing = !!cannedId;

  const { data: existing, isLoading } = useQuery(
    trpc.cannedResponse.getById.queryOptions(cannedId ? { id: cannedId } : skipToken)
  );

  const { mutateAsync: createCannedResponse } = useMutation(
    trpc.cannedResponse.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.cannedResponse.list.queryKey(),
        });
      },
    })
  );

  const { mutateAsync: updateCannedResponse } = useMutation(
    trpc.cannedResponse.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.cannedResponse.list.queryKey(),
        });
        if (cannedId) {
          void queryClient.invalidateQueries({
            queryKey: trpc.cannedResponse.getById.queryKey({ id: cannedId }),
          });
        }
      },
    })
  );

  const form = useForm({
    defaultValues: {
      name: existing?.name ?? "",
      body: existing?.body ?? "",
    },
    onSubmit: async ({ value }) => {
      // Get HTML from the editor
      const body = editorRef.current?.getHTML() ?? value.body;

      try {
        if (isEditing && cannedId) {
          await updateCannedResponse({
            id: cannedId,
            name: value.name,
            body,
          });
          toast.success("Canned response updated");
        } else {
          await createCannedResponse({
            name: value.name,
            body,
            folderId: folderId ?? undefined,
          });
          toast.success("Canned response created");
        }
        router.push("/settings/canned-responses");
      } catch (error) {
        toast.error(
          error instanceof Error ?
            error.message
          : `Failed to ${isEditing ? "update" : "create"} canned response`
        );
      }
    },
    validators: {
      onSubmit: formSchema,
    },
  });

  const handleEditorReady = (editor: Editor) => {
    editorRef.current = editor;
    if (existing?.body) {
      editor.commands.setContent(existing.body);
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();

        // Sync editor HTML into form state before submit
        if (editorRef.current) {
          const html = editorRef.current.getHTML();
          form.setFieldValue("body", html);
        }

        void form.handleSubmit();
      }}
    >
      {/* Name field */}
      <div className="space-y-2 px-6 pt-6 pb-4">
        <form.Field name="name">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="canned-name">Title</Label>
              <Input
                id="canned-name"
                name="canned-name"
                placeholder="e.g. Welcome greeting, Closing message"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error, i) => (
                <p
                  key={i}
                  className="text-destructive text-sm"
                >
                  {typeof error === "string" ? error : error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>
      </div>

      {/* Rich text editor for body */}
      <div className="flex min-h-0 flex-1 flex-col px-6 pb-4">
        <Label className="mb-2">Body</Label>
        <div className="border-primary flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
          <RichTextEditor onEditorReady={handleEditorReady} />
        </div>
        <form.Field name="body">
          {(field) => (
            <>
              {field.state.meta.errors.map((error, i) => (
                <p
                  key={i}
                  className="text-destructive mt-1 text-sm"
                >
                  {typeof error === "string" ? error : error?.message}
                </p>
              ))}
            </>
          )}
        </form.Field>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 px-6 py-4">
        <form.Subscribe>
          {(state) => (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/settings/canned-responses")}
                disabled={state.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!state.canSubmit || state.isSubmitting}
              >
                {state.isSubmitting ?
                  isEditing ?
                    "Saving..."
                  : "Creating..."
                : isEditing ?
                  "Save Changes"
                : "Create"}
              </Button>
            </>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
