import type { SearchParams } from "nuqs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@help-desk/auth";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageTitle } from "@/components/page-title";
import { ExportTicketsSheet } from "@/features/tickets/export-tickets-sheet";
import { NewTicketsBanner } from "@/features/tickets/new-tickets-banner";
import { loadTicketSearchParams } from "@/features/tickets/search-params";
import { TicketList } from "@/features/tickets/ticket-list";
import { TicketsHeader } from "@/features/tickets/tickets-header";
import { ticketsBreadcrumbs } from "@/lib/breadcrumbs";
import { prefetch, trpc } from "@/trpc/server";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function TicketsPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return redirect("/auth/sign-in");

  // const { success: canExport } = await auth.api.hasPermission({
  //   headers: await headers(),
  //   body: { permissions: { ticket: ["export"] } },
  // });

  const params = await loadTicketSearchParams(searchParams);

  prefetch(trpc.ticket.all.queryOptions(params));

  return (
    <div className="relative">
      <NewTicketsBanner />
      <div className="bg-background sticky top-0 z-10 flex flex-col gap-6 px-6 py-2">
        <Breadcrumbs
          pages={ticketsBreadcrumbs}
          className="px-2"
        />
        <PageTitle title="Tickets">
          {/* {canExport && */}
          <ExportTicketsSheet />
          {/* } */}
        </PageTitle>
        <TicketsHeader />
      </div>

      <TicketList />
    </div>
  );
}
