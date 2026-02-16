import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { conversation } from "@help-desk/db/schema/conversations";
import { contactTag, conversationTag, tag } from "@help-desk/db/schema/tags";

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

export const tagRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    const items = await ctx.db.query.tag.findMany({
      where: eq(tag.organizationId, organizationId),
      orderBy: [desc(tag.createdAt)],
    });

    return { items };
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        color: z.string().min(1, "Color is required").default("#7C8187"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      // Check for duplicate name within the organization
      const existing = await ctx.db.query.tag.findFirst({
        where: and(eq(tag.organizationId, organizationId), eq(tag.name, input.name)),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A tag with this name already exists",
        });
      }

      const [created] = await ctx.db
        .insert(tag)
        .values({
          organizationId,
          name: input.name,
          color: input.color,
        })
        .returning();

      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required").optional(),
        color: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const existing = await ctx.db.query.tag.findFirst({
        where: and(eq(tag.id, input.id), eq(tag.organizationId, organizationId)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
      }

      // Check for duplicate name if name is being changed
      if (input.name && input.name !== existing.name) {
        const duplicate = await ctx.db.query.tag.findFirst({
          where: and(eq(tag.organizationId, organizationId), eq(tag.name, input.name)),
        });

        if (duplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A tag with this name already exists",
          });
        }
      }

      const [updated] = await ctx.db
        .update(tag)
        .set({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.color !== undefined && { color: input.color }),
        })
        .where(and(eq(tag.id, input.id), eq(tag.organizationId, organizationId)))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      // Verify ownership
      const existing = await ctx.db.query.tag.findFirst({
        where: and(eq(tag.id, input.id), eq(tag.organizationId, organizationId)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tag not found" });
      }

      // Explicitly remove junction rows before deleting the tag.
      // This guards against the DB missing ON DELETE CASCADE (e.g. if the
      // constraint wasn't applied via migration) and prevents orphaned rows
      // from causing stale filter results.
      await ctx.db.transaction(async (tx) => {
        await tx.delete(conversationTag).where(eq(conversationTag.tagId, input.id));
        await tx.delete(contactTag).where(eq(contactTag.tagId, input.id));
        await tx
          .delete(tag)
          .where(and(eq(tag.id, input.id), eq(tag.organizationId, organizationId)));
      });

      return { success: true };
    }),

  setConversationTags: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        tagIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const conv = await ctx.db.query.conversation.findFirst({
        where: and(
          eq(conversation.id, input.conversationId),
          eq(conversation.organizationId, organizationId)
        ),
        columns: { id: true },
      });

      if (!conv) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
      }

      if (input.tagIds.length > 0) {
        const validTags = await ctx.db.query.tag.findMany({
          where: and(eq(tag.organizationId, organizationId), inArray(tag.id, input.tagIds)),
          columns: { id: true },
        });

        if (validTags.length !== input.tagIds.length) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "One or more tags are invalid" });
        }
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .delete(conversationTag)
          .where(eq(conversationTag.conversationId, input.conversationId));

        if (input.tagIds.length > 0) {
          await tx.insert(conversationTag).values(
            input.tagIds.map((tagId) => ({
              conversationId: input.conversationId,
              tagId,
            }))
          );
        }
      });

      return { success: true };
    }),
});
