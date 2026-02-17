import type { TopLevelCondition } from "json-rules-engine";
import { and, eq } from "drizzle-orm";
import { Engine } from "json-rules-engine";

import type { Database } from "@help-desk/db";
import type { AutomationAction } from "@help-desk/db/schema/automations";
import { automation } from "@help-desk/db/schema/automations";
import { conversation } from "@help-desk/db/schema/conversations";
import { conversationTag, tag } from "@help-desk/db/schema/tags";

// ─── Facts ────────────────────────────────────────────────────────────────────

export type TicketFacts = {
  mailboxEmail: string | null;
  senderEmail: string;
  subject: string;
  channel: string;
  priority: string;
  status: string;
};

// ─── Evaluate ─────────────────────────────────────────────────────────────────

export async function evaluateAutomations(
  facts: TicketFacts,
  rules: { conditions: unknown; actions: AutomationAction[]; priority: number }[]
): Promise<AutomationAction[]> {
  const engine = new Engine([], { allowUndefinedFacts: true });

  engine.addOperator("contains", (factValue: unknown, compareValue: unknown) => {
    if (typeof factValue !== "string" || typeof compareValue !== "string") return false;
    return factValue.toLowerCase().includes(compareValue.toLowerCase());
  });

  engine.addOperator("notContains", (factValue: unknown, compareValue: unknown) => {
    if (typeof factValue !== "string" || typeof compareValue !== "string") return true;
    return !factValue.toLowerCase().includes(compareValue.toLowerCase());
  });

  engine.addOperator("endsWith", (factValue: unknown, compareValue: unknown) => {
    if (typeof factValue !== "string" || typeof compareValue !== "string") return false;
    return factValue.toLowerCase().endsWith(compareValue.toLowerCase());
  });

  engine.addOperator("beginsWith", (factValue: unknown, compareValue: unknown) => {
    if (typeof factValue !== "string" || typeof compareValue !== "string") return false;
    return factValue.toLowerCase().startsWith(compareValue.toLowerCase());
  });

  for (const rule of rules) {
    engine.addRule({
      conditions: rule.conditions as TopLevelCondition,
      event: {
        type: "automation_matched",
        params: { actions: rule.actions },
      },
      priority: rule.priority,
    });
  }

  const { events } = await engine.run(facts);

  const allActions: AutomationAction[] = [];
  for (const event of events) {
    const actions = event.params?.actions as AutomationAction[] | undefined;
    if (actions) {
      allActions.push(...actions);
    }
  }

  return allActions;
}

// ─── Execute ──────────────────────────────────────────────────────────────────

export async function executeActions(
  db: Database,
  conversationId: string,
  organizationId: string,
  actions: AutomationAction[]
): Promise<void> {
  for (const action of actions) {
    try {
      switch (action.type) {
        case "add_tag": {
          let existingTag = await db.query.tag.findFirst({
            where: and(eq(tag.organizationId, organizationId), eq(tag.name, action.value)),
          });

          if (!existingTag) {
            const [created] = await db
              .insert(tag)
              .values({ organizationId, name: action.value })
              .returning();
            existingTag = created;
          }

          if (existingTag) {
            await db
              .insert(conversationTag)
              .values({ conversationId, tagId: existingTag.id })
              .onConflictDoNothing();
          }
          break;
        }

        case "set_priority": {
          await db
            .update(conversation)
            .set({ priority: action.value as "low" | "normal" | "high" | "urgent" })
            .where(eq(conversation.id, conversationId));
          break;
        }

        case "set_status": {
          await db
            .update(conversation)
            .set({ status: action.value as "open" | "pending" | "resolved" | "closed" })
            .where(eq(conversation.id, conversationId));
          break;
        }

        case "assign_to": {
          await db
            .update(conversation)
            .set({ assignedToId: action.value })
            .where(eq(conversation.id, conversationId));
          break;
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[Automations] Failed to execute action ${action.type}:`, error);
    }
  }
}

// ─── Load & Run ───────────────────────────────────────────────────────────────

export async function runAutomationsForTicket(
  db: Database,
  organizationId: string,
  conversationId: string,
  facts: TicketFacts
): Promise<void> {
  const activeRules = await db.query.automation.findMany({
    where: and(
      eq(automation.organizationId, organizationId),
      eq(automation.isActive, true),
      eq(automation.trigger, "ticket_created")
    ),
  });

  if (activeRules.length === 0) return;

  const rules = activeRules.map((r) => ({
    conditions: r.conditions,
    actions: r.actions,
    priority: r.priority,
  }));

  const matchedActions = await evaluateAutomations(facts, rules);

  if (matchedActions.length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `[Automations] ${matchedActions.length} action(s) matched for conversation ${conversationId}`
    );
    await executeActions(db, conversationId, organizationId, matchedActions);
  }
}
