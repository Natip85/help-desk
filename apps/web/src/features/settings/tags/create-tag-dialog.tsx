"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc";

export const TAG_COLORS = [
  { label: "Gray", value: "#7C8187" },
  { label: "Red", value: "#C25D5D" },
  { label: "Orange", value: "#C0885A" },
  { label: "Yellow", value: "#B5A053" },
  { label: "Green", value: "#5D9E7E" },
  { label: "Blue", value: "#6B8DAD" },
  { label: "Purple", value: "#8A7BAD" },
  { label: "Pink", value: "#B5708E" },
] as const;

const tagSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().min(1, "Color is required"),
});

type EditTag = {
  id: string;
  name: string;
  color: string;
};

type CreateTagDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTag?: EditTag;
  defaultName?: string;
};

export function CreateTagDialog({
  open,
  onOpenChange,
  editTag,
  defaultName,
}: CreateTagDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEditing = !!editTag;

  const { mutateAsync: createTag } = useMutation(
    trpc.tags.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.tags.list.queryKey() });
      },
    })
  );

  const { mutateAsync: updateTag } = useMutation(
    trpc.tags.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.tags.list.queryKey() });
      },
    })
  );

  const form = useForm({
    defaultValues: {
      name: editTag?.name ?? defaultName ?? "",
      color: editTag?.color ?? "#7C8187",
    },
    onSubmit: async ({ value }) => {
      try {
        if (isEditing) {
          await updateTag({
            id: editTag.id,
            name: value.name,
            color: value.color,
          });
          toast.success("Tag updated");
        } else {
          await createTag({
            name: value.name,
            color: value.color,
          });
          toast.success("Tag created");
        }
        form.reset();
        onOpenChange(false);
      } catch (error) {
        toast.error(
          error instanceof Error ?
            error.message
          : `Failed to ${isEditing ? "update" : "create"} tag`
        );
      }
    },
    validators: {
      onSubmit: tagSchema,
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Tag" : "Add Tag"}</DialogTitle>
          <DialogDescription>
            {isEditing ?
              "Update the tag details."
            : "Add a new tag to categorize your tickets and contacts."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="tag-name">Name</Label>
                <Input
                  id="tag-name"
                  name="tag-name"
                  placeholder="e.g. Bug, Feature, Urgent"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p
                    key={error?.message}
                    className="text-destructive text-sm"
                  >
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="color">
            {(field) => (
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-all",
                        field.state.value === c.value ?
                          "ring-primary scale-110 border-transparent ring-2 ring-offset-2"
                        : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: c.value }}
                      onClick={() => field.handleChange(c.value)}
                    />
                  ))}
                </div>
                {field.state.meta.errors.map((error) => (
                  <p
                    key={error?.message}
                    className="text-destructive text-sm"
                  >
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Subscribe>
            {(state) => (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
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
                      "Updating..."
                    : "Creating..."
                  : isEditing ?
                    "Update"
                  : "Create"}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
