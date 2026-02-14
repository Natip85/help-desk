"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import type { TicketFilter } from "@help-desk/db/validators/ticket-filter";

import { Badge } from "@/components/ui/badge";
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
import { useTRPC } from "@/trpc";
import { useTicketSearchParams } from "../tickets/search-params";
import { priorityConfig, statusConfig } from "../tickets/ticket-card";
import { useSidebarParams } from "./query-params";

// ─── Filter Summary ──────────────────────────────────────────────────────────

function FilterCriteriaSummary({ filter }: { filter: TicketFilter }) {
  const trpc = useTRPC();

  const { data: members = [] } = useQuery(trpc.user.getOrganizationMembers.queryOptions());
  const { data: tagsData } = useQuery(trpc.tags.list.queryOptions());
  const allTags = tagsData?.items ?? [];

  const hasAnyFilter = [
    (filter.statuses?.length ?? 0) > 0,
    (filter.priorities?.length ?? 0) > 0,
    (filter.channels?.length ?? 0) > 0,
    (filter.assignedToIds?.length ?? 0) > 0,
    filter.isUnassigned,
    (filter.tagIds?.length ?? 0) > 0,
    (filter.contactIds?.length ?? 0) > 0,
    (filter.companyIds?.length ?? 0) > 0,
    (filter.mailboxIds?.length ?? 0) > 0,
    filter.createdAt?.from,
    filter.createdAt?.to,
    filter.lastMessageAt?.from,
    filter.lastMessageAt?.to,
    filter.closedAt?.from,
    filter.closedAt?.to,
  ].some(Boolean);

  if (!hasAnyFilter) {
    return <p className="text-muted-foreground text-sm">No filter criteria applied.</p>;
  }

  return (
    <div className="space-y-3">
      {filter.statuses && filter.statuses.length > 0 && (
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">Status</p>
          <div className="flex flex-wrap gap-1">
            {filter.statuses.map((s) => (
              <Badge
                key={s}
                variant="secondary"
              >
                {statusConfig[s]?.label ?? s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {filter.priorities && filter.priorities.length > 0 && (
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">Priority</p>
          <div className="flex flex-wrap gap-1">
            {filter.priorities.map((p) => (
              <Badge
                key={p}
                variant="secondary"
              >
                {priorityConfig[p]?.label ?? p}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {filter.channels && filter.channels.length > 0 && (
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">Channel</p>
          <div className="flex flex-wrap gap-1">
            {filter.channels.map((c) => (
              <Badge
                key={c}
                variant="secondary"
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {((filter.assignedToIds?.length ?? 0) > 0 || filter.isUnassigned) && (
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">Assignee</p>
          <div className="flex flex-wrap gap-1">
            {filter.isUnassigned && <Badge variant="secondary">Unassigned</Badge>}
            {filter.assignedToIds?.map((id) => {
              const member = members.find((m) => m.id === id);
              return (
                <Badge
                  key={id}
                  variant="secondary"
                >
                  {member?.name ?? id}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {filter.tagIds && filter.tagIds.length > 0 && (
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">Tags</p>
          <div className="flex flex-wrap gap-1">
            {filter.tagIds.map((id) => {
              const tag = allTags.find((t) => t.id === id);
              return (
                <Badge
                  key={id}
                  variant="secondary"
                >
                  {tag && (
                    <span
                      className="mr-1 inline-block size-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                  )}
                  {tag?.name ?? id}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {(filter.createdAt?.from ?? filter.createdAt?.to) && (
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">Created</p>
          <Badge variant="secondary">
            {filter.createdAt.from && new Date(filter.createdAt.from).toLocaleDateString()}
            {filter.createdAt.from && filter.createdAt.to && " – "}
            {filter.createdAt.to && new Date(filter.createdAt.to).toLocaleDateString()}
          </Badge>
        </div>
      )}

      {(filter.lastMessageAt?.from ?? filter.lastMessageAt?.to) && (
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">Last message</p>
          <Badge variant="secondary">
            {filter.lastMessageAt.from && new Date(filter.lastMessageAt.from).toLocaleDateString()}
            {filter.lastMessageAt.from && filter.lastMessageAt.to && " – "}
            {filter.lastMessageAt.to && new Date(filter.lastMessageAt.to).toLocaleDateString()}
          </Badge>
        </div>
      )}
    </div>
  );
}

// ─── Create Saved Filter Sidebar ─────────────────────────────────────────────

export const CreateSavedFilterSidebar = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setSidebarParams, closeSidebar } = useSidebarParams();
  const {
    searchParams: { filter },
    resetFilters,
  } = useTicketSearchParams();

  const { mutateAsync: createSavedFilter } = useMutation(
    trpc.savedFilter.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.savedFilter.all.queryKey(),
        });
      },
    })
  );

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const created = await createSavedFilter({
          title: value.title,
          description: value.description ?? undefined,
          filter,
        });

        toast.success(`Filter "${created?.title}" saved successfully!`);
        await resetFilters();
        closeSidebar();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save filter");
      }
    },
    validators: {
      onSubmit: z.object({
        title: z.string().trim().min(1, "Title is required").max(255),
        description: z.string(),
      }),
    },
  });

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
        <h2 className="text-lg font-medium">Save filter</h2>
      </SidebarHeader>

      <SidebarContent className="scrollbar-gutter-stable flex flex-1 flex-col overflow-y-auto p-3">
        <SidebarGroup>
          <SidebarGroupLabel>Title</SidebarGroupLabel>
          <form.Field name="title">
            {(field) => (
              <div className="space-y-1">
                <Input
                  id="saved-filter-title"
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
                  id="saved-filter-description"
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
          <div className="flex items-center justify-between">
            <SidebarGroupLabel>Filter criteria</SidebarGroupLabel>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="text-muted-foreground h-auto p-0 text-xs"
              onClick={() => {
                void setSidebarParams({ filterSaving: null });
              }}
            >
              Edit
            </Button>
          </div>
          <FilterCriteriaSummary filter={filter} />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-accent/50 flex items-center gap-2 border-t p-3">
        <Button
          type="button"
          variant="outline"
          className="dark:bg-muted/50 dark:hover:bg-muted/70 w-full"
          onClick={() => {
            void setSidebarParams({ filterSaving: null });
          }}
        >
          <ChevronLeft className="mr-1 size-4" />
          Back to filters
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
              : <Plus className="mr-1 size-4" />}
              Save filter
            </Button>
          )}
        </form.Subscribe>
      </SidebarFooter>
    </form>
  );
};
