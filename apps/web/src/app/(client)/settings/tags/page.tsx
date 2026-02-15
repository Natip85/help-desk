import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageTitle } from "@/components/page-title";
import { CreateTagButton } from "@/features/settings/tags/create-tag-button";
import { TagsList } from "@/features/settings/tags/tags-list";
import { settingsTagsBreadcrumbs } from "@/lib/breadcrumbs";

export default function TagsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
      <Breadcrumbs
        pages={settingsTagsBreadcrumbs}
        className="px-2"
      />
      <PageTitle
        title="Manage tags"
        subTitle="Manage tags by labeling tickets and contacts"
        className="w-full"
      >
        <CreateTagButton />
      </PageTitle>
      <TagsList />
    </div>
  );
}
