"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";

export function ChangePasswordForm() {
  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      revokeOtherSessions: true,
    },
    onSubmit: async ({ value }) => {
      const res = await authClient.changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
        revokeOtherSessions: value.revokeOtherSessions,
      });

      if (res.error) {
        toast.error(res.error.message ?? "Failed to change password");
      } else {
        toast.success("Password changed successfully");
        form.reset();
      }
    },
    validators: {
      onSubmit: z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
        revokeOtherSessions: z.boolean(),
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
      <form.Field name="currentPassword">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="change-currentPassword">Current Password</Label>
            <PasswordInput
              id="change-currentPassword"
              name="change-currentPassword"
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

      <form.Field name="newPassword">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="change-newPassword">New Password</Label>
            <PasswordInput
              id="change-newPassword"
              name="change-newPassword"
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

      <form.Field name="revokeOtherSessions">
        {(field) => (
          <div className="flex items-center gap-2">
            <Checkbox
              id="change-revokeOtherSessions"
              checked={field.state.value}
              onCheckedChange={(checked) => field.handleChange(checked === true)}
            />
            <Label htmlFor="change-revokeOtherSessions">Log out other sessions</Label>
          </div>
        )}
      </form.Field>

      <form.Subscribe>
        {(state) => (
          <Button
            type="submit"
            className="w-full"
            disabled={!state.canSubmit || state.isSubmitting}
          >
            {state.isSubmitting ? "Changing..." : "Change Password"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
