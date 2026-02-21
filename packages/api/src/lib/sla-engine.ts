import { and, eq, gt, isNotNull, isNull, lt, notInArray } from "drizzle-orm";

import type { Database } from "@help-desk/db";
import type { ConversationPriority } from "@help-desk/db/schema/conversations";
import { member } from "@help-desk/db/schema/auth";
import { conversation } from "@help-desk/db/schema/conversations";
import { notification } from "@help-desk/db/schema/notifications";
import { businessHours, slaPolicy } from "@help-desk/db/schema/sla";

import { loadTicketFacts, runAutomationsForTicket } from "./automation-engine";
import { addBusinessMinutes, DEFAULT_SCHEDULE } from "./business-hours";
import { pusher } from "./pusher";

const WARNING_THRESHOLD = 0.75;
const CLOSED_STATUSES = ["closed", "merged", "resolved"] as const;

/**
 * Computes the SLA first-response deadline for a ticket. Returns `null` if no
 * active policy exists for the given org + priority.
 */
export async function computeDeadline(
  db: Database,
  organizationId: string,
  priority: ConversationPriority,
  createdAt: Date
): Promise<Date | null> {
  const policy = await db.query.slaPolicy.findFirst({
    where: and(
      eq(slaPolicy.organizationId, organizationId),
      eq(slaPolicy.priority, priority),
      eq(slaPolicy.isActive, true)
    ),
  });

  if (!policy) return null;

  const bh = await db.query.businessHours.findFirst({
    where: eq(businessHours.organizationId, organizationId),
  });

  const schedule = bh?.schedule ?? DEFAULT_SCHEDULE;
  const bhEnabled = bh?.isEnabled ?? false;

  return addBusinessMinutes(createdAt, policy.firstResponseMinutes, schedule, bhEnabled);
}

/**
 * Stamps `firstResponseAt` on a conversation if it hasn't been set yet.
 * Idempotent — no-op if already responded.
 */
export async function recordFirstResponse(db: Database, conversationId: string): Promise<void> {
  await db
    .update(conversation)
    .set({ firstResponseAt: new Date() })
    .where(and(eq(conversation.id, conversationId), isNull(conversation.firstResponseAt)));
}

/**
 * Recomputes the SLA deadline when a ticket's priority changes. No-op if the
 * agent has already responded (firstResponseAt is set).
 */
export async function recomputeOnPriorityChange(
  db: Database,
  conversationId: string,
  newPriority: ConversationPriority,
  organizationId: string
): Promise<void> {
  const conv = await db.query.conversation.findFirst({
    where: eq(conversation.id, conversationId),
    columns: { firstResponseAt: true, createdAt: true },
  });

  if (!conv || conv.firstResponseAt) return;

  const deadline = await computeDeadline(db, organizationId, newPriority, conv.createdAt);

  await db
    .update(conversation)
    .set({
      slaFirstResponseDueAt: deadline,
      slaBreachedAt: null,
      slaWarningNotifiedAt: null,
    })
    .where(eq(conversation.id, conversationId));
}

// ── Inline SLA processing (called from polling endpoint) ────────────────

type TicketStub = {
  id: string;
  organizationId: string;
  assignedToId: string | null;
  subject: string | null;
};

async function sendSlaNotification(db: Database, ticket: TicketStub, title: string, body: string) {
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
    const [created] = await db
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

    if (created) {
      await pusher.trigger(`private-user-${userId}`, "notification:new", created);
    }
  }
}

/**
 * Scans for SLA warnings and breaches within a single organization.
 * Safe to call frequently — idempotent guards prevent duplicate processing.
 */
export async function processOrgSla(
  db: Database,
  organizationId: string
): Promise<{ warningCount: number; breachedCount: number }> {
  const now = new Date();
  let warningCount = 0;
  let breachedCount = 0;

  const orgFilter = eq(conversation.organizationId, organizationId);

  // ── 1. Warnings (75 % of SLA window elapsed) ───────────────────────────
  const atRisk = await db.query.conversation.findMany({
    where: and(
      orgFilter,
      isNotNull(conversation.slaFirstResponseDueAt),
      gt(conversation.slaFirstResponseDueAt, now),
      isNull(conversation.firstResponseAt),
      isNull(conversation.slaBreachedAt),
      isNull(conversation.slaWarningNotifiedAt),
      isNull(conversation.deletedAt),
      notInArray(conversation.status, [...CLOSED_STATUSES])
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

  for (const ticket of atRisk) {
    const createdMs = ticket.createdAt.getTime();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const dueMs = ticket.slaFirstResponseDueAt!.getTime();
    const totalWindow = dueMs - createdMs;
    const elapsed = now.getTime() - createdMs;

    if (totalWindow > 0 && elapsed / totalWindow >= WARNING_THRESHOLD) {
      await db
        .update(conversation)
        .set({ slaWarningNotifiedAt: now })
        .where(eq(conversation.id, ticket.id));
      warningCount++;

      try {
        const remaining = Math.max(0, Math.ceil((dueMs - now.getTime()) / 60_000));
        await sendSlaNotification(
          db,
          ticket,
          "SLA Expiring Soon",
          `${remaining} min remaining to respond: ${ticket.subject ?? "(no subject)"}`
        );
      } catch {
        /* notification failure is non-fatal */
      }
    }
  }

  // ── 2. Breaches ─────────────────────────────────────────────────────────
  const breached = await db.query.conversation.findMany({
    where: and(
      orgFilter,
      lt(conversation.slaFirstResponseDueAt, now),
      isNull(conversation.firstResponseAt),
      isNull(conversation.slaBreachedAt),
      isNull(conversation.deletedAt),
      notInArray(conversation.status, [...CLOSED_STATUSES])
    ),
    columns: {
      id: true,
      organizationId: true,
      assignedToId: true,
      subject: true,
    },
  });

  for (const ticket of breached) {
    await db.update(conversation).set({ slaBreachedAt: now }).where(eq(conversation.id, ticket.id));
    breachedCount++;

    try {
      const facts = await loadTicketFacts(db, ticket.id);
      if (facts) {
        await runAutomationsForTicket(db, organizationId, ticket.id, facts, "sla_breached");
      }
    } catch {
      /* automation failure is non-fatal */
    }

    try {
      await sendSlaNotification(
        db,
        ticket,
        "SLA Breached",
        `First response SLA breached for: ${ticket.subject ?? "(no subject)"}`
      );
    } catch {
      /* notification failure is non-fatal */
    }
  }

  return { warningCount, breachedCount };
}
