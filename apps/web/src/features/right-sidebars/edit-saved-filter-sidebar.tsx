"use client";

import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import type { TicketFilter } from "@help-desk/db/validators/ticket-filter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { FilterFormContent } from "@/features/filters/filter-form-content";
import { useTRPC } from "@/trpc";
import { useSidebarParams } from "./query-params";

// ─── Edit Saved Filter Sidebar ──────────────────────────────────────────────

export const EditSavedFilterSidebar = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { sidebarParams, closeSidebar } = useSidebarParams();

  const savedFilterId = sidebarParams.editSavedFilterId;

  const { data: savedFilter, isLoading } = useQuery(
    trpc.savedFilter.getById.queryOptions(savedFilterId ? { id: savedFilterId } : skipToken)
  );

  const { mutateAsync: updateSavedFilter } = useMutation(
    trpc.savedFilter.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.savedFilter.all.queryKey(),
        });
      },
    })
  );

  // Local filter state, initialized from the fetched saved filter
  const [localFilter, setLocalFilter] = useState<TicketFilter>({});

  // Re-initialize local filter when saved filter data loads or changes
  useEffect(() => {
    if (savedFilter?.filter) {
      setLocalFilter(savedFilter.filter);
    }
  }, [savedFilter?.filter]);

  const form = useForm({
    defaultValues: {
      title: savedFilter?.title ?? "",
      description: savedFilter?.description ?? "",
    },
    onSubmit: async ({ value }) => {
      if (!savedFilterId) return;
      try {
        await updateSavedFilter({
          id: savedFilterId,
          title: value.title,
          description: value.description || undefined,
          filter: localFilter,
        });

        toast.success(`Filter "${value.title}" updated successfully!`);
        closeSidebar();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update filter");
      }
    },
    validators: {
      onSubmit: z.object({
        title: z.string().trim().min(1, "Title is required").max(255),
        description: z.string(),
      }),
    },
  });

  // Reset form when saved filter data loads
  useEffect(() => {
    if (savedFilter) {
      form.reset({
        title: savedFilter.title,
        description: savedFilter.description ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedFilter?.id]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    );
  }

  if (!savedFilter) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground text-sm">Saved filter not found</p>
        <Button
          variant="outline"
          size="sm"
          onClick={closeSidebar}
        >
          Close
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <SidebarHeader className="border-accent/50 relative border-b p-2">
        <h2 className="text-lg font-medium">Edit saved filter</h2>
      </SidebarHeader>

      <SidebarContent className="scrollbar-gutter-stable flex flex-1 flex-col overflow-y-auto p-3">
        <SidebarGroup>
          <SidebarGroupLabel>Title</SidebarGroupLabel>
          <form.Field name="title">
            {(field) => (
              <div className="space-y-1">
                <Input
                  id="edit-saved-filter-title"
                  placeholder="e.g. Urgent unassigned tickets"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error, i) => (
                  <p
                    key={i}
                    className="text-destructive text-sm"
                  >
                    {typeof error === "string" ? error : error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Description</SidebarGroupLabel>
          <form.Field name="description">
            {(field) => (
              <div className="space-y-1">
                <Input
                  id="edit-saved-filter-description"
                  placeholder="Optional description..."
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error, i) => (
                  <p
                    key={i}
                    className="text-destructive text-sm"
                  >
                    {typeof error === "string" ? error : error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </SidebarGroup>

        <Separator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel>Filter criteria</SidebarGroupLabel>
        </SidebarGroup>

        <FilterFormContent
          filter={localFilter}
          onFilterChange={setLocalFilter}
        />
      </SidebarContent>

      <SidebarFooter className="border-accent/50 flex items-center gap-2 border-t p-3">
        <Button
          type="button"
          variant="outline"
          className="dark:bg-muted/50 dark:hover:bg-muted/70 w-full"
          onClick={closeSidebar}
        >
          <X className="mr-1 size-4" />
          Cancel
        </Button>
        <form.Subscribe>
          {(state) => (
            <Button
              variant="secondary"
              type="submit"
              className="dark:hover:bg-accent/40 dark:bg-accent/50 w-full"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ?
                <Loader2 className="mr-1 size-4 animate-spin" />
              : <Save className="mr-1 size-4" />}
              Save changes
            </Button>
          )}
        </form.Subscribe>
      </SidebarFooter>
    </form>
  );
};
