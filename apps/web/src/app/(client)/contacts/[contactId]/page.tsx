import { Breadcrumbs } from "@/components/breadcrumbs";
import { createContactDetailBreadcrumbs } from "@/lib/breadcrumbs";

type PageProps = {
  params: Promise<{ contactId: string }>;
};

export default async function ContactPage({ params }: PageProps) {
  const { contactId } = await params;

  return (
    <div>
      <Breadcrumbs
        pages={createContactDetailBreadcrumbs(contactId)}
        className="px-2"
      />
      <div>ContactPage</div>
    </div>
  );
}
