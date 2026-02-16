import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactPageContent } from "@/features/contact/contact-page-content";
import { createContactDetailBreadcrumbs } from "@/lib/breadcrumbs";

type PageProps = {
  params: Promise<{ contactId: string }>;
};

export default async function ContactPage({ params }: PageProps) {
  const { contactId } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-background sticky top-0 z-10 px-6 py-2">
        <Breadcrumbs
          pages={createContactDetailBreadcrumbs(contactId)}
          className="px-2"
        />
      </div>
      <div className="px-6 pb-6">
        <ContactPageContent contactId={contactId} />
      </div>
    </div>
  );
}
