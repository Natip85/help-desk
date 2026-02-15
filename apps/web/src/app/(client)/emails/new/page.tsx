import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageTitle } from "@/components/page-title";
import { SendEmailForm } from "@/features/emails/send-email-form";
import { newEmailBreadcrumbs } from "@/lib/breadcrumbs";

export default function NewEmailPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-2 px-6 py-4">
      <Breadcrumbs
        pages={newEmailBreadcrumbs}
        className="mb-4 px-2"
      />
      <PageTitle
        title="Send Email"
        subTitle="Compose and send a new email, creating a ticket automatically"
        className="w-full"
      />
      <SendEmailForm />
    </div>
  );
}
