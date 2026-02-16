import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageTitle } from "@/components/page-title";
import { SavedFiltersList } from "@/features/settings/saved-filters/saved-filters-list";
import { settingsSavedFiltersBreadcrumbs } from "@/lib/breadcrumbs";

export default function SavedFiltersPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
      <Breadcrumbs
        pages={settingsSavedFiltersBreadcrumbs}
        className="px-2"
      />
      <PageTitle
        title="Saved filters"
        subTitle="Manage your saved ticket filter presets. Edit filter criteria, rename, or delete saved filters."
        className="w-full"
      />
      <SavedFiltersList />
    </div>
  );
}
