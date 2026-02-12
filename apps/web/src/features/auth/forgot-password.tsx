"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type ForgotPasswordProps = {
  openSignInTab: () => void;
};

export function ForgotPassword({ openSignInTab }: ForgotPasswordProps) {
  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      const res = await authClient.requestPasswordReset({
        email: value.email,
        redirectTo: "/auth/reset-password",
      });

      if (res.error) {
        toast.error(res.error.message ?? "Failed to send password reset email");
      } else {
        toast.success("Password reset email sent");
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
      }),
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field name="email">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              name="forgot-email"
              type="email"
              placeholder="you@example.com"
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
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={openSignInTab}
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={!state.canSubmit || state.isSubmitting}
              className="flex-1"
            >
              {state.isSubmitting ? "Sending..." : "Send Reset Email"}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
