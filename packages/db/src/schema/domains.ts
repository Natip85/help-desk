import { relations } from "drizzle-orm";
import { index, jsonb, text, uniqueIndex } from "drizzle-orm/pg-core";

import * as Utils from "../utils";
import { organization } from "./auth";

// ─── Domain ──────────────────────────────────────────────────────────────────

export const domain = Utils.createTable(
  "domain",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    domain: text("domain").notNull(),
    resendDomainId: text("resend_domain_id"),
    status: text("status").notNull().default("pending"),
    region: text("region"),
    dnsRecords: jsonb("dns_records").$type<
      {
        record: string;
        name: string;
        type: string;
        ttl: string;
        status: string;
        value: string;
        priority?: number;
      }[]
    >(),
    ...Utils.createUpdateTimestamps,
  },
  (t) => [
    uniqueIndex("domain_org_domain_idx").on(t.organizationId, t.domain),
    index("domain_org_idx").on(t.organizationId),
  ]
);

export type Domain = typeof domain.$inferSelect;
export type NewDomain = typeof domain.$inferInsert;

// ─── Relations ───────────────────────────────────────────────────────────────

export const domainRelations = relations(domain, ({ one }) => ({
  organization: one(organization, {
    fields: [domain.organizationId],
    references: [organization.id],
  }),
}));
