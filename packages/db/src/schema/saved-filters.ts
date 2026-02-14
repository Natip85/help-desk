import { relations } from "drizzle-orm";
import { index, jsonb, text } from "drizzle-orm/pg-core";

import type { TicketFilter } from "../validators/ticket-filter";
import * as Utils from "../utils";
import { organization, user } from "./auth";

// ─── Saved Filter ───────────────────────────────────────────────────────────

export const savedFilter = Utils.createTable(
  "saved_filter",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id),
    title: text("title").notNull(),
    description: text("description"),
    filter: jsonb("filter").$type<TicketFilter>().notNull(),
    ...Utils.createUpdateTimestamps,
  },
  (t) => [index("saved_filter_org_idx").on(t.organizationId)]
);

export type SavedFilter = typeof savedFilter.$inferSelect;
export type NewSavedFilter = typeof savedFilter.$inferInsert;

// ─── Relations ───────────────────────────────────────────────────────────────

export const savedFilterRelations = relations(savedFilter, ({ one }) => ({
  organization: one(organization, {
    fields: [savedFilter.organizationId],
    references: [organization.id],
  }),
  createdBy: one(user, {
    fields: [savedFilter.createdById],
    references: [user.id],
  }),
}));
