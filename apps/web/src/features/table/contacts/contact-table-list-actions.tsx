"use client";

import type { Row } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";

import type { ContactCardData } from "../../contact/contact-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTRPC } from "@/trpc";

type ContactTableListActionsProps = {
  row: Row<ContactCardData>;
};

export function ContactTableListActions({ row }: ContactTableListActionsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const invalidateContacts = () => {
    void queryClient.invalidateQueries({ queryKey: trpc.contact.all.queryKey() });
  };

  const { mutateAsync: restoreContact } = useMutation(
    trpc.contact.restore.mutationOptions({
      onSuccess: () => {
        invalidateContacts();
        toast.success("Contact restored");
      },
    })
  );

  const { mutateAsync: softDelete } = useMutation(
    trpc.contact.delete.mutationOptions({
      onSuccess: () => {
        invalidateContacts();
        toast("Contact deleted", {
          action: {
            label: "Undo",
            onClick: () => void restoreContact(row.original.id),
          },
        });
      },
    })
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="data-[state=open]:bg-primary mx-auto"
        >
          <MoreVertical className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[160px]"
      >
        <DropdownMenuItem
          onClick={async () => {
            await softDelete(row.original.id);
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
