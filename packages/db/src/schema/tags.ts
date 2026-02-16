import { relations } from "drizzle-orm";
import { index, primaryKey, text, uniqueIndex } from "drizzle-orm/pg-core";

import * as Utils from "../utils";
import { organization } from "./auth";
import { contact } from "./contacts";
import { conversation } from "./conversations";

// ─── Tag ─────────────────────────────────────────────────────────────────────

export const tag = Utils.createTable(
  "tag",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").default("#7C8187").notNull(),
    createdAt: Utils.createTimestampColumn("created_at"),
  },
  (t) => [
    uniqueIndex("tag_org_name_idx").on(t.organizationId, t.name),
    index("tag_org_idx").on(t.organizationId),
  ]
);

export type Tag = typeof tag.$inferSelect;
export type NewTag = typeof tag.$inferInsert;

// ─── Conversation Tag (junction) ─────────────────────────────────────────────

export const conversationTag = Utils.createTable(
  "conversation_tag",
  {
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.conversationId, t.tagId] })]
);

// ─── Contact Tag (junction) ──────────────────────────────────────────────────

export const contactTag = Utils.createTable(
  "contact_tag",
  {
    contactId: text("contact_id")
      .notNull()
      .references(() => contact.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.contactId, t.tagId] })]
);

// ─── Relations ───────────────────────────────────────────────────────────────

export const tagRelations = relations(tag, ({ one, many }) => ({
  organization: one(organization, {
    fields: [tag.organizationId],
    references: [organization.id],
  }),
  conversationTags: many(conversationTag),
  contactTags: many(contactTag),
}));

export const conversationTagRelations = relations(conversationTag, ({ one }) => ({
  conversation: one(conversation, {
    fields: [conversationTag.conversationId],
    references: [conversation.id],
  }),
  tag: one(tag, {
    fields: [conversationTag.tagId],
    references: [tag.id],
  }),
}));

export const contactTagRelations = relations(contactTag, ({ one }) => ({
  contact: one(contact, {
    fields: [contactTag.contactId],
    references: [contact.id],
  }),
  tag: one(tag, {
    fields: [contactTag.tagId],
    references: [tag.id],
  }),
}));
