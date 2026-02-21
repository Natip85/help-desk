import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, text, unique } from "drizzle-orm/pg-core";

import * as Utils from "../utils";
import { organization } from "./auth";
import { conversationPriorityEnum } from "./conversations";

export type DaySchedule = {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  isEnabled: boolean;
  startTime: string;
  endTime: string;
};

export const businessHours = Utils.createTable(
  "business_hours",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" })
      .unique(),
    schedule: jsonb("schedule").$type<DaySchedule[]>().notNull(),
    isEnabled: boolean("is_enabled").default(false).notNull(),
    ...Utils.createUpdateTimestamps,
  },
  (t) => [index("business_hours_org_idx").on(t.organizationId)]
);

export type BusinessHours = typeof businessHours.$inferSelect;
export type NewBusinessHours = typeof businessHours.$inferInsert;

export const slaPolicy = Utils.createTable(
  "sla_policy",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    priority: conversationPriorityEnum("priority").notNull(),
    firstResponseMinutes: integer("first_response_minutes").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...Utils.createUpdateTimestamps,
  },
  (t) => [
    unique("sla_policy_org_priority_uniq").on(t.organizationId, t.priority),
    index("sla_policy_org_idx").on(t.organizationId),
  ]
);

export type SlaPolicy = typeof slaPolicy.$inferSelect;
export type NewSlaPolicy = typeof slaPolicy.$inferInsert;

export const businessHoursRelations = relations(businessHours, ({ one }) => ({
  organization: one(organization, {
    fields: [businessHours.organizationId],
    references: [organization.id],
  }),
}));

export const slaPolicyRelations = relations(slaPolicy, ({ one }) => ({
  organization: one(organization, {
    fields: [slaPolicy.organizationId],
    references: [organization.id],
  }),
}));
