import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { PageTitle } from "@/components/page-title";
import { CreateDefaultFilterButton } from "@/features/settings/ticket-filters/create-default-filter-button";
import { DefaultFiltersList } from "@/features/settings/ticket-filters/default-filters-list";

export default function TicketFiltersPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
      <div className="flex gap-2">
        <Link
          href="/settings"
          className="pt-1"
        >
          <ChevronLeft />
        </Link>
        <PageTitle
          title="Ticket filters"
          subTitle="Manage default filter categories and their options used across the app"
          className="w-full"
        >
          <CreateDefaultFilterButton />
        </PageTitle>
      </div>
      <DefaultFiltersList />
    </div>
  );
}
