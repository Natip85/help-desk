"use client";

import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTRPC } from "@/trpc";

const createContactSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().trim(),
  lastName: z.string().trim(),
  phone: z.string().trim(),
});

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

export function CreateContactForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync: createContact } = useMutation(trpc.contact.create.mutationOptions());

  const form = useForm({
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await createContact({
          email: value.email,
          firstName: value.firstName || undefined,
          lastName: value.lastName || undefined,
          phone: value.phone || undefined,
        });
        await queryClient.invalidateQueries({ queryKey: trpc.contact.all.queryKey() });
        await queryClient.invalidateQueries({ queryKey: trpc.contact.totalCount.queryKey() });
        toast.success("Contact created successfully");
        router.push("/contacts");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create contact");
      }
    },
    validators: {
      onSubmit: createContactSchema,
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      className="grid gap-6"
    >
      {/* Email */}
      <form.Field name="email">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="contact-email">
              Email <span className="text-destructive">*</span>
            </Label>
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

      {/* First Name / Last Name */}
      <div className="grid gap-6 sm:grid-cols-2">
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

      {/* Phone */}
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

      {/* Actions */}
      <form.Subscribe>
        {(state) => (
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? "Creating..." : "Create Contact"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
