import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { CopyButton } from "@/components/copy-button";
import { PageTitle } from "@/components/page-title";
import { CannedResponseForm } from "@/features/settings/canned-responses/canned-response-form";
import { DeleteCannedResponseButton } from "@/features/settings/canned-responses/delete-canned-response-button";
import { prefetch, trpc } from "@/trpc/server";

type PageProps = {
  params: Promise<{ cannedId: string }>;
};

export default async function CannedResponsePage({ params }: PageProps) {
  const { cannedId } = await params;

  prefetch(trpc.cannedResponse.getById.queryOptions({ id: cannedId }));

  return (
    <div className="flex h-full flex-col gap-6 py-6 pr-4.5 pl-6">
      <div className="flex gap-2">
        <Link
          href="/settings/canned-responses"
          className="pt-1"
        >
          <ChevronLeft />
        </Link>
        <PageTitle
          title={cannedId}
          subTitle="Edit your canned response"
        />
        <CopyButton
          value={cannedId}
          label="Copy canned response ID"
        />
        <div className="ml-auto">
          <DeleteCannedResponseButton cannedId={cannedId} />
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <CannedResponseForm cannedId={cannedId} />
      </div>
    </div>
  );
}
