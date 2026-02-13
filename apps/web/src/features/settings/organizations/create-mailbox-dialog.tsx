"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

const mailboxSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  isDefault: z.boolean(),
});

type EditMailbox = {
  id: string;
  name: string;
  email: string;
  isDefault: boolean;
};

type CreateMailboxDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editMailbox?: EditMailbox;
};

export function CreateMailboxDialog({ open, onOpenChange, editMailbox }: CreateMailboxDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEditing = !!editMailbox;

  const { mutateAsync: createMailbox } = useMutation(
    trpc.mailbox.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.mailbox.list.queryKey() });
      },
    })
  );

  const { mutateAsync: updateMailbox } = useMutation(
    trpc.mailbox.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.mailbox.list.queryKey() });
      },
    })
  );

  const form = useForm({
    defaultValues: {
      name: editMailbox?.name ?? "",
      email: editMailbox?.email ?? "",
      isDefault: editMailbox?.isDefault ?? false,
    },
    onSubmit: async ({ value }) => {
      try {
        if (isEditing) {
          await updateMailbox({
            id: editMailbox.id,
            name: value.name,
            email: value.email,
            isDefault: value.isDefault,
          });
          toast.success("Mailbox updated");
        } else {
          await createMailbox({
            name: value.name,
            email: value.email,
            isDefault: value.isDefault,
          });
          toast.success("Mailbox created");
        }
        form.reset();
        onOpenChange(false);
      } catch (error) {
        toast.error(
          error instanceof Error ?
            error.message
          : `Failed to ${isEditing ? "update" : "create"} mailbox`
        );
      }
    },
    validators: {
      onSubmit: mailboxSchema,
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Mailbox" : "Add Mailbox"}</DialogTitle>
          <DialogDescription>
            {isEditing ?
              "Update the mailbox details."
            : "Add a new mailbox to receive and send emails from."}
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
                <Label htmlFor="mailbox-name">Name</Label>
                <Input
                  id="mailbox-name"
                  name="mailbox-name"
                  placeholder="Support"
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

          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="mailbox-email">Email Address</Label>
                <Input
                  id="mailbox-email"
                  name="mailbox-email"
                  type="email"
                  placeholder="support@yourdomain.com"
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

          <form.Field name="isDefault">
            {(field) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mailbox-default"
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked === true)}
                />
                <Label
                  htmlFor="mailbox-default"
                  className="text-sm font-normal"
                >
                  Set as default mailbox
                </Label>
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
