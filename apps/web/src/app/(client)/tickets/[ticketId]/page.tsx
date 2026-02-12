import { Plus } from "lucide-react";

import { PageTitle } from "@/components/page-title";
import { Button } from "@/components/ui/button";
import { ConversationThread } from "@/features/ticket/conversation-thread";
import { EmailEditor } from "@/features/ticket/email-editor";
import { TicketHeader } from "@/features/ticket/ticket-header";

type PageProps = {
  params: Promise<{ ticketId: string }>;
};
export default async function TicketPage({ params }: PageProps) {
  const { ticketId } = await params;
  return (
    <div>
      <div className="bg-background sticky top-0 z-10 flex flex-col gap-6 px-6 py-2">
        <PageTitle title={ticketId}>
          <Button>
            <Plus />
            New
          </Button>
        </PageTitle>
        <TicketHeader ticketId={ticketId} />
      </div>
      <div className="bg-secondary/30 m-2 flex-1 rounded-xl p-3">
        <ConversationThread ticketId={ticketId} />
        <EmailEditor ticketId={ticketId} />
      </div>
    </div>
  );
}
