"use client";

import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";

const ASSIGNABLE_ROLES = ["admin", "member", "viewer"] as const;

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

type Member = {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

type MembersTabProps = {
  members: Member[];
  organizationId: string;
  onUpdate: () => void;
};

export function MembersTab({ members, organizationId, onUpdate }: MembersTabProps) {
  const { data: session } = authClient.useSession();

  const currentUserMember = members.find((m) => m.userId === session?.user.id);
  const canManageRoles = currentUserMember?.role === "owner" || currentUserMember?.role === "admin";

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const isCurrentUser = member.userId === session?.user.id;
          const isOwner = member.role === "owner";
          const showRoleSelect = canManageRoles && !isCurrentUser && !isOwner;

          return (
            <TableRow
              key={member.id}
              className="hover:bg-transparent"
            >
              <TableCell>{member.user.name}</TableCell>
              <TableCell>{member.user.email}</TableCell>
              <TableCell>
                {showRoleSelect ?
                  <RoleSelect
                    memberId={member.id}
                    currentRole={member.role}
                    organizationId={organizationId}
                    onChanged={onUpdate}
                  />
                : <Badge
                    variant={
                      member.role === "owner" ? "default"
                      : member.role === "admin" ?
                        "secondary"
                      : "outline"
                    }
                  >
                    {ROLE_LABELS[member.role] ?? member.role}
                  </Badge>
                }
              </TableCell>
              <TableCell>
                {!isCurrentUser && !isOwner && canManageRoles && (
                  <RemoveMemberButton
                    memberId={member.id}
                    memberName={member.user.name}
                    organizationId={organizationId}
                    onRemoved={onUpdate}
                  />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function RoleSelect({
  memberId,
  currentRole,
  organizationId,
  onChanged,
}: {
  memberId: string;
  currentRole: string;
  organizationId: string;
  onChanged: () => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleRoleChange(newRole: string) {
    if (newRole === currentRole) return;
    setIsUpdating(true);
    try {
      const res = await authClient.organization.updateMemberRole({
        memberId,
        role: newRole,
        organizationId,
      });

      if (res.error) {
        toast.error(res.error.message ?? "Failed to update role");
      } else {
        toast.success(`Role updated to ${ROLE_LABELS[newRole] ?? newRole}`);
        onChanged();
      }
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Select
      value={currentRole}
      onValueChange={handleRoleChange}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ASSIGNABLE_ROLES.map((role) => (
          <SelectItem
            key={role}
            value={role}
          >
            {ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RemoveMemberButton({
  memberId,
  memberName,
  organizationId,
  onRemoved,
}: {
  memberId: string;
  memberName: string;
  organizationId: string;
  onRemoved: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleRemove() {
    setIsLoading(true);
    try {
      const res = await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId,
      });

      if (res.error) {
        toast.error(res.error.message ?? "Failed to remove member");
      } else {
        toast.success("Member removed");
        onRemoved();
      }
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  }

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
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {memberName} from this organization?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={isLoading}
          >
            {isLoading ? "Removing..." : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
