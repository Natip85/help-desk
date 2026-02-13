"use client";

import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
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
import { authClient } from "@/lib/auth-client";

const createOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type CreateOrganizationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrganizationDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm({
    defaultValues: {
      name: "",
    },
    onSubmit: async ({ value }) => {
      const slug = value.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");

      const res = await authClient.organization.create({
        name: value.name,
        slug,
      });

      if (res.error) {
        toast.error(res.error.message ?? "Failed to create organization");
      } else {
        toast.success("Organization created");
        form.reset();
        onOpenChange(false);
        await authClient.organization.setActive({ organizationId: res.data.id });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [["organization"]] }),
          queryClient.invalidateQueries({ queryKey: [["project"]] }),
          queryClient.invalidateQueries({ queryKey: [["onboarding"]] }),
        ]);
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      }
    },
    validators: {
      onSubmit: createOrganizationSchema,
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to collaborate with your team.
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
                <Label htmlFor="org-name">Name</Label>
                <Input
                  id="org-name"
                  name="org-name"
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
