"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { FilterType } from "@help-desk/db/validators/default-filter";
import { FILTER_TYPE_LABELS } from "@help-desk/db/validators/default-filter";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc";
import { DefaultFilterDialog } from "./default-filter-dialog";

type FilterOption = {
  value: string;
  label: string;
  position: number;
};

type FilterItem = {
  id: string;
  name: string;
  displayName: string;
  type: FilterType;
  options: FilterOption[];
  isSystem: boolean;
};

type EditFilter = FilterItem;

export function DefaultFiltersList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [editingFilter, setEditingFilter] = useState<EditFilter | null>(null);

  const { data } = useQuery(trpc.defaultFilter.list.queryOptions());

  const { mutate: deleteFilter, isPending: isDeleting } = useMutation(
    trpc.defaultFilter.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.defaultFilter.list.queryKey(),
        });
        toast.success("Filter deleted");
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to delete filter");
      },
    })
  );

  const { mutate: reorderFilters } = useMutation(
    trpc.defaultFilter.reorder.mutationOptions({
      onSuccess: () => {
        void queryClient.refetchQueries({
          queryKey: trpc.defaultFilter.list.queryKey(),
        });
      },
      onError: () => {
        void queryClient.refetchQueries({
          queryKey: trpc.defaultFilter.list.queryKey(),
        });
        toast.error("Failed to reorder filters");
      },
    })
  );

  const filters: FilterItem[] = (data?.items ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    displayName: f.displayName,
    type: f.type ?? "multi-select",
    options: f.options as FilterOption[],
    isSystem: f.isSystem,
  }));

  const filterIds = filters.map((f) => f.id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = filters.findIndex((f) => f.id === active.id);
    const newIndex = filters.findIndex((f) => f.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filters, oldIndex, newIndex);
    const orderedIds = reordered.map((f) => f.id);

    queryClient.setQueryData(trpc.defaultFilter.list.queryKey(), (old: typeof data) => {
      if (!old) return old;
      const itemMap = new Map(old.items.map((item) => [item.id, item]));
      const reorderedItems = orderedIds.reduce<typeof old.items>((acc, id, idx) => {
        const item = itemMap.get(id);
        if (item) acc.push({ ...item, position: idx });
        return acc;
      }, []);
      return { ...old, items: reorderedItems };
    });

    reorderFilters({ orderedIds });
  }

  return (
    <div className="w-full space-y-3">
      {filters.length === 0 ?
        <p className="text-muted-foreground py-8 text-center text-sm">
          No filters configured yet. They will be automatically created when you reload.
        </p>
      : <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filterIds}
            strategy={verticalListSortingStrategy}
          >
            {filters.map((filter) => (
              <SortableFilterItem
                key={filter.id}
                filter={filter}
                onEdit={setEditingFilter}
                onDelete={deleteFilter}
                isDeleting={isDeleting}
              />
            ))}
          </SortableContext>
        </DndContext>
      }

      {editingFilter && (
        <DefaultFilterDialog
          open={!!editingFilter}
          onOpenChange={(open) => {
            if (!open) setEditingFilter(null);
          }}
          editFilter={editingFilter}
        />
      )}
    </div>
  );
}

// ─── Sortable Filter Item ────────────────────────────────────────────────────

function SortableFilterItem({
  filter,
  onEdit,
  onDelete,
  isDeleting,
}: {
  filter: FilterItem;
  onEdit: (filter: EditFilter) => void;
  onDelete: (input: { id: string }) => void;
  isDeleting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: filter.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-accent/50 flex items-center gap-3 rounded-md px-3 py-4 ${
        isDragging ? "z-50 opacity-80 shadow-lg" : ""
      }`}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground shrink-0 cursor-grab touch-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Filter content */}
      <div className="flex flex-1 items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{filter.displayName}</h3>
            {filter.isSystem && (
              <Badge
                variant="secondary"
                className="text-[10px]"
              >
                System
              </Badge>
            )}
            {!filter.isSystem && filter.type && (
              <Badge
                variant="outline"
                className="text-[10px]"
              >
                {FILTER_TYPE_LABELS[filter.type ?? "multi-select"]}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filter.options.length > 0 ?
              [...filter.options]
                .sort((a, b) => a.position - b.position)
                .map((option) => (
                  <span
                    key={option.value}
                    className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs"
                  >
                    {option.label}
                  </span>
                ))
            : <span className="text-muted-foreground text-xs italic">
                Options loaded dynamically
              </span>
            }
          </div>
        </div>
        {!filter.isSystem && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(filter)}
            >
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Edit
            </Button>
            <DeleteFilterButton
              filterId={filter.id}
              filterName={filter.displayName}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Delete Filter Button ────────────────────────────────────────────────────

function DeleteFilterButton({
  filterId,
  filterName,
  onDelete,
  isDeleting,
}: {
  filterId: string;
  filterName: string;
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
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Filter</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the filter &quot;{filterName}&quot;? This action cannot
            be undone.
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
