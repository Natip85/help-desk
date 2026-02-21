import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { conversationPriority } from "@help-desk/db/schema/conversations";
import { businessHours, slaPolicy } from "@help-desk/db/schema/sla";

import { DEFAULT_SCHEDULE } from "../lib/business-hours";
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

const dayScheduleSchema = z.object({
  dayOfWeek: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
  isEnabled: z.boolean(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const slaRouter = createTRPCRouter({
  getBusinessHours: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    const existing = await ctx.db.query.businessHours.findFirst({
      where: eq(businessHours.organizationId, organizationId),
    });

    if (existing) return existing;

    return {
      id: null,
      organizationId,
      schedule: DEFAULT_SCHEDULE,
      isEnabled: false,
      createdAt: null,
      updatedAt: null,
    };
  }),

  updateBusinessHours: protectedProcedure
    .input(
      z.object({
        isEnabled: z.boolean(),
        schedule: z.array(dayScheduleSchema).length(7),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const existing = await ctx.db.query.businessHours.findFirst({
        where: eq(businessHours.organizationId, organizationId),
      });

      if (existing) {
        const [updated] = await ctx.db
          .update(businessHours)
          .set({ isEnabled: input.isEnabled, schedule: input.schedule })
          .where(eq(businessHours.id, existing.id))
          .returning();
        return updated;
      }

      const [created] = await ctx.db
        .insert(businessHours)
        .values({
          organizationId,
          isEnabled: input.isEnabled,
          schedule: input.schedule,
        })
        .returning();
      return created;
    }),

  getPolicies: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    return ctx.db.query.slaPolicy.findMany({
      where: eq(slaPolicy.organizationId, organizationId),
    });
  }),

  upsertPolicy: protectedProcedure
    .input(
      z.object({
        priority: z.enum(conversationPriority),
        firstResponseMinutes: z.number().int().min(1),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const existing = await ctx.db.query.slaPolicy.findFirst({
        where: and(
          eq(slaPolicy.organizationId, organizationId),
          eq(slaPolicy.priority, input.priority)
        ),
      });

      if (existing) {
        const [updated] = await ctx.db
          .update(slaPolicy)
          .set({
            firstResponseMinutes: input.firstResponseMinutes,
            isActive: input.isActive,
          })
          .where(eq(slaPolicy.id, existing.id))
          .returning();
        return updated;
      }

      const [created] = await ctx.db
        .insert(slaPolicy)
        .values({
          organizationId,
          priority: input.priority,
          firstResponseMinutes: input.firstResponseMinutes,
          isActive: input.isActive,
        })
        .returning();
      return created;
    }),
});
