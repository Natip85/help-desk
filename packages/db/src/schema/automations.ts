import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, text } from "drizzle-orm/pg-core";

import * as Utils from "../utils";
import { organization } from "./auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AutomationAction =
  | { type: "add_tag"; value: string }
  | { type: "remove_tag"; value: string }
  | { type: "set_priority"; value: string }
  | { type: "set_status"; value: string }
  | { type: "assign_to"; value: string };

export type AutomationTrigger = "ticket_created" | "ticket_replied" | "status_changed";

// ─── Automation ───────────────────────────────────────────────────────────────

export const automation = Utils.createTable(
  "automation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    trigger: text("trigger").$type<AutomationTrigger>().notNull().default("ticket_created"),
    conditionsTree: jsonb("conditions_tree").notNull(),
    conditions: jsonb("conditions").notNull(),
    actions: jsonb("actions").$type<AutomationAction[]>().notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    priority: integer("priority").default(0).notNull(),
    ...Utils.createUpdateTimestamps,
  },
  (t) => [
    index("automation_org_idx").on(t.organizationId),
    index("automation_org_active_idx").on(t.organizationId, t.isActive),
  ]
);

export type Automation = typeof automation.$inferSelect;
export type NewAutomation = typeof automation.$inferInsert;

// ─── Relations ────────────────────────────────────────────────────────────────

export const automationRelations = relations(automation, ({ one }) => ({
  organization: one(organization, {
    fields: [automation.organizationId],
    references: [organization.id],
  }),
}));
