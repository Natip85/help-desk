import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { cannedResponse, cannedResponseFolder } from "@help-desk/db/schema/canned-responses";
import { cannedResponseFormSchema } from "@help-desk/db/validators/canned-response-form";

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

export const cannedResponseRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        folderId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const conditions = [eq(cannedResponse.organizationId, organizationId)];

      if (input.folderId) {
        conditions.push(eq(cannedResponse.folderId, input.folderId));
      } else {
        conditions.push(isNull(cannedResponse.folderId));
      }

      const items = await ctx.db.query.cannedResponse.findMany({
        where: and(...conditions),
        orderBy: [desc(cannedResponse.createdAt)],
      });

      return { items };
    }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    const item = await ctx.db.query.cannedResponse.findFirst({
      where: and(
        eq(cannedResponse.id, input.id),
        eq(cannedResponse.organizationId, organizationId)
      ),
    });

    if (!item) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Canned response not found" });
    }

    return item;
  }),

  create: protectedProcedure.input(cannedResponseFormSchema).mutation(async ({ ctx, input }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    const [created] = await ctx.db
      .insert(cannedResponse)
      .values({
        organizationId,
        name: input.name,
        body: input.body,
        folderId: input.folderId ?? null,
        createdById: ctx.session.user.id,
      })
      .returning();

    return created;
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        body: z.string().min(1).optional(),
        folderId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const existing = await ctx.db.query.cannedResponse.findFirst({
        where: and(
          eq(cannedResponse.id, input.id),
          eq(cannedResponse.organizationId, organizationId)
        ),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Canned response not found" });
      }

      const [updated] = await ctx.db
        .update(cannedResponse)
        .set({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.body !== undefined && { body: input.body }),
          ...(input.folderId !== undefined && { folderId: input.folderId }),
        })
        .where(
          and(eq(cannedResponse.id, input.id), eq(cannedResponse.organizationId, organizationId))
        )
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const existing = await ctx.db.query.cannedResponse.findFirst({
        where: and(
          eq(cannedResponse.id, input.id),
          eq(cannedResponse.organizationId, organizationId)
        ),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Canned response not found" });
      }

      await ctx.db
        .delete(cannedResponse)
        .where(
          and(eq(cannedResponse.id, input.id), eq(cannedResponse.organizationId, organizationId))
        );

      return { success: true };
    }),

  folderList: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    const items = await ctx.db.query.cannedResponseFolder.findMany({
      where: eq(cannedResponseFolder.organizationId, organizationId),
      orderBy: [desc(cannedResponseFolder.createdAt)],
    });

    return { items };
  }),

  folderCreate: protectedProcedure
    .input(z.object({ name: z.string().min(1, "Name is required") }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const [created] = await ctx.db
        .insert(cannedResponseFolder)
        .values({
          organizationId,
          name: input.name,
        })
        .returning();

      return created;
    }),

  folderUpdate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const existing = await ctx.db.query.cannedResponseFolder.findFirst({
        where: and(
          eq(cannedResponseFolder.id, input.id),
          eq(cannedResponseFolder.organizationId, organizationId)
        ),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Folder not found" });
      }

      const [updated] = await ctx.db
        .update(cannedResponseFolder)
        .set({ name: input.name })
        .where(
          and(
            eq(cannedResponseFolder.id, input.id),
            eq(cannedResponseFolder.organizationId, organizationId)
          )
        )
        .returning();

      return updated;
    }),

  folderDelete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const existing = await ctx.db.query.cannedResponseFolder.findFirst({
        where: and(
          eq(cannedResponseFolder.id, input.id),
          eq(cannedResponseFolder.organizationId, organizationId)
        ),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Folder not found" });
      }

      await ctx.db
        .delete(cannedResponseFolder)
        .where(
          and(
            eq(cannedResponseFolder.id, input.id),
            eq(cannedResponseFolder.organizationId, organizationId)
          )
        );

      return { success: true };
    }),
});
