import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { index, text, uniqueIndex } from "drizzle-orm/pg-core";

import * as Utils from "../utils";
import { organization } from "./auth";

// ─── Company ─────────────────────────────────────────────────────────────────

export const company = Utils.createTable(
  "company",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    domain: text("domain"),
    website: text("website"),
    ...Utils.createUpdateTimestamps,
  },
  (t) => [
    uniqueIndex("company_org_domain_idx").on(t.organizationId, t.domain),
    index("company_org_idx").on(t.organizationId),
  ]
);

export type Company = typeof company.$inferSelect;
export type NewCompany = typeof company.$inferInsert;

// ─── Contact ─────────────────────────────────────────────────────────────────

export const contact = Utils.createTable(
  "contact",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    phone: text("phone"),
    companyId: text("company_id").references((): AnyPgColumn => company.id),
    ...Utils.createUpdateTimestamps,
  },
  (t) => [
    uniqueIndex("contact_org_email_idx").on(t.organizationId, t.email),
    index("contact_company_idx").on(t.companyId),
  ]
);

export type Contact = typeof contact.$inferSelect;
export type NewContact = typeof contact.$inferInsert;

// ─── Relations ───────────────────────────────────────────────────────────────

export const companyRelations = relations(company, ({ many, one }) => ({
  organization: one(organization, {
    fields: [company.organizationId],
    references: [organization.id],
  }),
  contacts: many(contact),
}));

export const contactRelations = relations(contact, ({ one }) => ({
  organization: one(organization, {
    fields: [contact.organizationId],
    references: [organization.id],
  }),
  company: one(company, {
    fields: [contact.companyId],
    references: [company.id],
  }),
}));
