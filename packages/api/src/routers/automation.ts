import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { automation } from "@help-desk/db/schema/automations";

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

const automationActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("add_tag"), value: z.string().min(1) }),
  z.object({ type: z.literal("remove_tag"), value: z.string().min(1) }),
  z.object({ type: z.literal("set_priority"), value: z.enum(["low", "normal", "high", "urgent"]) }),
  z.object({
    type: z.literal("set_status"),
    value: z.enum(["open", "pending", "resolved", "closed"]),
  }),
  z.object({ type: z.literal("assign_to"), value: z.string().min(1) }),
]);

const createAutomationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  trigger: z
    .enum(["ticket_created", "ticket_replied", "status_changed", "sla_breached"])
    .default("ticket_created"),
  conditionsTree: z.record(z.string(), z.any()),
  conditions: z.record(z.string(), z.any()),
  actions: z.array(automationActionSchema).min(1, "At least one action is required"),
  isActive: z.boolean().default(true),
  priority: z.number().int().default(0),
});

export const automationRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    const items = await ctx.db.query.automation.findMany({
      where: eq(automation.organizationId, organizationId),
      orderBy: [desc(automation.createdAt)],
    });

    return { items };
  }),

  create: protectedProcedure.input(createAutomationSchema).mutation(async ({ ctx, input }) => {
    const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

    const [created] = await ctx.db
      .insert(automation)
      .values({
        organizationId,
        name: input.name,
        description: input.description,
        trigger: input.trigger,
        conditionsTree: input.conditionsTree,
        conditions: input.conditions,
        actions: input.actions,
        isActive: input.isActive,
        priority: input.priority,
      })
      .returning();

    return created;
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        trigger: z
          .enum(["ticket_created", "ticket_replied", "status_changed", "sla_breached"])
          .optional(),
        conditionsTree: z.record(z.string(), z.any()).optional(),
        conditions: z.record(z.string(), z.any()).optional(),
        actions: z.array(automationActionSchema).min(1).optional(),
        isActive: z.boolean().optional(),
        priority: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const existing = await ctx.db.query.automation.findFirst({
        where: and(eq(automation.id, input.id), eq(automation.organizationId, organizationId)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Automation not found" });
      }

      const { id: _id, ...updateData } = input;
      const setData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          setData[key] = value;
        }
      }

      const [updated] = await ctx.db
        .update(automation)
        .set(setData)
        .where(and(eq(automation.id, input.id), eq(automation.organizationId, organizationId)))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const existing = await ctx.db.query.automation.findFirst({
        where: and(eq(automation.id, input.id), eq(automation.organizationId, organizationId)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Automation not found" });
      }

      await ctx.db
        .delete(automation)
        .where(and(eq(automation.id, input.id), eq(automation.organizationId, organizationId)));

      return { success: true };
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = requireActiveOrganizationId(ctx.session.session.activeOrganizationId);

      const existing = await ctx.db.query.automation.findFirst({
        where: and(eq(automation.id, input.id), eq(automation.organizationId, organizationId)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Automation not found" });
      }

      const [updated] = await ctx.db
        .update(automation)
        .set({ isActive: !existing.isActive })
        .where(and(eq(automation.id, input.id), eq(automation.organizationId, organizationId)))
        .returning();

      return updated;
    }),
});
