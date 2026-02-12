import { relations } from "drizzle-orm";
import { boolean, index, text } from "drizzle-orm/pg-core";

import * as Utils from "../utils";
import { organization, user } from "./auth";

// ─── Canned Response ─────────────────────────────────────────────────────────

export const cannedResponse = Utils.createTable(
  "canned_response",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id),
    isShared: boolean("is_shared").default(true).notNull(),
    ...Utils.createUpdateTimestamps,
  },
  (t) => [index("canned_response_org_idx").on(t.organizationId)]
);

export type CannedResponse = typeof cannedResponse.$inferSelect;
export type NewCannedResponse = typeof cannedResponse.$inferInsert;

// ─── Relations ───────────────────────────────────────────────────────────────

export const cannedResponseRelations = relations(cannedResponse, ({ one }) => ({
  organization: one(organization, {
    fields: [cannedResponse.organizationId],
    references: [organization.id],
  }),
  createdBy: one(user, {
    fields: [cannedResponse.createdById],
    references: [user.id],
  }),
}));
