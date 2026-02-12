"use client";

import type { Row } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";

import type { TicketCardData } from "../tickets/ticket-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTRPC } from "@/trpc";

type TicketTableListActionsProps = {
  row: Row<TicketCardData>;
};

export function TicketTableListActions({ row }: TicketTableListActionsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

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
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
