import { TRPCError } from "@trpc/server";
import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { notification } from "@help-desk/db/schema/notifications";

import { createTRPCRouter, protectedProcedure } from "../trpc";

function getOrganizationId(ctx: {
  session: { session: { activeOrganizationId?: string | null } };
}) {
  const organizationId = ctx.session.session.activeOrganizationId;
  if (!organizationId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No active organization selected",
    });
  }
  return organizationId;
}

export const notificationRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const organizationId = getOrganizationId(ctx);
      const { limit = 20, offset = 0 } = input ?? {};

      const items = await ctx.db.query.notification.findMany({
        where: and(
          eq(notification.userId, ctx.session.user.id),
          eq(notification.organizationId, organizationId)
        ),
        orderBy: [desc(notification.createdAt)],
        limit,
        offset,
      });

      return { items };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = getOrganizationId(ctx);

    const [result] = await ctx.db
      .select({ count: count() })
      .from(notification)
      .where(
        and(
          eq(notification.userId, ctx.session.user.id),
          eq(notification.organizationId, organizationId),
          eq(notification.read, false)
        )
      );

    return { count: result?.count ?? 0 };
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = getOrganizationId(ctx);

      await ctx.db
        .update(notification)
        .set({ read: true })
        .where(
          and(
            eq(notification.id, input.id),
            eq(notification.userId, ctx.session.user.id),
            eq(notification.organizationId, organizationId)
          )
        );

      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const organizationId = getOrganizationId(ctx);

    await ctx.db
      .update(notification)
      .set({ read: true })
      .where(
        and(
          eq(notification.userId, ctx.session.user.id),
          eq(notification.organizationId, organizationId),
          eq(notification.read, false)
        )
      );

    return { success: true };
  }),
});
