"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranchPlus, Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc";

type MergedTicketBannerProps = {
  ticketId: string;
};

export function MergedTicketBanner({ ticketId }: MergedTicketBannerProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: ticket } = useQuery(trpc.ticket.getById.queryOptions(ticketId));

  const { mutate: unmerge, isPending } = useMutation(
    trpc.ticket.unmerge.mutationOptions({
      onSuccess: () => {
        toast.success("Ticket unmerged successfully");
        queryClient.removeQueries({ queryKey: trpc.ticket.all.queryKey() });
        queryClient.removeQueries({ queryKey: trpc.ticket.totalCount.queryKey() });
        queryClient.removeQueries({ queryKey: trpc.ticket.getMergedTickets.queryKey() });
        queryClient.removeQueries({ queryKey: trpc.contact.conversationThread.queryKey() });
        void queryClient.invalidateQueries({ queryKey: trpc.ticket.getById.queryKey(ticketId) });
        void queryClient.invalidateQueries({
          queryKey: trpc.ticket.getTicketEvents.queryKey(ticketId),
        });
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to unmerge ticket");
      },
    })
  );

  if (ticket?.status !== "merged" || !ticket.mergedIntoId) {
    return null;
  }

  return (
    <div className="mx-6 flex items-center gap-2 rounded-lg border border-blue-300/50 bg-blue-50 px-4 py-3 dark:border-blue-500/30 dark:bg-blue-950/30">
      <GitBranchPlus className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
      <p className="flex-1 text-sm text-blue-800 dark:text-blue-200">
        This ticket was merged into{" "}
        <Link
          href={`/tickets/${ticket.mergedIntoId}`}
          className="font-medium underline underline-offset-2 hover:text-blue-900 dark:hover:text-blue-100"
        >
          another ticket
        </Link>
        .
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => unmerge(ticketId)}
        disabled={isPending}
        className="shrink-0"
      >
        {isPending ?
          <Loader2 className="size-3.5 animate-spin" />
        : <Undo2 className="size-3.5" />}
        Unmerge
      </Button>
    </div>
  );
}
