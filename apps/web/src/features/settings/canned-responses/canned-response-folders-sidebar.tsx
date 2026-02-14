"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderIcon, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc";
import { useCannedResponseSearchParams } from "./search-params";

export function CannedResponseFoldersSidebar() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { folderId, setFolderId } = useCannedResponseSearchParams();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const { data, isLoading } = useQuery(trpc.cannedResponse.folderList.queryOptions());

  const { mutate: renameFolder } = useMutation(
    trpc.cannedResponse.folderUpdate.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.cannedResponse.folderList.queryKey(),
        });
        setRenamingId(null);
        toast.success("Folder renamed");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const { mutate: deleteFolder } = useMutation(
    trpc.cannedResponse.folderDelete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.cannedResponse.folderList.queryKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.cannedResponse.list.queryKey(),
        });
        toast.success("Folder deleted");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const folders = data?.items ?? [];

  const handleStartRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const handleRenameSubmit = (id: string) => {
    if (renameValue.trim()) {
      renameFolder({ id, name: renameValue.trim() });
    } else {
      setRenamingId(null);
    }
  };

  const handleDeleteFolder = (id: string) => {
    deleteFolder({ id });
    if (folderId === id) {
      setFolderId(null);
    }
  };

  return (
    <div className="bg-background flex h-full flex-col">
      <div className="border-primary flex h-11 items-center justify-between border-b px-3">
        <span className="text-sm font-medium">Folders</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ?
          <div className="flex items-center justify-center py-4">
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          </div>
        : <div className="flex flex-col gap-0.5 p-1.5">
            {/* "All" / unfiled item */}
            <button
              type="button"
              onClick={() => setFolderId(null)}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                "hover:bg-accent",
                folderId === null && "bg-accent font-medium"
              )}
            >
              <FolderIcon className="text-muted-foreground size-4" />
              <span>Unfiled</span>
            </button>

            {folders.map((folder) => (
              <div
                key={folder.id}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  "hover:bg-accent",
                  folderId === folder.id && "bg-accent font-medium"
                )}
              >
                {renamingId === folder.id ?
                  <Input
                    size="sm"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameSubmit(folder.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit(folder.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="h-6 flex-1"
                    autoFocus
                  />
                : <>
                    <button
                      type="button"
                      onClick={() => setFolderId(folder.id)}
                      className="flex min-w-0 flex-1 items-center gap-2"
                    >
                      <FolderIcon className="text-muted-foreground size-4 shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-foreground size-6 shrink-0 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        side="right"
                      >
                        <DropdownMenuItem onClick={() => handleStartRename(folder.id, folder.name)}>
                          <Pencil className="size-3.5" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteFolder(folder.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                }
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}
