import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { and, eq, gt, isNotNull, isNull, lt, notInArray } from "drizzle-orm";

import { loadTicketFacts, runAutomationsForTicket } from "@help-desk/api/lib/automation-engine";
import { pusher } from "@help-desk/api/lib/pusher";
import { db } from "@help-desk/db";
import { member } from "@help-desk/db/schema/auth";
import { conversation } from "@help-desk/db/schema/conversations";
import { notification } from "@help-desk/db/schema/notifications";
import { env } from "@help-desk/env/server";

const WARNING_THRESHOLD = 0.75;

async function sendSlaNotification(
  ticket: {
    id: string;
    organizationId: string;
    assignedToId: string | null;
    subject: string | null;
  },
  title: string,
  body: string
) {
  const targetUserIds: string[] = [];

  if (ticket.assignedToId) {
    targetUserIds.push(ticket.assignedToId);
  } else {
    const members = await db.query.member.findMany({
      where: eq(member.organizationId, ticket.organizationId),
      columns: { userId: true },
    });
    targetUserIds.push(...members.map((m) => m.userId));
  }

  for (const userId of targetUserIds) {
    const [newNotification] = await db
      .insert(notification)
      .values({
        userId,
        organizationId: ticket.organizationId,
        type: "sla_breach_warning",
        title,
        body,
        data: { conversationId: ticket.id },
      })
      .returning();

    if (newNotification) {
      await pusher.trigger(`private-user-${userId}`, "notification:new", newNotification);
    }
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // ── 1. Warn tickets approaching their deadline (75% elapsed) ──────────
    const atRiskTickets = await db.query.conversation.findMany({
      where: and(
        isNotNull(conversation.slaFirstResponseDueAt),
        gt(conversation.slaFirstResponseDueAt, now),
        isNull(conversation.firstResponseAt),
        isNull(conversation.slaBreachedAt),
        isNull(conversation.slaWarningNotifiedAt),
        isNull(conversation.deletedAt),
        notInArray(conversation.status, ["closed", "merged", "resolved"])
      ),
      columns: {
        id: true,
        organizationId: true,
        assignedToId: true,
        subject: true,
        createdAt: true,
        slaFirstResponseDueAt: true,
      },
    });

    let warningCount = 0;

    for (const ticket of atRiskTickets) {
      const created = ticket.createdAt.getTime();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const due = ticket.slaFirstResponseDueAt!.getTime();
      const totalWindow = due - created;
      const elapsed = now.getTime() - created;

      if (totalWindow > 0 && elapsed / totalWindow >= WARNING_THRESHOLD) {
        await db
          .update(conversation)
          .set({ slaWarningNotifiedAt: now })
          .where(eq(conversation.id, ticket.id));

        warningCount++;

        try {
          const remaining = Math.max(0, Math.ceil((due - now.getTime()) / 60_000));
          await sendSlaNotification(
            ticket,
            "SLA Expiring Soon",
            `${remaining} min remaining to respond: ${ticket.subject ?? "(no subject)"}`
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`[SLA] Warning notification failed for ticket ${ticket.id}:`, error);
        }
      }
    }

    // ── 2. Detect breached tickets ────────────────────────────────────────
    const breachedTickets = await db.query.conversation.findMany({
      where: and(
        lt(conversation.slaFirstResponseDueAt, now),
        isNull(conversation.firstResponseAt),
        isNull(conversation.slaBreachedAt),
        isNull(conversation.deletedAt),
        notInArray(conversation.status, ["closed", "merged", "resolved"])
      ),
      columns: {
        id: true,
        organizationId: true,
        assignedToId: true,
        subject: true,
      },
    });

    let breachedCount = 0;

    for (const ticket of breachedTickets) {
      await db
        .update(conversation)
        .set({ slaBreachedAt: now })
        .where(eq(conversation.id, ticket.id));

      breachedCount++;

      try {
        const facts = await loadTicketFacts(db, ticket.id);
        if (facts) {
          await runAutomationsForTicket(
            db,
            ticket.organizationId,
            ticket.id,
            facts,
            "sla_breached"
          );
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`[SLA] Automation failed for ticket ${ticket.id}:`, error);
      }

      try {
        await sendSlaNotification(
          ticket,
          "SLA Breached",
          `First response SLA breached for: ${ticket.subject ?? "(no subject)"}`
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`[SLA] Notification failed for ticket ${ticket.id}:`, error);
      }
    }

    // eslint-disable-next-line no-console
    console.log(`[cron] SLA check: ${warningCount} warning(s), ${breachedCount} breach(es)`);

    return NextResponse.json({ success: true, warningCount, breachedCount });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[cron] sla-check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
