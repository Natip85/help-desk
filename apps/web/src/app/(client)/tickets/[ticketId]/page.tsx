import { Breadcrumbs } from "@/components/breadcrumbs";
import { CopyButton } from "@/components/copy-button";
import { PageTitle } from "@/components/page-title";
import { ActiveEditor } from "@/features/ticket/active-editor";
import { ConversationThread } from "@/features/ticket/conversation-thread";
import { MergedTicketBanner } from "@/features/ticket/merged-ticket-banner";
import { MergedTicketsSection } from "@/features/ticket/merged-tickets-section";
import { TicketHeader } from "@/features/ticket/ticket-header";
import { createTicketDetailBreadcrumbs } from "@/lib/breadcrumbs";

type PageProps = {
  params: Promise<{ ticketId: string }>;
};
export default async function TicketPage({ params }: PageProps) {
  const { ticketId } = await params;
  return (
    <div>
      <div className="bg-background sticky top-0 z-10 flex flex-col gap-6 px-6 py-2">
        <Breadcrumbs
          pages={createTicketDetailBreadcrumbs(ticketId)}
          className="px-2"
        />
        <div className="flex gap-2">
          <PageTitle title={ticketId} />
          <CopyButton
            value={ticketId}
            label="Copy ticket ID"
          />
        </div>
        <TicketHeader ticketId={ticketId} />
      </div>
      <MergedTicketBanner ticketId={ticketId} />
      <MergedTicketsSection ticketId={ticketId} />
      <div className="bg-secondary/30 m-2 flex-1 space-y-3 rounded-xl p-3">
        <ConversationThread ticketId={ticketId} />
        <ActiveEditor ticketId={ticketId} />
      </div>
    </div>
  );
}
