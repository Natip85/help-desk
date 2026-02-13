"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";

type SignInTabProps = {
  openEmailVerificationTab: (email: string) => void;
  openForgotPassword: () => void;
  redirectUrl?: string;
};

export function SignInTab({
  openEmailVerificationTab,
  openForgotPassword,
  redirectUrl,
}: SignInTabProps) {
  const lastMethod = authClient.getLastUsedLoginMethod();
  const isEmailLastUsed = lastMethod === "email";

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const res = await authClient.signIn.email(
        { ...value, callbackURL: redirectUrl ?? "/onboarding" },
        {
          onError: (error) => {
            if (error.error.code === "EMAIL_NOT_VERIFIED") {
              openEmailVerificationTab(value.email);
            }
            toast.error(error.error.message || "Failed to sign in");
          },
        }
      );

      if (res.error == null && !res.data.user.emailVerified) {
        openEmailVerificationTab(value.email);
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field name="email">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={`signin-${field.name}`}>Email</Label>
            <Input
              id={`signin-${field.name}`}
              name={`signin-${field.name}`}
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

      <form.Field name="password">
        {(field) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`signin-${field.name}`}>Password</Label>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={openForgotPassword}
              >
                Forgot password?
              </Button>
            </div>
            <PasswordInput
              id={`signin-${field.name}`}
              name={`signin-${field.name}`}
              placeholder="••••••••"
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
          <Button
            type="submit"
            className="relative w-full"
            disabled={!state.canSubmit || state.isSubmitting}
          >
            {state.isSubmitting ? "Signing in..." : "Sign In"}
            {isEmailLastUsed && (
              <Badge
                variant="outline"
                className="absolute -top-2 -right-2 ml-2"
              >
                Last used
              </Badge>
            )}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
