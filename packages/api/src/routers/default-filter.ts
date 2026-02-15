import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { defaultFilter } from "@help-desk/db/schema/default-filters";
import { filterTypeEnum } from "@help-desk/db/validators/default-filter";

import { createTRPCRouter, protectedProcedure } from "../trpc";

function requireActiveOrganizationId(activeOrganizationId: string | null | undefined) {
  if (!activeOrganizationId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No active organization selected",
    });
  }
  return activeOrganizationId;
}

// ─── Seed Data ──────────────────────────────────────────────────────────────

const SYSTEM_FILTERS = [
  {
    name: "priority",
    displayName: "Priority",
    type: "select" as const,
    isSystem: true,
    position: 0,
    options: [
      { value: "low", label: "Low", position: 0 },
      { value: "normal", label: "Normal", position: 1 },
      { value: "high", label: "High", position: 2 },
      { value: "urgent", label: "Urgent", position: 3 },
    ],
  },
  {
    name: "status",
    displayName: "Status",
    type: "select" as const,
    isSystem: true,
    position: 1,
    options: [
      { value: "open", label: "Open", position: 0 },
      { value: "pending", label: "Pending", position: 1 },
      { value: "resolved", label: "Resolved", position: 2 },
      { value: "closed", label: "Closed", position: 3 },
    ],
  },
  {
    name: "channel",
    displayName: "Channel",
    type: "select" as const,
    isSystem: true,
    position: 2,
    options: [
      { value: "email", label: "Email", position: 0 },
      { value: "web", label: "Web", position: 1 },
      { value: "api", label: "API", position: 2 },
    ],
  },
];

// ─── Input Schemas ──────────────────────────────────────────────────────────

const filterOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  position: z.number().int().min(0),
});

const createFilterInput = z.object({
  name: z.string().min(1, "Name is required").max(100),
  displayName: z.string().min(1, "Display name is required").max(255),
  type: filterTypeEnum.default("multi-select"),
  options: z.array(filterOptionSchema),
});

const updateFilterInput = z.object({
  id: z.string(),
  displayName: z.string().min(1, "Display name is required").max(255).optional(),
  name: z.string().min(1).max(100).optional(),
  type: filterTypeEnum.optional(),
  options: z.array(filterOptionSchema).optional(),
});

// ─── Router ─────────────────────────────────────────────────────────────────

export const defaultFilterRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    let items = await ctx.db.query.defaultFilter.findMany({
      where: eq(defaultFilter.organizationId, organizationId),
      orderBy: [asc(defaultFilter.position), asc(defaultFilter.createdAt)],
    });

    // Determine which system filters should exist
    const systemNames = new Set(SYSTEM_FILTERS.map((f) => f.name));
    const existingNames = new Set(items.map((i) => i.name));

    // Remove stale system filters that are no longer defined
    const staleIds = items.filter((i) => i.isSystem && !systemNames.has(i.name)).map((i) => i.id);

    if (staleIds.length > 0) {
      await ctx.db
        .delete(defaultFilter)
        .where(
          and(eq(defaultFilter.organizationId, organizationId), inArray(defaultFilter.id, staleIds))
        );
    }

    // Seed missing system filters
    const missingFilters = SYSTEM_FILTERS.filter((f) => !existingNames.has(f.name));

    if (staleIds.length > 0 || missingFilters.length > 0) {
      if (missingFilters.length > 0) {
        const seedValues = missingFilters.map((f) => ({
          organizationId,
          name: f.name,
          displayName: f.displayName,
          type: f.type,
          options: f.options,
          isSystem: f.isSystem,
          position: f.position,
        }));

        await ctx.db.insert(defaultFilter).values(seedValues);
      }

      items = await ctx.db.query.defaultFilter.findMany({
        where: eq(defaultFilter.organizationId, organizationId),
        orderBy: [asc(defaultFilter.position), asc(defaultFilter.createdAt)],
      });
    }

    return { items };
  }),

  create: protectedProcedure.input(createFilterInput).mutation(async ({ ctx, input }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    // Check for duplicate name within the organization
    const existing = await ctx.db.query.defaultFilter.findFirst({
      where: and(
        eq(defaultFilter.organizationId, organizationId),
        eq(defaultFilter.name, input.name)
      ),
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A filter with this name already exists",
      });
    }

    // Get the next position
    const allFilters = await ctx.db.query.defaultFilter.findMany({
      where: eq(defaultFilter.organizationId, organizationId),
      columns: { position: true },
    });
    const maxPosition = allFilters.reduce((max, f) => Math.max(max, f.position), -1);

    const [created] = await ctx.db
      .insert(defaultFilter)
      .values({
        organizationId,
        name: input.name,
        displayName: input.displayName,
        type: input.type,
        options: input.options,
        isSystem: false,
        position: maxPosition + 1,
      })
      .returning();

    return created;
  }),

  update: protectedProcedure.input(updateFilterInput).mutation(async ({ ctx, input }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    const existing = await ctx.db.query.defaultFilter.findFirst({
      where: and(eq(defaultFilter.id, input.id), eq(defaultFilter.organizationId, organizationId)),
    });

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Filter not found" });
    }

    if (existing.isSystem) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "System filters cannot be edited",
      });
    }

    // Check for duplicate name if name is being changed
    if (input.name && input.name !== existing.name) {
      const duplicate = await ctx.db.query.defaultFilter.findFirst({
        where: and(
          eq(defaultFilter.organizationId, organizationId),
          eq(defaultFilter.name, input.name)
        ),
      });

      if (duplicate) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A filter with this name already exists",
        });
      }
    }

    const [updated] = await ctx.db
      .update(defaultFilter)
      .set({
        ...(input.displayName !== undefined && { displayName: input.displayName }),
        ...(input.name !== undefined && { name: input.name }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.options !== undefined && { options: input.options }),
      })
      .where(and(eq(defaultFilter.id, input.id), eq(defaultFilter.organizationId, organizationId)))
      .returning();

    return updated;
  }),

  reorder: protectedProcedure
    .input(z.object({ orderedIds: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      await ctx.db.transaction(async (tx) => {
        for (const [i, id] of input.orderedIds.entries()) {
          await tx
            .update(defaultFilter)
            .set({ position: i })
            .where(and(eq(defaultFilter.id, id), eq(defaultFilter.organizationId, organizationId)));
        }
      });

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const existing = await ctx.db.query.defaultFilter.findFirst({
        where: and(
          eq(defaultFilter.id, input.id),
          eq(defaultFilter.organizationId, organizationId)
        ),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Filter not found" });
      }

      if (existing.isSystem) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete a system filter",
        });
      }

      await ctx.db
        .delete(defaultFilter)
        .where(
          and(eq(defaultFilter.id, input.id), eq(defaultFilter.organizationId, organizationId))
        );

      return { success: true };
    }),
});
