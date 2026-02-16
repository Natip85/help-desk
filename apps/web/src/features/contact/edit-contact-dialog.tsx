"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import type { RouterOutputs } from "@help-desk/api";

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

const editContactSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().trim(),
  lastName: z.string().trim(),
  phone: z.string().trim(),
});

type ContactData = RouterOutputs["contact"]["getById"]["contact"];

type EditContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactData;
};

function getErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: string }).message);
  }
  return null;
}

function FieldError({ errors }: { errors: readonly unknown[] }) {
  if (errors.length === 0) return null;
  return (
    <>
      {errors.map((error) => {
        const message = getErrorMessage(error);
        if (!message) return null;
        return (
          <p
            key={message}
            className="text-destructive text-sm"
          >
            {message}
          </p>
        );
      })}
    </>
  );
}

export function EditContactDialog({ open, onOpenChange, contact }: EditContactDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutateAsync: updateContact } = useMutation(
    trpc.contact.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.contact.getById.queryKey(contact.id) });
        void queryClient.invalidateQueries({ queryKey: trpc.contact.all.queryKey() });
      },
    })
  );

  const form = useForm({
    defaultValues: {
      email: contact.email,
      firstName: contact.firstName ?? "",
      lastName: contact.lastName ?? "",
      phone: contact.phone ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        await updateContact({
          id: contact.id,
          email: value.email,
          firstName: value.firstName || undefined,
          lastName: value.lastName || undefined,
          phone: value.phone || undefined,
        });
        toast.success("Contact updated");
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update contact");
      }
    },
    validators: {
      onSubmit: editContactSchema,
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>Update the contact details.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="email@example.com"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="firstName">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="contact-first-name">First Name</Label>
                  <Input
                    id="contact-first-name"
                    placeholder="First name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            <form.Field name="lastName">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="contact-last-name">Last Name</Label>
                  <Input
                    id="contact-last-name"
                    placeholder="Last name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="phone">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Phone</Label>
                <Input
                  id="contact-phone"
                  placeholder="Phone number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FieldError errors={field.state.meta.errors} />
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
                  {state.isSubmitting ? "Updating..." : "Update"}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
