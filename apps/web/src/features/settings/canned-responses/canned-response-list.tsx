"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileTextIcon, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useTRPC } from "@/trpc";
import { useCannedResponseSearchParams } from "./search-params";

export function CannedResponseList() {
  const trpc = useTRPC();
  const { folderId } = useCannedResponseSearchParams();

  const { data, isLoading } = useQuery(
    trpc.cannedResponse.list.queryOptions({
      folderId: folderId ?? undefined,
    })
  );

  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12">
        <FileTextIcon className="text-muted-foreground size-10" />
        <p className="text-muted-foreground text-sm">No canned responses yet</p>
        <p className="text-muted-foreground text-xs">
          Create one to quickly reply to tickets and contacts.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/settings/canned-responses/${item.id}`}
        >
          <Card className="hover:bg-accent/50 cursor-pointer p-0 transition-colors">
            <CardContent className="flex flex-col gap-1 px-4 py-3">
              <h3 className="text-sm font-medium">{item.name}</h3>
              <p className="text-muted-foreground line-clamp-2 text-xs">{stripHtml(item.body)}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

/** Strip HTML tags for preview text */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}
