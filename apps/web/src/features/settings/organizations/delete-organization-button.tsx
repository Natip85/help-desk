"use client";

import type { Organization } from "better-auth/plugins/organization";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function DeleteOrganizationButton({ organization }: { organization: Organization }) {
  const router = useRouter();
  async function handleDelete() {
    const res = await authClient.organization.delete({ organizationId: organization.id });
    if (res.error) {
      toast.error(res.error.message ?? "Failed to delete organization");
    } else {
      toast.success("Organization deleted");
      router.refresh();
    }
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger
        asChild
        className="w-full"
      >
        <Button
          onSelect={(e) => e.preventDefault()}
          variant="destructive"
        >
          <Trash2 className="mr-2 size-4" />
          Delete Organization
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Organization</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{organization.name}</strong>? This action cannot
            be undone and will remove all members and data associated with this organization.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
