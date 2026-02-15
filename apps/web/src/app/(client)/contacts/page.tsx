import { Breadcrumbs } from "@/components/breadcrumbs";
import { contactsBreadcrumbs } from "@/lib/breadcrumbs";

export default function ContactsPage() {
  return (
    <div>
      <Breadcrumbs
        pages={contactsBreadcrumbs}
        className="px-2"
      />
      <div>Contacts</div>
    </div>
  );
}
