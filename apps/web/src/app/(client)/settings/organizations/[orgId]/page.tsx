import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { auth } from "@help-desk/auth";

import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { DeleteOrganizationButton } from "@/features/settings/organizations/delete-organization-button";
import { OrganizationTabs } from "@/features/settings/organizations/organization-tabs";

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
    <div className="flex flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          asChild
        >
          <Link href="/settings/organizations">
            <ChevronLeft className="size-4" />
            <span className="sr-only">Back to organizations</span>
          </Link>
        </Button>
        <PageTitle
          title={organization.name}
          className="w-full"
        >
          <DeleteOrganizationButton organization={organization} />
        </PageTitle>
      </div>
      <OrganizationTabs
        organization={organization}
        organizationId={orgId}
      />
    </div>
  );
}
