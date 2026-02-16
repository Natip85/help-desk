import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageTitle } from "@/components/page-title";
import { CreateContactForm } from "@/features/contact/create-contact-form";
import { newContactBreadcrumbs } from "@/lib/breadcrumbs";

export default function NewContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-2 px-6 py-4">
      <Breadcrumbs
        pages={newContactBreadcrumbs}
        className="mb-4 px-2"
      />
      <PageTitle
        title="Create Contact"
        subTitle="Add a new contact to your organization"
        className="w-full"
      />
      <CreateContactForm />
    </div>
  );
}
