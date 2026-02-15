import type { SearchParams } from "nuqs";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageTitle } from "@/components/page-title";
import { CannedResponseLayout } from "@/features/settings/canned-responses/canned-response-layout";
import { CannedResponseList } from "@/features/settings/canned-responses/canned-response-list";
import { CannedResponsePageActions } from "@/features/settings/canned-responses/canned-response-page-actions";
import { loadCannedResponseSearchParams } from "@/features/settings/canned-responses/search-params";
import { settingsCannedResponsesBreadcrumbs } from "@/lib/breadcrumbs";
import { prefetch, trpc } from "@/trpc/server";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function CannedResponsesPage({ searchParams }: PageProps) {
  const params = await loadCannedResponseSearchParams(searchParams);

  prefetch(trpc.cannedResponse.folderList.queryOptions());
  prefetch(
    trpc.cannedResponse.list.queryOptions({
      folderId: params.folderId ?? undefined,
    })
  );

  return (
    <div className="flex h-full flex-col gap-6 py-6 pr-4.5 pl-6">
      <Breadcrumbs
        pages={settingsCannedResponsesBreadcrumbs}
        className="px-2"
      />
      <PageTitle
        title="Canned Responses"
        subTitle="Manage your canned responses to quickly reply to tickets and contacts"
        className="w-full"
      >
        <CannedResponsePageActions />
      </PageTitle>
      <div className="min-h-0 flex-1">
        <CannedResponseLayout>
          <CannedResponseList />
        </CannedResponseLayout>
      </div>
    </div>
  );
}
