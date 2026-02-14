import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, ChevronLeft } from "lucide-react";

import { auth } from "@help-desk/auth";

import { PageTitle } from "@/components/page-title";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateOrganizationButton } from "@/features/settings/organizations/create-organization-button";
import { OrganizationRow } from "@/features/settings/organizations/organization-row";

export default async function OrganizationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session == null) return redirect("/auth/sign-in");

  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  const memberCountsPromises = organizations.map(async (org) => {
    const members = await auth.api.listMembers({
      query: { organizationId: org.id },
      headers: await headers(),
    });
    return { orgId: org.id, count: members.total };
  });
  const memberCountsArray = await Promise.all(memberCountsPromises);
  const memberCountMap = new Map(memberCountsArray.map((m) => [m.orgId, m.count]));

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
        <div className="flex gap-2">
          <Link
            href="/settings"
            className="pt-1"
          >
            <ChevronLeft />
          </Link>
          <PageTitle
            title="Organizations"
            subTitle="Manage your organizations and their members"
            className="w-full"
          >
            <CreateOrganizationButton />
          </PageTitle>
        </div>
        {organizations && organizations.length > 0 ?
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <OrganizationRow
                  key={org.id}
                  organization={org}
                  activeOrgId={session.session.activeOrganizationId}
                  memberCount={memberCountMap.get(org.id)}
                />
              ))}
            </TableBody>
          </Table>
        : <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
              <Building2 className="text-muted-foreground size-6" />
            </div>
            <h3 className="mb-1 text-lg font-medium">No organizations yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm text-sm">
              Create your first organization to start collaborating with your team.
            </p>
            <CreateOrganizationButton />
          </div>
        }
      </div>
    </>
  );
}
