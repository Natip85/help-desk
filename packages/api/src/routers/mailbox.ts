import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { mailbox } from "@help-desk/db/schema/mailboxes";

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

export const mailboxRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    const items = await ctx.db.query.mailbox.findMany({
      where: eq(mailbox.organizationId, organizationId),
      orderBy: [desc(mailbox.isDefault), desc(mailbox.createdAt)],
    });

    return { items };
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        isDefault: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      return await ctx.db.transaction(async (tx) => {
        // If setting as default, unset any existing default first
        if (input.isDefault) {
          await tx
            .update(mailbox)
            .set({ isDefault: false })
            .where(and(eq(mailbox.organizationId, organizationId), eq(mailbox.isDefault, true)));
        }

        const [created] = await tx
          .insert(mailbox)
          .values({
            organizationId,
            name: input.name,
            email: input.email.toLowerCase(),
            isDefault: input.isDefault,
          })
          .returning();

        return created;
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      // Verify ownership
      const existing = await ctx.db.query.mailbox.findFirst({
        where: and(eq(mailbox.id, input.id), eq(mailbox.organizationId, organizationId)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mailbox not found" });
      }

      return await ctx.db.transaction(async (tx) => {
        // If setting as default, unset any existing default first
        if (input.isDefault) {
          await tx
            .update(mailbox)
            .set({ isDefault: false })
            .where(and(eq(mailbox.organizationId, organizationId), eq(mailbox.isDefault, true)));
        }

        const [updated] = await tx
          .update(mailbox)
          .set({
            ...(input.name !== undefined && { name: input.name }),
            ...(input.email !== undefined && { email: input.email.toLowerCase() }),
            ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
          })
          .where(and(eq(mailbox.id, input.id), eq(mailbox.organizationId, organizationId)))
          .returning();

        return updated;
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      // Verify ownership
      const existing = await ctx.db.query.mailbox.findFirst({
        where: and(eq(mailbox.id, input.id), eq(mailbox.organizationId, organizationId)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mailbox not found" });
      }

      // Prevent deleting the default mailbox
      if (existing.isDefault) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete the default mailbox. Set another mailbox as default first.",
        });
      }

      await ctx.db
        .delete(mailbox)
        .where(and(eq(mailbox.id, input.id), eq(mailbox.organizationId, organizationId)));

      return { success: true };
    }),

  setDefault: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      // Verify ownership
      const existing = await ctx.db.query.mailbox.findFirst({
        where: and(eq(mailbox.id, input.id), eq(mailbox.organizationId, organizationId)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mailbox not found" });
      }

      await ctx.db.transaction(async (tx) => {
        // Unset current default
        await tx
          .update(mailbox)
          .set({ isDefault: false })
          .where(and(eq(mailbox.organizationId, organizationId), eq(mailbox.isDefault, true)));

        // Set new default
        await tx
          .update(mailbox)
          .set({ isDefault: true })
          .where(and(eq(mailbox.id, input.id), eq(mailbox.organizationId, organizationId)));
      });

      return { success: true };
    }),
});
