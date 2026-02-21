import { relations } from "drizzle-orm";
import { boolean, index, jsonb, pgEnum, text, timestamp } from "drizzle-orm/pg-core";

import * as Utils from "../utils";
import { organization, user } from "./auth";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const notificationType = ["ticket_assigned", "sla_breach_warning"] as const;
export type NotificationType = (typeof notificationType)[number];
export const notificationTypeEnum = pgEnum("notification_type", notificationType);

// ─── Notification ────────────────────────────────────────────────────────────

export const notification = Utils.createTable(
  "notification",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").$type<NotificationType>().notNull(),
    title: text("title").notNull(),
    body: text("body"),
    data: jsonb("data").$type<Record<string, unknown>>(),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("notification_user_read_idx").on(t.userId, t.read),
    index("notification_org_idx").on(t.organizationId),
  ]
);

export type Notification = typeof notification.$inferSelect;
export type NewNotification = typeof notification.$inferInsert;

// ─── Relations ───────────────────────────────────────────────────────────────

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [notification.organizationId],
    references: [organization.id],
  }),
}));
