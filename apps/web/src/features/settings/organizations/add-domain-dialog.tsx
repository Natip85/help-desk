"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useTRPC } from "@/trpc";

const domainSchema = z.object({
  domain: z
    .string()
    .min(1, "Domain is required")
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
      "Invalid domain format (e.g. example.com)"
    ),
});

type AddDomainDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDomainCreated?: (domainName: string, dnsRecords: unknown[]) => void;
};

export function AddDomainDialog({ open, onOpenChange, onDomainCreated }: AddDomainDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutateAsync: createDomain } = useMutation(
    trpc.domain.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.domain.list.queryKey() });
      },
    })
  );

  const form = useForm({
    defaultValues: {
      domain: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await createDomain({ domain: value.domain });
        toast.success("Domain registered! Configure the DNS records shown below.");
        form.reset();
        onOpenChange(false);

        if (result?.dnsRecords && onDomainCreated) {
          onDomainCreated(result.domain, result.dnsRecords);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to register domain");
      }
    },
    validators: {
      onSubmit: domainSchema,
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Domain</DialogTitle>
          <DialogDescription>
            Register a new domain to send and receive emails. You will need to add DNS records to
            verify ownership.
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
          <form.Field name="domain">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="domain-name">Domain</Label>
                <Input
                  id="domain-name"
                  name="domain-name"
                  placeholder="example.com"
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
                  {state.isSubmitting ? "Registering..." : "Add Domain"}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
