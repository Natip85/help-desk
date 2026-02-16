"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { BuildingIcon, MailIcon, PhoneIcon } from "lucide-react";

import type { ContactCardData } from "../../contact/contact-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate, getContactDisplayName, getContactInitials } from "../../tickets/ticket-card";
import { ContactTableListActions } from "./contact-table-list-actions";

export const columns: ColumnDef<ContactCardData>[] = [
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
    id: "name",
    accessorKey: "displayName",
    header: () => <div>Name</div>,
    cell: ({ row }) => {
      const contact = row.original;
      const displayName = getContactDisplayName(contact);
      const initials = getContactInitials(contact);

      return (
        <div className="flex items-center gap-3 p-1">
          <Avatar className="size-8">
            {contact.avatarUrl && (
              <AvatarImage
                src={contact.avatarUrl}
                alt={displayName ?? contact.email}
              />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5 text-sm leading-tight">
            <span className="font-medium">{displayName ?? "\u00A0"}</span>
          </div>
        </div>
      );
    },
  },
  {
    id: "email",
    accessorKey: "email",
    header: () => <div>Email</div>,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm">
        <MailIcon className="text-muted-foreground size-3.5" />
        <span className="max-w-[250px] truncate">{row.original.email}</span>
      </div>
    ),
  },
  {
    id: "phone",
    accessorKey: "phone",
    header: () => <div>Phone</div>,
    cell: ({ row }) => {
      const phone = row.original.phone;
      if (!phone) return <span className="text-muted-foreground text-sm">-</span>;
      return (
        <div className="flex items-center gap-1.5 text-sm">
          <PhoneIcon className="text-muted-foreground size-3.5" />
          <span>{phone}</span>
        </div>
      );
    },
  },
  {
    id: "company",
    accessorKey: "company",
    header: () => <div>Company</div>,
    cell: ({ row }) => {
      const company = row.original.company;
      if (!company) return <span className="text-muted-foreground text-sm">-</span>;
      return (
        <Badge
          variant="outline"
          className="px-2 py-0.5 text-xs font-normal"
        >
          <BuildingIcon className="mr-1 size-3" />
          {company.name}
        </Badge>
      );
    },
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: () => <div>Created At</div>,
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate text-sm">{formatDate(row.original.createdAt)}</div>
    ),
  },
  {
    id: "updatedAt",
    accessorKey: "updatedAt",
    header: () => <div>Updated At</div>,
    cell: ({ row }) => {
      const updatedAt = row.original.updatedAt;
      if (!updatedAt) return <span className="text-muted-foreground text-sm">-</span>;
      return <div className="max-w-[300px] truncate text-sm">{formatDate(updatedAt)}</div>;
    },
  },
  {
    id: "id",
    accessorKey: "id",
    header: () => <div>ID</div>,
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate font-mono text-xs">{row.original.id}</div>
    ),
  },
  {
    id: "actions",
    accessorKey: "actions",
    header: () => <div></div>,
    cell: ({ row }) => <ContactTableListActions row={row} />,
    size: 40,
    maxSize: 40,
  },
];
