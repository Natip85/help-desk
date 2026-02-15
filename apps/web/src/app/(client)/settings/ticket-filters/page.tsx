import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageTitle } from "@/components/page-title";
import { CreateDefaultFilterButton } from "@/features/settings/ticket-filters/create-default-filter-button";
import { DefaultFiltersList } from "@/features/settings/ticket-filters/default-filters-list";
import { settingsTicketFiltersBreadcrumbs } from "@/lib/breadcrumbs";

export default function TicketFiltersPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
      <Breadcrumbs
        pages={settingsTicketFiltersBreadcrumbs}
        className="px-2"
      />
      <PageTitle
        title="Ticket filters"
        subTitle="Manage default filter categories and their options used across the app"
        className="w-full"
      >
        <CreateDefaultFilterButton />
      </PageTitle>
      <DefaultFiltersList />
    </div>
  );
}
