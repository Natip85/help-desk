"use client";

import type { RefObject } from "react";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Forward, GitBranchPlus, MoreVertical, Reply, Trash2 } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { toast } from "sonner";
import { useResizeObserver } from "usehooks-ts";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTRPC } from "@/trpc";
import { AddNoteDialog } from "./add-note-dialog";
import { CloseTicketButton } from "./close-ticket-button";
import { ToggleContactSidebarButton } from "./toggle-contact-sidebar-button";
import { ToggleTicketStatusesSidebarButton } from "./toggle-ticket-statuses-sidebar-button";

const LG = 700;
const MD = 560;
const SM = 440;

const DeleteTicketButton = ({
  ticketId,
  isDeleting,
  onDelete,
}: {
  ticketId: string;
  isDeleting: boolean;
  onDelete: (id: string) => void;
}) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button
        variant="ghost"
        className="text-destructive hover:text-destructive"
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
          This ticket will be moved to the trash. It will be permanently deleted after 30 days. You
          can restore it anytime before that.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          variant="destructive"
          onClick={() => onDelete(ticketId)}
        >
          Move to trash
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export const TicketHeader = ({ ticketId }: { ticketId: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { width = Infinity } = useResizeObserver({
    ref: ref as RefObject<HTMLElement>,
    box: "border-box",
  });

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

  const showSecondary = width >= LG;
  const showForward = width >= MD;
  const showAddNote = width >= SM;
  const showMore = !showSecondary || !showForward || !showAddNote;

  return (
    <div
      className="flex items-center justify-between gap-3"
      ref={ref}
    >
      <div className="flex items-center gap-1.5">
        <Button onClick={() => void setActiveEditor("reply")}>
          <Reply />
          Reply
        </Button>

        {showAddNote && <AddNoteDialog ticketId={ticketId} />}

        {showForward && (
          <Button
            variant="outline"
            onClick={() => void setActiveEditor("forward")}
          >
            <Forward />
            Forward
          </Button>
        )}

        {showSecondary && (
          <>
            <Separator
              orientation="vertical"
              className="mx-0.5 h-8!"
            />
            {ticket?.status !== "closed" && <CloseTicketButton ticketId={ticketId} />}
            <Button
              variant="ghost"
              disabled
            >
              <GitBranchPlus />
              Merge
            </Button>
            <DeleteTicketButton
              ticketId={ticketId}
              isDeleting={isDeleting}
              onDelete={softDelete}
            />
          </>
        )}

        {showMore && (
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="transition-all duration-300 ease-in-out"
                  >
                    <MoreVertical />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>More actions</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent
              align="start"
              className="flex w-fit max-w-[75vw] flex-wrap items-center gap-1.5"
            >
              {!showAddNote && <AddNoteDialog ticketId={ticketId} />}
              {!showForward && (
                <Button
                  variant="outline"
                  onClick={() => void setActiveEditor("forward")}
                >
                  <Forward />
                  Forward
                </Button>
              )}
              {!showSecondary && (
                <>
                  {ticket?.status !== "closed" && <CloseTicketButton ticketId={ticketId} />}
                  <Button
                    variant="ghost"
                    disabled
                  >
                    <GitBranchPlus />
                    Merge
                  </Button>
                  <DeleteTicketButton
                    ticketId={ticketId}
                    isDeleting={isDeleting}
                    onDelete={softDelete}
                  />
                </>
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <ToggleContactSidebarButton contactId={ticket?.contact?.id} />
        <ToggleTicketStatusesSidebarButton ticketId={ticketId} />
      </div>
    </div>
  );
};
