import type { SearchParams } from "nuqs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UploadIcon } from "lucide-react";

import { auth } from "@help-desk/auth";

import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { loadTicketSearchParams } from "@/features/tickets/search-params";
import { TicketList } from "@/features/tickets/ticket-list";
import { TicketsHeader } from "@/features/tickets/tickets-header";
import { prefetch, trpc } from "@/trpc/server";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function TicketsPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return redirect("/auth/sign-in");

  const params = await loadTicketSearchParams(searchParams);

  prefetch(trpc.ticket.all.queryOptions(params));

  return (
    <div>
      <div className="bg-background sticky top-0 z-10 flex flex-col gap-6 px-6 py-2">
        <PageTitle
          title="Tickets"
          subTitle="View, filter and sort all tickets"
        >
          <Button disabled>
            <UploadIcon />
            Export
          </Button>
        </PageTitle>
        <TicketsHeader />
      </div>

      <TicketList />
    </div>
  );
}
