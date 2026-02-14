"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useTRPC } from "@/trpc";

export function DeleteCannedResponseButton({ cannedId }: { cannedId: string }) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutateAsync: deleteCannedResponse, isPending } = useMutation(
    trpc.cannedResponse.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.cannedResponse.list.queryKey(),
        });
      },
    })
  );

  async function handleDelete() {
    try {
      await deleteCannedResponse({ id: cannedId });
      toast.success("Canned response deleted");
      router.push("/settings/canned-responses");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete canned response");
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Canned Response</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this canned response? This action cannot be undone.
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
