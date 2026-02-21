"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { TicketCardData } from "../../tickets/ticket-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useTRPC } from "@/trpc";
import { SlaBadge } from "../../tickets/sla-badge";
import { TicketAssigneeCombobox } from "../../tickets/ticket-assignee-combobox";
import {
  channelIconMap,
  formatDate,
  getContactDisplayName,
  getContactInitials,
} from "../../tickets/ticket-card";
import { TicketPrioritySelect } from "../../tickets/ticket-priority-select";
import { TicketStatusSelect } from "../../tickets/ticket-status-select";
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
  // Interactive: link to ticket page
  {
    id: "subject",
    accessorKey: "subject",
    header: () => <div>Subject</div>,
    cell: ({ row }) => (
      <div>
        <Link
          href={`/tickets/${row.original.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-medium hover:underline"
        >
          {row.original.subject}
        </Link>
      </div>
    ),
  },
  // Passive: opens contact sidebar
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
  // Interactive: status dropdown
  {
    id: "status",
    accessorKey: "status",
    header: () => <div>Status</div>,
    cell: ({ row }) => (
      <TicketStatusSelect
        ticketId={row.original.id}
        value={row.original.status}
      />
    ),
  },
  // Passive: opens contact sidebar
  {
    id: "channel",
    accessorKey: "channel",
    header: () => <div>Channel</div>,
    cell: ({ row }) => {
      const channel = row.original.channel;
      const ChannelIcon = channelIconMap[channel];
      return (
        <div className="flex items-center gap-2">
          <ChannelIcon className="size-3.5" />
          <span className="capitalize">{channel}</span>
        </div>
      );
    },
  },
  // Interactive: assignee dropdown
  {
    id: "assignee",
    accessorKey: "assignedTo",
    header: () => <div>Assignee</div>,
    cell: ({ row }) => (
      <AssigneeCell
        ticketId={row.original.id}
        assignee={row.original.assignedTo}
      />
    ),
  },
  // Passive: opens contact sidebar
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: () => <div>Created At</div>,
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate">{formatDate(row.original.createdAt)}</div>
    ),
  },
  // Interactive: priority dropdown
  {
    id: "priority",
    accessorKey: "priority",
    header: () => <div>Priority</div>,
    cell: ({ row }) => (
      <TicketPrioritySelect
        ticketId={row.original.id}
        value={row.original.priority}
      />
    ),
  },
  {
    id: "sla",
    header: () => <div>SLA</div>,
    cell: ({ row }) => (
      <SlaBadge
        firstResponseAt={row.original.firstResponseAt}
        slaFirstResponseDueAt={row.original.slaFirstResponseDueAt}
        slaBreachedAt={row.original.slaBreachedAt}
        size="sm"
      />
    ),
    size: 120,
    maxSize: 120,
  },
  // Passive: opens contact sidebar
  {
    id: "tags",
    accessorKey: "tags",
    header: () => <div>Tags</div>,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.tags.map((tag) => (
          <Badge
            key={tag.id}
            variant="outline"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    id: "id",
    accessorKey: "id",
    header: () => <div>ID</div>,
    cell: ({ row }) => <div>{row.original.id}</div>,
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

function AssigneeCell({
  ticketId,
  assignee,
}: {
  ticketId: string;
  assignee: TicketCardData["assignedTo"];
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate: updateAssignee } = useMutation(
    trpc.ticket.updateAssignee.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.ticket.getById.queryKey(ticketId) });
        void queryClient.invalidateQueries({ queryKey: trpc.ticket.all.queryKey() });
        toast.success("Assignee updated successfully");
      },
    })
  );

  return (
    <TicketAssigneeCombobox
      currentAssignee={assignee}
      onValueChange={(assigneeId) => updateAssignee({ id: ticketId, assignedToId: assigneeId })}
    />
  );
}
