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
import { useTRPC } from "@/trpc";

const folderSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type CreateFolderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateFolderDialog({ open, onOpenChange }: CreateFolderDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutateAsync: createFolder } = useMutation(
    trpc.cannedResponse.folderCreate.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.cannedResponse.folderList.queryKey(),
        });
      },
    })
  );

  const form = useForm({
    defaultValues: {
      name: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await createFolder({ name: value.name });
        toast.success("Folder created");
        form.reset();
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create folder");
      }
    },
    validators: {
      onSubmit: folderSchema,
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
          <DialogDescription>
            Create a new folder to organize your canned responses.
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
                <Label htmlFor="folder-name">Name</Label>
                <Input
                  id="folder-name"
                  name="folder-name"
                  placeholder="e.g. Greetings, Closings, FAQ"
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
                  {state.isSubmitting ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
