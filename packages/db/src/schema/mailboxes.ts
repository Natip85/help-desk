import { relations } from "drizzle-orm";
import { boolean, index, text, uniqueIndex } from "drizzle-orm/pg-core";

import * as Utils from "../utils";
import { organization } from "./auth";

// ─── Mailbox ─────────────────────────────────────────────────────────────────

export const mailbox = Utils.createTable(
  "mailbox",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    ...Utils.createUpdateTimestamps,
  },
  (t) => [
    uniqueIndex("mailbox_org_email_idx").on(t.organizationId, t.email),
    index("mailbox_org_idx").on(t.organizationId),
  ]
);

export type Mailbox = typeof mailbox.$inferSelect;
export type NewMailbox = typeof mailbox.$inferInsert;

// ─── Relations ───────────────────────────────────────────────────────────────

export const mailboxRelations = relations(mailbox, ({ one }) => ({
  organization: one(organization, {
    fields: [mailbox.organizationId],
    references: [organization.id],
  }),
}));
