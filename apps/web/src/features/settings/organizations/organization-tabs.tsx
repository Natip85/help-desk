"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteOrganizationButton } from "./delete-organization-button";
import { DomainsTab } from "./domains-tab";
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
  createdAt: Date;
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
      className="mx-auto w-full max-w-6xl"
    >
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="members">Members ({organization.members?.length ?? 0})</TabsTrigger>
        <TabsTrigger value="invitations">Invitations ({pendingInvitations.length})</TabsTrigger>
        <TabsTrigger value="domains">Domains</TabsTrigger>
        <TabsTrigger value="mailboxes">Mailboxes</TabsTrigger>
        <TabsTrigger value="danger">Danger</TabsTrigger>
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

      <TabsContent value="domains">
        <DomainsTab />
      </TabsContent>

      <TabsContent value="mailboxes">
        <MailboxesTab />
      </TabsContent>
      <TabsContent value="danger">
        <DeleteOrganizationButton organization={organization} />
      </TabsContent>
    </Tabs>
  );
}
