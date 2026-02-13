"use client";

import { useState } from "react";
import { toast } from "sonner";

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
import { CreateInviteButton } from "./create-invite-button";

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
};

type InvitesTabProps = {
  invitations: Invitation[];
  organizationId: string;
  onUpdate: () => void;
};

export function InvitesTab({ invitations, organizationId, onUpdate }: InvitesTabProps) {
  const pendingInvites = invitations.filter((invite) => invite.status === "pending");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateInviteButton
          organizationId={organizationId}
          onInvited={onUpdate}
        />
      </div>

      <Table>
        <TableHeader>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead>Actions</TableHead>
        </TableHeader>
        <TableBody>
          {pendingInvites.map((invitation) => (
            <TableRow key={invitation.id}>
              <TableCell>{invitation.email}</TableCell>
              <TableCell>
                <Badge variant="outline">{invitation.role}</Badge>
              </TableCell>
              <TableCell>{new Date(invitation.expiresAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <CancelInvitationButton
                  invitationId={invitation.id}
                  onCancelled={onUpdate}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CancelInvitationButton({
  invitationId,
  onCancelled,
}: {
  invitationId: string;
  onCancelled: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleCancel() {
    setIsLoading(true);
    try {
      const res = await authClient.organization.cancelInvitation({ invitationId });

      if (res.error) {
        toast.error(res.error.message ?? "Failed to cancel invitation");
      } else {
        toast.success("Invitation cancelled");
        onCancelled();
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleCancel}
      disabled={isLoading}
    >
      {isLoading ? "Cancelling..." : "Cancel"}
    </Button>
  );
}
