import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@help-desk/auth";

import { OrgSelector } from "@/features/onboarding/org-selector";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return redirect("/auth/sign-in");

  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  });

  return (
    <OrgSelector
      organizations={organizations ?? []}
      activeOrganizationId={session.session.activeOrganizationId ?? null}
    />
  );
}
