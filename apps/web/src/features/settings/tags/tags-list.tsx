"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useTRPC } from "@/trpc";
import { CreateTagDialog } from "./create-tag-dialog";

export function TagsList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [editingTag, setEditingTag] = useState<{
    id: string;
    name: string;
    color: string;
  } | null>(null);

  const { data } = useQuery(trpc.tags.list.queryOptions());

  const { mutate: deleteTag, isPending: isDeleting } = useMutation(
    trpc.tags.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.tags.list.queryKey() });
        toast.success("Tag deleted");
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to delete tag");
      },
    })
  );

  const tags = data?.items ?? [];

  return (
    <div className="w-full space-y-4">
      {tags.length === 0 ?
        <p className="text-muted-foreground py-8 text-center text-sm">
          No tags created yet. Add one to start categorizing tickets and contacts.
        </p>
      : <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Color</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((t) => (
              <TableRow
                key={t.id}
                className="hover:bg-transparent"
              >
                <TableCell>
                  <span
                    className="inline-block h-4 w-4 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                </TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditingTag({
                          id: t.id,
                          name: t.name,
                          color: t.color,
                        })
                      }
                    >
                      Edit
                    </Button>
                    <DeleteTagButton
                      tagId={t.id}
                      tagName={t.name}
                      onDelete={deleteTag}
                      isDeleting={isDeleting}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }

      {editingTag && (
        <CreateTagDialog
          open={!!editingTag}
          onOpenChange={(open) => {
            if (!open) setEditingTag(null);
          }}
          editTag={editingTag}
        />
      )}
    </div>
  );
}

function DeleteTagButton({
  tagId,
  tagName,
  onDelete,
  isDeleting,
}: {
  tagId: string;
  tagName: string;
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
          <AlertDialogTitle>Delete Tag</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the tag &quot;{tagName}&quot;? This will remove it from
            all tickets and contacts. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onDelete({ id: tagId });
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
