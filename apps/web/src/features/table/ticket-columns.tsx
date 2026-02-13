"use client";

import type { ColumnDef } from "@tanstack/react-table";

import type { TicketCardData } from "../tickets/ticket-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  formatDate,
  getContactDisplayName,
  getContactInitials,
  statusConfig,
} from "../tickets/ticket-card";
import { TicketTableListActions } from "./ticket-table-list-actions";

export const columns: ColumnDef<TicketCardData>[] = [
  {
    id: "select",
    size: 40,
    maxSize: 40,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllRowsSelected() ? true
          : table.getIsSomeRowsSelected() ?
            "indeterminate"
          : false
        }
        onCheckedChange={(checked) => {
          table.getToggleAllRowsSelectedHandler()({
            target: { checked: checked === true },
          } as React.ChangeEvent<HTMLInputElement>);
        }}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={
          row.getIsSelected() ? true
          : row.getIsSomeSelected() ?
            "indeterminate"
          : false
        }
        disabled={!row.getCanSelect()}
        onCheckedChange={(checked) => {
          row.getToggleSelectedHandler()({
            target: { checked: checked === true },
          } as React.ChangeEvent<HTMLInputElement>);
        }}
      />
    ),
  },
  {
    id: "id",
    accessorKey: "id",
    header: () => <div>ID</div>,
    cell: ({ row }) => <div>{row.original.id}</div>,
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: () => <div>Created At</div>,
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate">{formatDate(row.original.createdAt)}</div>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: () => <div>Status</div>,
    cell: ({ row }) => {
      const status = row.original.status ? statusConfig[row.original.status] : null;
      return status && <Badge className={cn("", status.className)}>{row.original.status}</Badge>;
    },
  },
  {
    id: "priority",
    accessorKey: "priority",
    header: () => <div>Priority</div>,
    cell: ({ row }) => {
      return <Badge>{row.original.priority}</Badge>;
    },
  },
  {
    id: "subject",
    accessorKey: "subject",
    header: () => <div>Subject</div>,
    cell: ({ row }) => <div>{row.original.subject}</div>,
  },
  {
    id: "tags",
    accessorKey: "tags",
    header: () => <div>Tags</div>,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.tags.map((tag) => (
          <Badge
            key={tag.id}
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    id: "contact",
    accessorKey: "contact",
    header: () => <div>Contact</div>,
    cell: ({ row }) => {
      const contact = row.original.contact;
      if (!contact) return null;

      const displayName = getContactDisplayName(contact);
      const initials = getContactInitials(contact);

      return (
        <div className="flex items-center gap-4 p-1">
          <Avatar className="size-8">
            {contact.avatarUrl && (
              <AvatarImage
                src={contact.avatarUrl}
                alt={displayName ?? contact.email}
              />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1 text-sm leading-tight">
            <span className="font-medium">{displayName ?? "\u00A0"}</span>
            <span className="mb-2 text-xs">{contact.email}</span>
          </div>
        </div>
      );
    },
  },

  {
    id: "actions",
    accessorKey: "actions",
    header: () => <div></div>,
    cell: ({ row }) => <TicketTableListActions row={row} />,
    size: 40,
    maxSize: 40,
  },
];
