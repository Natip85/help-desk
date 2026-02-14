"use client";

import type { Route } from "next";
import { useState } from "react";
import Link from "next/link";
import { FolderPlusIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CreateFolderDialog } from "./create-folder-dialog";
import { useCannedResponseSearchParams } from "./search-params";

export function CannedResponsePageActions() {
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const { folderId } = useCannedResponseSearchParams();

  const newHref =
    folderId ?
      `/settings/canned-responses/new?folderId=${folderId}`
    : "/settings/canned-responses/new";

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setFolderDialogOpen(true)}
      >
        <FolderPlusIcon className="size-4" />
        New Folder
      </Button>
      <Button
        size="sm"
        asChild
      >
        <Link href={newHref as Route}>
          <PlusIcon className="size-4" />
          New Canned Response
        </Link>
      </Button>

      <CreateFolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
      />
    </>
  );
}
