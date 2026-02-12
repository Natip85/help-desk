"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";

type TwoFactorData = {
  totpURI: string;
  backupCodes: string[];
};

export function TwoFactorAuth({ isEnabled }: { isEnabled: boolean }) {
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(null);
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      password: "",
    },
    onSubmit: async ({ value }) => {
      if (isEnabled) {
        const res = await authClient.twoFactor.disable({
          password: value.password,
        });

        if (res.error) {
          toast.error(res.error.message ?? "Failed to disable 2FA");
        } else {
          toast.success("Two-factor authentication disabled");
          form.reset();
          router.refresh();
        }
      } else {
        const res = await authClient.twoFactor.enable({
          password: value.password,
        });

        if (res.error) {
          toast.error(res.error.message ?? "Failed to enable 2FA");
        } else {
          setTwoFactorData(res.data);
          form.reset();
        }
      }
    },
    validators: {
      onSubmit: z.object({
        password: z.string().min(1, "Password is required"),
      }),
    },
  });

  if (twoFactorData != null) {
    return (
      <QRCodeVerify
        {...twoFactorData}
        onDone={() => {
          setTwoFactorData(null);
        }}
      />
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field name="password">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="2fa-password">Password</Label>
            <PasswordInput
              id="2fa-password"
              name="2fa-password"
              placeholder="Enter your password to confirm"
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
            variant={isEnabled ? "destructive" : "default"}
            disabled={!state.canSubmit || state.isSubmitting}
          >
            {state.isSubmitting ?
              isEnabled ?
                "Disabling..."
              : "Enabling..."
            : isEnabled ?
              "Disable 2FA"
            : "Enable 2FA"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}

function QRCodeVerify({ totpURI, backupCodes, onDone }: TwoFactorData & { onDone: () => void }) {
  const [successfullyEnabled, setSuccessfullyEnabled] = useState(false);
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      token: "",
    },
    onSubmit: async ({ value }) => {
      const res = await authClient.twoFactor.verifyTotp({
        code: value.token,
      });

      if (res.error) {
        toast.error(res.error.message ?? "Failed to verify code");
      } else {
        toast.success("Two-factor authentication enabled");
        setSuccessfullyEnabled(true);
        router.refresh();
      }
    },
    validators: {
      onSubmit: z.object({
        token: z.string().length(6, "Code must be 6 digits"),
      }),
    },
  });

  if (successfullyEnabled) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Save these backup codes in a safe place. You can use them to access your account.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {backupCodes.map((code, index) => (
            <div
              key={index}
              className="font-mono text-sm"
            >
              {code}
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={onDone}
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="w-fit bg-white p-4">
        <QRCode
          size={256}
          value={totpURI}
        />
      </div>

      <p className="text-muted-foreground text-sm">
        Scan this QR code with your authenticator app and enter the code below:
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="token">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="2fa-token">Code</Label>
              <Input
                id="2fa-token"
                name="2fa-token"
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
              {state.isSubmitting ? "Verifying..." : "Verify Code"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
