import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { PageTitle } from "@/components/page-title";
import { SendEmailForm } from "@/features/emails/send-email-form";

export default function NewEmailPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-2 px-6 py-4">
      <div className="flex gap-2 px-6 py-4">
        <Link
          href="/tickets"
          className="pt-1"
        >
          <ChevronLeft />
        </Link>
        <PageTitle
          title="Send Email"
          subTitle="Compose and send a new email, creating a ticket automatically"
          className="w-full"
        />
      </div>
      <SendEmailForm />
    </div>
  );
}
