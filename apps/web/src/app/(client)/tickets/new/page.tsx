import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { PageTitle } from "@/components/page-title";
import { CreateTicketForm } from "@/features/tickets/create-ticket-form";

export default function NewTicketPage() {
  return (
    <div>
      <div className="flex gap-2 px-6 py-4">
        <Link
          href="/tickets"
          className="pt-1"
        >
          <ChevronLeft />
        </Link>
        <PageTitle
          title="Create Ticket"
          subTitle="Create a new ticket with a new contact or use an existing one"
          className="w-full"
        />
      </div>
      <CreateTicketForm />
    </div>
  );
}
