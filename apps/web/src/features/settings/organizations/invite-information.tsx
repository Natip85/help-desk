"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function InviteInformation({
  invitation,
}: {
  invitation: { id: string; organizationId: string };
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  async function handleAccept() {
    setIsAccepting(true);
    try {
      const res = await authClient.organization.acceptInvitation({
        invitationId: invitation.id,
      });

      if (res.error) {
        toast.error(res.error.message ?? "Failed to accept invitation");
      } else {
        await authClient.organization.setActive({
          organizationId: invitation.organizationId,
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [["organization"]] }),
          queryClient.invalidateQueries({ queryKey: [["project"]] }),
          queryClient.invalidateQueries({ queryKey: [["onboarding"]] }),
        ]);
        toast.success("Invitation accepted");
        router.push("/tickets");
      }
    } finally {
      setIsAccepting(false);
    }
  }

  async function handleReject() {
    setIsRejecting(true);
    try {
      const res = await authClient.organization.rejectInvitation({
        invitationId: invitation.id,
      });

      if (res.error) {
        toast.error(res.error.message ?? "Failed to reject invitation");
      } else {
        toast.success("Invitation rejected");
        router.push("/");
      }
    } finally {
      setIsRejecting(false);
    }
  }

  const isLoading = isAccepting || isRejecting;

  return (
    <div className="flex gap-4">
      <Button
        className="grow"
        onClick={handleAccept}
        disabled={isLoading}
      >
        {isAccepting ? "Accepting..." : "Accept"}
      </Button>
      <Button
        className="grow"
        variant="destructive"
        onClick={handleReject}
        disabled={isLoading}
      >
        {isRejecting ? "Rejecting..." : "Reject"}
      </Button>
    </div>
  );
}
