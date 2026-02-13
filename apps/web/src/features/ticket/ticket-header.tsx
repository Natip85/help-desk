"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Forward, GitBranchPlus, Reply, Trash2 } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
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
import { AddNoteDialog } from "./add-note-dialog";
import { CloseTicketButton } from "./close-ticket-button";
import { ToggleContactSidebarButton } from "./toggle-contact-sidebar-button";
import { ToggleTicketStatusesSidebarButton } from "./toggle-ticket-statuses-sidebar-button";

export const TicketHeader = ({ ticketId }: { ticketId: string }) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: ticket } = useQuery(trpc.ticket.getById.queryOptions(ticketId));
  const [, setActiveEditor] = useQueryState(
    "editor",
    parseAsStringLiteral(["reply", "forward"] as const)
  );

  const { mutate: softDelete, isPending: isDeleting } = useMutation(
    trpc.ticket.softDelete.mutationOptions({
      onSuccess: () => {
        // Remove cached queries that aren't mounted on this page
        // so stale data doesn't render when navigating to /tickets or /tickets/trash
        queryClient.removeQueries({ queryKey: trpc.ticket.all.queryKey() });
        queryClient.removeQueries({ queryKey: trpc.ticket.totalCount.queryKey() });
        queryClient.removeQueries({ queryKey: trpc.ticket.listDeleted.queryKey() });
        toast.success("Ticket moved to trash");
        router.push("/tickets");
        router.refresh();
      },
      onError: () => {
        toast.error("Failed to delete ticket");
      },
    })
  );

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => void setActiveEditor("reply")}
        >
          <Reply />
          Reply
        </Button>
        <AddNoteDialog ticketId={ticketId} />
        <Button
          variant="outline"
          onClick={() => void setActiveEditor("forward")}
        >
          <Forward />
          Forward
        </Button>
        {ticket?.status !== "closed" && <CloseTicketButton ticketId={ticketId} />}
        <Button
          variant="outline"
          disabled
        >
          <GitBranchPlus />
          Merge
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={isDeleting}
            >
              <Trash2 />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Move to trash?</AlertDialogTitle>
              <AlertDialogDescription>
                This ticket will be moved to the trash. It will be permanently deleted after 30
                days. You can restore it anytime before that.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => softDelete(ticketId)}
              >
                Move to trash
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="flex items-center gap-2">
        <ToggleContactSidebarButton contactId={ticket?.contact?.id} />
        <ToggleTicketStatusesSidebarButton ticketId={ticketId} />
      </div>
    </div>
  );
};
