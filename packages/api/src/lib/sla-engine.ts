import { and, eq, isNull } from "drizzle-orm";

import type { Database } from "@help-desk/db";
import type { ConversationPriority } from "@help-desk/db/schema/conversations";
import { conversation } from "@help-desk/db/schema/conversations";
import { businessHours, slaPolicy } from "@help-desk/db/schema/sla";

import { addBusinessMinutes, DEFAULT_SCHEDULE } from "./business-hours";

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
