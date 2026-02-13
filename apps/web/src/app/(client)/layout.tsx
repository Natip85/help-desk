import type { SearchParams } from "nuqs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@help-desk/auth";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ImpersonationIndicator } from "@/features/auth/impersination-indicator";
import { AppSidebar } from "@/features/nav/app-sidebar";
import { RightSidebarContainer } from "@/features/right-sidebars";
import { loadTicketSearchParams } from "@/features/tickets/search-params";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

type ClientLayoutProps = {
  searchParams: Promise<SearchParams>;
  children: React.ReactNode;
};

export default async function ClientLayout({ children, searchParams }: ClientLayoutProps) {
  const params = await loadTicketSearchParams(searchParams);
  const session = await auth.api.getSession({ headers: await headers() });

  if (session && !session.session.activeOrganizationId) {
    return redirect("/onboarding");
  }

  prefetch(trpc.ticket.all.queryOptions(params));

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
