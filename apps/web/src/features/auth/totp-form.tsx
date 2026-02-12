"use client";

import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function TotpForm() {
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      code: "",
    },
    onSubmit: async ({ value }) => {
      const res = await authClient.twoFactor.verifyTotp({
        code: value.code,
      });

      if (res.error) {
        toast.error(res.error.message ?? "Failed to verify code");
      } else {
        router.push("/");
      }
    },
    validators: {
      onSubmit: z.object({
        code: z.string().length(6, "Code must be 6 digits"),
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
      <form.Field name="code">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="totp-code">Code</Label>
            <Input
              id="totp-code"
              name="totp-code"
              placeholder="123456"
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
            className="w-full"
            disabled={!state.canSubmit || state.isSubmitting}
          >
            {state.isSubmitting ? "Verifying..." : "Verify"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
