"use client";

import type { Row } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";

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

  const { mutateAsync: softDelete } = useMutation(
    trpc.ticket.softDelete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.ticket.all.queryKey() });
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
