import { TRPCError } from "@trpc/server";
import { and, count, eq, gte, isNull, lt, sql } from "drizzle-orm";

import { conversation } from "@help-desk/db/schema/conversations";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const dashboardRouter = createTRPCRouter({
  todayTrends: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = ctx.session.session.activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No active organization selected",
      });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const orgAndNotDeleted = and(
      eq(conversation.organizationId, organizationId),
      isNull(conversation.deletedAt)
    );

    const hourCol = sql<number>`extract(hour from ${conversation.createdAt})`;

    const [todayHourly, yesterdayHourly, summaryRows] = await Promise.all([
      ctx.db
        .select({ hour: hourCol.as("hour"), count: count().as("cnt") })
        .from(conversation)
        .where(
          and(
            orgAndNotDeleted,
            gte(conversation.createdAt, todayStart),
            lt(conversation.createdAt, tomorrowStart)
          )
        )
        .groupBy(sql`extract(hour from ${conversation.createdAt})`),

      ctx.db
        .select({ hour: hourCol.as("hour"), count: count().as("cnt") })
        .from(conversation)
        .where(
          and(
            orgAndNotDeleted,
            gte(conversation.createdAt, yesterdayStart),
            lt(conversation.createdAt, todayStart)
          )
        )
        .groupBy(sql`extract(hour from ${conversation.createdAt})`),

      ctx.db
        .select({
          received: count().as("received"),
          resolved:
            sql<number>`count(*) filter (where ${conversation.status} in ('resolved', 'closed'))`.as(
              "resolved"
            ),
          avgFirstResponseMs: sql<number | null>`
            avg(extract(epoch from (${conversation.firstResponseAt} - ${conversation.createdAt})) * 1000)
            filter (where ${conversation.firstResponseAt} is not null)
          `.as("avg_first_response_ms"),
          totalResolved:
            sql<number>`count(*) filter (where ${conversation.status} in ('resolved', 'closed'))`.as(
              "total_resolved"
            ),
          resolvedWithinSla: sql<number>`
            count(*) filter (where ${conversation.status} in ('resolved', 'closed') and ${conversation.slaBreachedAt} is null)
          `.as("resolved_within_sla"),
        })
        .from(conversation)
        .where(
          and(
            orgAndNotDeleted,
            gte(conversation.createdAt, todayStart),
            lt(conversation.createdAt, tomorrowStart)
          )
        ),
    ]);

    const todayMap = new Map(todayHourly.map((r) => [Number(r.hour), r.count]));
    const yesterdayMap = new Map(yesterdayHourly.map((r) => [Number(r.hour), r.count]));

    const hourly = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      today: todayMap.get(i) ?? 0,
      yesterday: yesterdayMap.get(i) ?? 0,
    }));

    const stats = summaryRows[0] ?? {
      received: 0,
      resolved: 0,
      avgFirstResponseMs: null,
      totalResolved: 0,
      resolvedWithinSla: 0,
    };
    const avgMs = stats.avgFirstResponseMs;
    const totalResolved = Number(stats.totalResolved);
    const resolvedWithinSla = Number(stats.resolvedWithinSla);

    return {
      hourly,
      summary: {
        received: stats.received,
        resolved: Number(stats.resolved),
        avgFirstResponse: formatDuration(avgMs),
        resolutionWithinSla:
          totalResolved > 0 ? Math.round((resolvedWithinSla / totalResolved) * 10000) / 100 : 0,
      },
    };
  }),
  ticketBreakdown: protectedProcedure.query(async ({ ctx }) => {
    const organizationId = ctx.session.session.activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "No active organization selected",
      });
    }

    const orgAndNotDeleted = and(
      eq(conversation.organizationId, organizationId),
      isNull(conversation.deletedAt)
    );

    const [byStatus, byPriority] = await Promise.all([
      ctx.db
        .select({ status: conversation.status, count: count().as("cnt") })
        .from(conversation)
        .where(orgAndNotDeleted)
        .groupBy(conversation.status),
      ctx.db
        .select({ priority: conversation.priority, count: count().as("cnt") })
        .from(conversation)
        .where(orgAndNotDeleted)
        .groupBy(conversation.priority),
    ]);

    return { byStatus, byPriority };
  }),
});

function formatDuration(ms: number | null): string {
  if (ms == null || isNaN(ms)) return "N/A";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  return parts.join(" ");
}
