import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, text, uniqueIndex } from "drizzle-orm/pg-core";

import type { DefaultFilterOption, FilterType } from "../validators";
import * as Utils from "../utils";
import { organization } from "./auth";

export const defaultFilter = Utils.createTable(
  "default_filter",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    displayName: text("display_name").notNull(),
    options: jsonb("options").$type<DefaultFilterOption[]>().notNull(),
    type: text("type").$type<FilterType>().default("multi-select").notNull(),
    isSystem: boolean("is_system").default(false).notNull(),
    position: integer("position").default(0).notNull(),
    ...Utils.createUpdateTimestamps,
  },
  (t) => [
    uniqueIndex("default_filter_org_name_idx").on(t.organizationId, t.name),
    index("default_filter_org_idx").on(t.organizationId),
  ]
);

export type DefaultFilter = typeof defaultFilter.$inferSelect;
export type NewDefaultFilter = typeof defaultFilter.$inferInsert;

export const defaultFilterRelations = relations(defaultFilter, ({ one }) => ({
  organization: one(organization, {
    fields: [defaultFilter.organizationId],
    references: [organization.id],
  }),
}));
