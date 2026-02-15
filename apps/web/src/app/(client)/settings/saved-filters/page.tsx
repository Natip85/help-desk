import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { PageTitle } from "@/components/page-title";
import { SavedFiltersList } from "@/features/settings/saved-filters/saved-filters-list";

export default function SavedFiltersPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
      <div className="flex gap-2">
        <Link
          href="/settings"
          className="pt-1"
        >
          <ChevronLeft />
        </Link>
        <PageTitle
          title="Saved filters"
          subTitle="Manage your saved ticket filter presets. Edit filter criteria, rename, or delete saved filters."
          className="w-full"
        />
      </div>
      <SavedFiltersList />
    </div>
  );
}
