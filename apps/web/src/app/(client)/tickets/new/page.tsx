import { PageTitle } from "@/components/page-title";
import { CreateTicketForm } from "@/features/tickets/create-ticket-form";

export default function NewTicketPage() {
  return (
    <div>
      <PageTitle title="Create Ticket" />
      <CreateTicketForm />
    </div>
  );
}
