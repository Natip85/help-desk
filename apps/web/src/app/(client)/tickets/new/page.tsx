import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageTitle } from "@/components/page-title";
import { CreateTicketForm } from "@/features/tickets/create-ticket-form";
import { newTicketBreadcrumbs } from "@/lib/breadcrumbs";

export default function NewTicketPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-2 px-6 py-4">
      <Breadcrumbs
        pages={newTicketBreadcrumbs}
        className="mb-4 px-2"
      />
      <PageTitle
        title="Create Ticket"
        subTitle="Create a new ticket with a new contact or use an existing one"
        className="w-full"
      />
      <CreateTicketForm />
    </div>
  );
}
