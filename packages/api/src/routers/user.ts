import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { member, user } from "@help-desk/db/schema/auth";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getAllUsers: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.user.findMany();
  }),

  getOrganizationMembers: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = ctx.session.session.activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No active organization selected",
      });
    }

    const members = await ctx.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, organizationId));

    return members;
  }),
});
