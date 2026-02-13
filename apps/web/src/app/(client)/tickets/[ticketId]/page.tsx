import { Plus } from "lucide-react";

import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { ActiveEditor } from "@/features/ticket/active-editor";
import { ConversationThread } from "@/features/ticket/conversation-thread";
import { TicketHeader } from "@/features/ticket/ticket-header";

type PageProps = {
  params: Promise<{ ticketId: string }>;
};
export default async function TicketPage({ params }: PageProps) {
  const { ticketId } = await params;
  return (
    <div>
      <div className="bg-background sticky top-0 z-10 flex flex-col gap-6 px-6 py-2">
        <PageTitle title={`Ticket: ${ticketId}`}>
          <Button>
            <Plus />
            New
          </Button>
        </PageTitle>
        <TicketHeader ticketId={ticketId} />
      </div>
      <div className="bg-secondary/30 m-2 flex-1 space-y-3 rounded-xl p-3">
        <ConversationThread ticketId={ticketId} />
        <ActiveEditor ticketId={ticketId} />
      </div>
    </div>
  );
}
