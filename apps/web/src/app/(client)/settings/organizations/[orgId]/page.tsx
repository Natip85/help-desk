import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@help-desk/auth";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageTitle } from "@/components/page-title";
import { DeleteOrganizationButton } from "@/features/settings/organizations/delete-organization-button";
import { OrganizationTabs } from "@/features/settings/organizations/organization-tabs";
import { createOrganizationDetailBreadcrumbs } from "@/lib/breadcrumbs";

type OrganizationIdPageProps = {
  params: Promise<{ orgId: string }>;
};

export default async function OrganizationIdPage({ params }: OrganizationIdPageProps) {
  const { orgId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return redirect("/auth/sign-in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
    query: { organizationId: orgId },
  });

  if (!organization) return notFound();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
      <Breadcrumbs
        pages={createOrganizationDetailBreadcrumbs(orgId, organization.name)}
        className="px-2"
      />
      <PageTitle
        title={organization.name}
        subTitle="Manage your organization  members and mailboxes"
        className="w-full"
      >
        <DeleteOrganizationButton organization={organization} />
      </PageTitle>
      <OrganizationTabs
        organization={organization}
        organizationId={orgId}
      />
    </div>
  );
}
