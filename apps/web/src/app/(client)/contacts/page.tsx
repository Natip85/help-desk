import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageTitle } from "@/components/page-title";
import { contactsBreadcrumbs } from "@/lib/breadcrumbs";

export default function ContactsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
      <Breadcrumbs
        pages={contactsBreadcrumbs}
        className="px-2"
      />
      <PageTitle
        title="Contacts"
        subTitle="Manage your contacts"
        className="w-full"
      >
        {/* <CreateOrganizationButton /> */}
      </PageTitle>
    </div>
  );
}
