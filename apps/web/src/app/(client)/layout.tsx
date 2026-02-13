import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@help-desk/auth";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ImpersonationIndicator } from "@/features/auth/impersination-indicator";
import { AppSidebar } from "@/features/nav/app-sidebar";
import { RightSidebarContainer } from "@/features/right-sidebars";
import { HydrateClient } from "@/trpc/server";

type ClientLayoutProps = {
  children: React.ReactNode;
};

export default async function ClientLayout({ children }: ClientLayoutProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session && !session.session.activeOrganizationId) {
    return redirect("/onboarding");
  }

  return (
    <HydrateClient>
      <SidebarProvider
        defaultRightOpen={false}
        className="min-h-0 flex-1"
      >
        <AppSidebar belowHeader />
        <SidebarInset className="h-auto">
          <ImpersonationIndicator />

          {children}
        </SidebarInset>
        <RightSidebarContainer />
      </SidebarProvider>
    </HydrateClient>
  );
}
