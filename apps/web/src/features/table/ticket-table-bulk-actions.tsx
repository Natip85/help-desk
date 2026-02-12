"use client";

import type { Row, Table } from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, Trash, UserPlus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTRPC } from "@/trpc";

type BoardTableBulkActionsProps<TData extends { id: string }> = {
  selectedRows: Row<TData>[];
  table: Table<TData>;
  users: { id: string; name: string; image: string | null }[];
};

export const TicketTableBulkActions = <TData extends { id: string }>({
  selectedRows,
  table,
  users,
}: BoardTableBulkActionsProps<TData>) => {
  // const trpc = useTRPC();
  // const queryClient = useQueryClient();

  // const invalidateTasks = () => {
  //   void queryClient.invalidateQueries({ queryKey: [["task", "getByColumn"]] });
  // };

  // const { mutateAsync: deleteMany } = useMutation(
  //   trpc.task.deleteMany.mutationOptions({
  //     onSuccess: () => {
  //       table.resetRowSelection();
  //       invalidateTasks();
  //     },
  //   })
  // );

  // const { mutateAsync: bulkAssign } = useMutation(
  //   trpc.task.bulkAssign.mutationOptions({
  //     onSuccess: invalidateTasks,
  //   })
  // );

  const taskIds = selectedRows.map((row) => row.original.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="data-[state=open]:bg-muted text-foreground relative"
        >
          <MoreVertical className="size-5" />
          <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold">
            {selectedRows.length}
          </span>
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-48"
        align="end"
      >
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <UserPlus className="mr-2 size-4" />
              Assign to
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={async () => {
                    // await bulkAssign({ ids: taskIds, assigneeId: null });
                    table.resetRowSelection();
                  }}
                >
                  <Avatar className="mr-2 h-5 w-5">
                    <AvatarFallback className="bg-muted text-[10px]">?</AvatarFallback>
                  </Avatar>
                  Unassigned
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {users.map((user) => (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={async () => {
                      // await bulkAssign({ ids: taskIds, assigneeId: user.id });
                      table.resetRowSelection();
                    }}
                  >
                    <Avatar className="mr-2 h-5 w-5">
                      <AvatarImage src={user.image ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {user.name?.charAt(0) ?? ""}
                      </AvatarFallback>
                    </Avatar>
                    {user.name ?? "Unknown"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={async () => {
              // await deleteMany({ ids: taskIds });
              table.resetRowSelection();
            }}
            className="text-red-600"
          >
            <Trash className="mr-2 size-4" />
            Delete all
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              table.resetRowSelection();
            }}
          >
            Clear selected
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
