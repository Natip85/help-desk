"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookmarkIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSidebarParams } from "@/features/right-sidebars/query-params";
import { useTRPC } from "@/trpc";

export function SavedFiltersList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toggleEditSavedFilter } = useSidebarParams();

  const { data, isLoading } = useQuery(trpc.savedFilter.all.queryOptions());

  const { mutate: deleteSavedFilter, isPending: isDeleting } = useMutation(
    trpc.savedFilter.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.savedFilter.all.queryKey() });
        toast.success("Saved filter deleted");
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to delete saved filter");
      },
    })
  );

  const savedFilters = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      {savedFilters.length === 0 ?
        <div className="flex flex-col items-center justify-center gap-2 py-12">
          <BookmarkIcon className="text-muted-foreground size-10" />
          <p className="text-muted-foreground text-sm">
            No saved filters yet. Save a filter from the tickets page to get started.
          </p>
        </div>
      : <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {savedFilters.map((sf) => (
              <TableRow
                key={sf.id}
                className="hover:bg-transparent"
              >
                <TableCell>
                  <Button
                    variant="link"
                    type="button"
                    onClick={() => toggleEditSavedFilter(sf.id)}
                  >
                    {sf.title}
                  </Button>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {sf.description ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sf.createdBy?.name ?? "Unknown"}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {new Date(sf.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <DeleteSavedFilterButton
                      filterId={sf.id}
                      filterTitle={sf.title}
                      onDelete={deleteSavedFilter}
                      isDeleting={isDeleting}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
    </div>
  );
}

function DeleteSavedFilterButton({
  filterId,
  filterTitle,
  onDelete,
  isDeleting,
}: {
  filterId: string;
  filterTitle: string;
  onDelete: (input: { id: string }) => void;
  isDeleting: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
        >
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Saved Filter</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the saved filter &quot;{filterTitle}&quot;? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onDelete({ id: filterId });
              setIsOpen(false);
            }}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
