"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
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
import { CreateMailboxDialog } from "./create-mailbox-dialog";

export function MailboxesTab() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingMailbox, setEditingMailbox] = useState<{
    id: string;
    name: string;
    email: string;
    isDefault: boolean;
  } | null>(null);

  const { data } = useQuery(trpc.mailbox.list.queryOptions());

  const { mutate: setDefault } = useMutation(
    trpc.mailbox.setDefault.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.mailbox.list.queryKey() });
        toast.success("Default mailbox updated");
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to set default mailbox");
      },
    })
  );

  const { mutate: deleteMailbox, isPending: isDeleting } = useMutation(
    trpc.mailbox.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.mailbox.list.queryKey() });
        toast.success("Mailbox deleted");
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to delete mailbox");
      },
    })
  );

  const mailboxes = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateDialogOpen(true)}>Add Mailbox</Button>
      </div>

      {mailboxes.length === 0 ?
        <p className="text-muted-foreground py-8 text-center text-sm">
          No mailboxes configured yet. Add one to start receiving emails.
        </p>
      : <Table>
          <TableHeader>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Default</TableHead>
            <TableHead>Actions</TableHead>
          </TableHeader>
          <TableBody>
            {mailboxes.map((mb) => (
              <TableRow key={mb.id}>
                <TableCell className="font-medium">{mb.name}</TableCell>
                <TableCell>{mb.email}</TableCell>
                <TableCell>
                  {mb.isDefault ?
                    <Badge>Default</Badge>
                  : <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDefault({ id: mb.id })}
                    >
                      Set as default
                    </Button>
                  }
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditingMailbox({
                          id: mb.id,
                          name: mb.name,
                          email: mb.email,
                          isDefault: mb.isDefault,
                        })
                      }
                    >
                      Edit
                    </Button>
                    {!mb.isDefault && (
                      <DeleteMailboxButton
                        mailboxId={mb.id}
                        mailboxName={mb.name}
                        onDelete={deleteMailbox}
                        isDeleting={isDeleting}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }

      <CreateMailboxDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {editingMailbox && (
        <CreateMailboxDialog
          open={!!editingMailbox}
          onOpenChange={(open) => {
            if (!open) setEditingMailbox(null);
          }}
          editMailbox={editingMailbox}
        />
      )}
    </div>
  );
}

function DeleteMailboxButton({
  mailboxId,
  mailboxName,
  onDelete,
  isDeleting,
}: {
  mailboxId: string;
  mailboxName: string;
  onDelete: (input: { id: string }) => void;
  isDeleting: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
        >
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Mailbox</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the mailbox &quot;{mailboxName}&quot;? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onDelete({ id: mailboxId });
              setIsOpen(false);
            }}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
