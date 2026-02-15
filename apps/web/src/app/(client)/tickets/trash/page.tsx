import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@help-desk/auth";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageTitle } from "@/components/page-title";
import { TrashTicketList } from "@/features/tickets/trash-ticket-list";
import { trashTicketsBreadcrumbs } from "@/lib/breadcrumbs";
import { prefetch, trpc } from "@/trpc/server";

export default async function TrashPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return redirect("/auth/sign-in");

  prefetch(trpc.ticket.listDeleted.queryOptions({ page: 1, limit: 20 }));

  return (
    <div className="flex flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
      <Breadcrumbs
        pages={trashTicketsBreadcrumbs}
        className="px-2"
      />
      <PageTitle
        title="Trash"
        subTitle="Deleted tickets are permanently removed after 30 days"
      />
      <TrashTicketList />
    </div>
  );
}
