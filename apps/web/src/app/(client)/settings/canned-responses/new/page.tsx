import type { SearchParams } from "nuqs";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageTitle } from "@/components/page-title";
import { CannedResponseForm } from "@/features/settings/canned-responses/canned-response-form";
import { loadCannedResponseSearchParams } from "@/features/settings/canned-responses/search-params";
import { settingsNewCannedResponseBreadcrumbs } from "@/lib/breadcrumbs";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function NewCannedResponsePage({ searchParams }: PageProps) {
  const params = await loadCannedResponseSearchParams(searchParams);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 px-6 py-4">
        <Breadcrumbs
          pages={settingsNewCannedResponseBreadcrumbs}
          className="px-2"
        />
        <PageTitle
          title="New Canned Response"
          subTitle="Create a new canned response"
          className="w-full"
        />
      </div>

      <div className="min-h-0 flex-1">
        <CannedResponseForm folderId={params.folderId} />
      </div>
    </div>
  );
}
