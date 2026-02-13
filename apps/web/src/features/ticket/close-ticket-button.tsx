"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc";

export const CloseTicketButton = ({ ticketId }: { ticketId: string }) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: closeTicket, isPending } = useMutation(
    trpc.ticket.updateStatus.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.ticket.getById.queryKey(ticketId),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.ticket.all.queryKey(),
        });
        toast.success("Ticket closed successfully");
        router.push(`/tickets`);
      },
    })
  );

  return (
    <Button
      variant="outline"
      onClick={() => closeTicket({ id: ticketId, status: "closed" })}
      disabled={isPending}
    >
      <X />
      Close
    </Button>
  );
};
