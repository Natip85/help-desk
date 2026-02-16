"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  FileText,
  FolderIcon,
  FolderOpen,
  Inbox,
  Plus,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc";
import { useActiveEditor } from "../ticket/active-editor-context";

export function CannedResponsesSidebar() {
  const [search, setSearch] = useState("");

  return (
    <>
      <SidebarHeader className="border-accent/50 relative space-y-3 border-b p-3">
        <h2 className="text-lg font-medium">Canned Responses</h2>
      </SidebarHeader>

      <SidebarContent className="scrollbar-gutter-stable flex-1 overflow-y-auto p-2">
        <div className="mb-4">
          <Input
            showSearch
            onClear={() => setSearch("")}
            placeholder="Search responses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <FolderTree search={search} />
      </SidebarContent>

      <SidebarFooter className="border-accent/50 border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground w-full justify-start text-xs"
          asChild
        >
          <Link href="/settings/canned-responses">
            <Settings className="mr-1.5 h-3.5 w-3.5" />
            Manage canned responses
          </Link>
        </Button>
      </SidebarFooter>
    </>
  );
}

function FolderTree({ search }: { search: string }) {
  const trpc = useTRPC();

  const { data: foldersData, isLoading: foldersLoading } = useQuery(
    trpc.cannedResponse.folderList.queryOptions()
  );

  if (foldersLoading) {
    return (
      <div className="space-y-2 p-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-8 w-full rounded-md"
          />
        ))}
      </div>
    );
  }

  const folders = foldersData?.items ?? [];

  return (
    <div className="space-y-0.5">
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folderId={folder.id}
          name={folder.name}
          search={search}
        />
      ))}

      {/* Unfiled section – always shown */}
      <FolderItem
        folderId={undefined}
        name="Unfiled"
        search={search}
      />
    </div>
  );
}

function FolderItem({
  folderId,
  name,
  search,
}: {
  folderId: string | undefined;
  name: string;
  search: string;
}) {
  const [open, setOpen] = useState(false);

  const isUnfiled = folderId === undefined;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
    >
      <CollapsibleTrigger className="hover:bg-accent/60 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors">
        <ChevronRight
          className={cn(
            "text-muted-foreground h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            open && "rotate-90"
          )}
        />
        {isUnfiled ?
          <Inbox className="text-muted-foreground h-4 w-4 shrink-0" />
        : open ?
          <FolderOpen className="text-muted-foreground h-4 w-4 shrink-0" />
        : <FolderIcon className="text-muted-foreground h-4 w-4 shrink-0" />}
        <span className="truncate">{name}</span>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="ml-3 border-l pl-2">
          <FolderResponses
            folderId={folderId}
            search={search}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FolderResponses({ folderId, search }: { folderId: string | undefined; search: string }) {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(trpc.cannedResponse.list.queryOptions({ folderId }));

  if (isLoading) {
    return (
      <div className="space-y-1 py-1">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-7 w-full rounded-md"
          />
        ))}
      </div>
    );
  }

  const items = data?.items ?? [];

  const filtered =
    search ? items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())) : items;

  if (filtered.length === 0) {
    return (
      <p className="text-muted-foreground px-2 py-2 text-xs">{search ? "No matches" : "Empty"}</p>
    );
  }

  return (
    <div className="space-y-0.5 py-0.5">
      {filtered.map((item) => (
        <CannedResponseItem
          key={item.id}
          id={item.id}
          name={item.name}
          body={item.body}
        />
      ))}
    </div>
  );
}

function CannedResponseItem({ name, body }: { id: string; name: string; body: string }) {
  const [expanded, setExpanded] = useState(false);
  const { editor } = useActiveEditor();

  const handleInsert = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!editor) {
      toast.error("No active editor – open a reply or forward first.");
      return;
    }

    editor.chain().focus().insertContent(body).run();
  };

  return (
    <Collapsible
      open={expanded}
      onOpenChange={setExpanded}
    >
      <div className="group hover:bg-accent/50 flex items-center gap-1 rounded-md pr-1 transition-colors">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm">
          <FileText className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{name}</span>
        </CollapsibleTrigger>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleInsert}
              className="text-muted-foreground hover:text-foreground h-6 w-6 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Insert into editor</TooltipContent>
        </Tooltip>
      </div>

      <CollapsibleContent>
        <div className="bg-muted/40 mx-1 mb-1 rounded-md border p-3">
          <div
            className="prose prose-sm dark:prose-invert max-h-48 max-w-none overflow-y-auto text-xs"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
