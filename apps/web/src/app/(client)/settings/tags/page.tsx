import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { PageTitle } from "@/components/page-title";
import { CreateTagButton } from "@/features/settings/tags/create-tag-button";
import { TagsList } from "@/features/settings/tags/tags-list";

export default function TagsPage() {
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
          title="Manage tags"
          subTitle="Create, edit, and delete tags to categorize your tickets and contacts"
          className="w-full"
        >
          <CreateTagButton />
        </PageTitle>
      </div>
      <TagsList />
    </div>
  );
}
