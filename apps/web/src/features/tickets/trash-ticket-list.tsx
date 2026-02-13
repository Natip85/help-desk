"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Trash2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTRPC } from "@/trpc";

function getDaysRemaining(deletedAt: Date) {
  const deletedDate = new Date(deletedAt);
  const expiryDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

function formatDeletedDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getContactName(contact: {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string;
}) {
  if (contact.displayName) return contact.displayName;
  if (contact.firstName || contact.lastName) {
    return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  }
  return contact.email;
}

export function TrashTicketList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    trpc.ticket.listDeleted.queryOptions({ page: 1, limit: 20 })
  );

  const invalidate = async () => {
    // listDeleted is mounted on this page, so invalidate triggers a refetch
    await queryClient.invalidateQueries({ queryKey: trpc.ticket.listDeleted.queryKey() });
    // all & totalCount are NOT mounted here, so remove stale cache
    // so fresh data is fetched when the user navigates to /tickets
    queryClient.removeQueries({ queryKey: trpc.ticket.all.queryKey() });
    queryClient.removeQueries({ queryKey: trpc.ticket.totalCount.queryKey() });
  };

  const { mutate: restore, isPending: isRestoring } = useMutation(
    trpc.ticket.restore.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Ticket restored");
      },
      onError: () => {
        toast.error("Failed to restore ticket");
      },
    })
  );

  const { mutate: hardDelete, isPending: isHardDeleting } = useMutation(
    trpc.ticket.hardDelete.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Ticket permanently deleted");
      },
      onError: () => {
        toast.error("Failed to permanently delete ticket");
      },
    })
  );

  const isBusy = isRestoring || isHardDeleting;

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12 text-sm">
        Loading...
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-16">
        <Trash2 className="text-muted-foreground/50 size-10" />
        <p className="text-sm">No deleted tickets</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Deleted</TableHead>
            <TableHead>Days remaining</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((ticket) => (
            <TableRow
              key={ticket.id}
              className="hover:bg-transparent"
            >
              <TableCell className="font-medium">{ticket.subject ?? "(no subject)"}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {ticket.contact ? getContactName(ticket.contact) : "-"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {ticket.deletedAt ? formatDeletedDate(ticket.deletedAt) : "-"}
              </TableCell>
              <TableCell>
                {ticket.deletedAt ?
                  <span className="text-muted-foreground text-sm">
                    {getDaysRemaining(ticket.deletedAt)} days
                  </span>
                : "-"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restore(ticket.id)}
                    disabled={isBusy}
                  >
                    <RotateCcw className="mr-1 size-3.5" />
                    Restore
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isBusy}
                      >
                        <Trash2 className="mr-1 size-3.5" />
                        Delete forever
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Permanently delete?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This ticket and all its messages, attachments, and notes will be
                          permanently deleted. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => hardDelete(ticket.id)}
                        >
                          Delete permanently
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
