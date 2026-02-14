import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { savedFilter } from "@help-desk/db/schema/saved-filters";
import { savedFilterFormSchema } from "@help-desk/db/validators/saved-filter-form";
import { ticketFilterSchema } from "@help-desk/db/validators/ticket-filter";

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

export const savedFilterRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    const items = await ctx.db.query.savedFilter.findMany({
      where: eq(savedFilter.organizationId, organizationId),
      orderBy: [desc(savedFilter.createdAt)],
      with: {
        createdBy: true,
      },
    });

    return { items };
  }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    const item = await ctx.db.query.savedFilter.findFirst({
      where: and(eq(savedFilter.id, input.id), eq(savedFilter.organizationId, organizationId)),
      with: {
        createdBy: true,
      },
    });

    if (!item) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Saved filter not found" });
    }

    return item;
  }),

  create: protectedProcedure
    .input(
      savedFilterFormSchema.extend({
        filter: ticketFilterSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const [created] = await ctx.db
        .insert(savedFilter)
        .values({
          organizationId,
          createdById: ctx.session.user.id,
          title: input.title,
          description: input.description ?? null,
          filter: input.filter,
        })
        .returning();

      return created;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const existing = await ctx.db.query.savedFilter.findFirst({
        where: and(eq(savedFilter.id, input.id), eq(savedFilter.organizationId, organizationId)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Saved filter not found" });
      }

      await ctx.db
        .delete(savedFilter)
        .where(and(eq(savedFilter.id, input.id), eq(savedFilter.organizationId, organizationId)));

      return { success: true };
    }),
});
