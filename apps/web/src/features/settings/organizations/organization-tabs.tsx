"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvitesTab } from "./invites-tab";
import { MailboxesTab } from "./mailboxes-tab";
import { MembersTab } from "./members-tab";

type Member = {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
};

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  members: Member[];
  invitations: Invitation[];
};

type OrganizationTabsProps = {
  organization: Organization;
  organizationId: string;
};

export function OrganizationTabs({ organization, organizationId }: OrganizationTabsProps) {
  const router = useRouter();

  const handleUpdate = useCallback(() => {
    router.refresh();
  }, [router]);

  const pendingInvitations = organization.invitations?.filter((i) => i.status === "pending") ?? [];

  return (
    <Tabs
      defaultValue="members"
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="members">Members ({organization.members?.length ?? 0})</TabsTrigger>
        <TabsTrigger value="invitations">Invitations ({pendingInvitations.length})</TabsTrigger>
        <TabsTrigger value="mailboxes">Mailboxes</TabsTrigger>
      </TabsList>
      <TabsContent value="members">
        <MembersTab
          members={organization.members ?? []}
          organizationId={organizationId}
          onUpdate={handleUpdate}
        />
      </TabsContent>

      <TabsContent value="invitations">
        <InvitesTab
          invitations={organization.invitations ?? []}
          organizationId={organizationId}
          onUpdate={handleUpdate}
        />
      </TabsContent>

      <TabsContent value="mailboxes">
        <MailboxesTab />
      </TabsContent>
    </Tabs>
  );
}
