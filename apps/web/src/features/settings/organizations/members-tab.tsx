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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";

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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell>{member.user.name}</TableCell>
            <TableCell>{member.user.email}</TableCell>
            <TableCell>
              <Badge
                variant={
                  member.role === "owner" ? "default"
                  : member.role === "admin" ?
                    "secondary"
                  : "outline"
                }
              >
                {member.role}
              </Badge>
            </TableCell>
            <TableCell>
              {member.userId !== session?.user.id && (
                <RemoveMemberButton
                  memberId={member.id}
                  memberName={member.user.name}
                  organizationId={organizationId}
                  onRemoved={onUpdate}
                />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
