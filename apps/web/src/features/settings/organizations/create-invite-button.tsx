"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";

const INVITE_ROLES = ["admin", "member", "viewer"] as const;
type InviteRole = (typeof INVITE_ROLES)[number];

const ROLE_DESCRIPTIONS: Record<InviteRole, string> = {
  admin: "Full access to tickets, reports, and org settings",
  member: "Can create, update, and close tickets",
  viewer: "Read-only access to tickets and reports",
};

const createInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(INVITE_ROLES),
});

type CreateInviteButtonProps = {
  organizationId: string;
  onInvited: () => void;
};

export function CreateInviteButton({ organizationId, onInvited }: CreateInviteButtonProps) {
  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      role: "member" as InviteRole,
    },
    onSubmit: async ({ value }) => {
      const res = await authClient.organization.inviteMember({
        ...value,
        organizationId,
      });

      if (res.error) {
        toast.error(res.error.message ?? "Failed to invite user");
      } else {
        toast.success("Invitation sent");
        form.reset();
        setOpen(false);
        onInvited();
      }
    },
    validators: {
      onSubmit: createInviteSchema,
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button>Invite User</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>Invite a user to collaborate with your team.</DialogDescription>
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
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  name="invite-email"
                  type="email"
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

          <form.Field name="role">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as InviteRole)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITE_ROLES.map((role) => (
                      <SelectItem
                        key={role}
                        value={role}
                      >
                        <div className="flex flex-col">
                          <span className="capitalize">{role}</span>
                          <span className="text-muted-foreground text-xs">
                            {ROLE_DESCRIPTIONS[role]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  onClick={() => setOpen(false)}
                  disabled={state.isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!state.canSubmit || state.isSubmitting}
                >
                  {state.isSubmitting ? "Inviting..." : "Invite"}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
