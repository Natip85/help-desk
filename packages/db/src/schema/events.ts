import { relations } from "drizzle-orm";
import { index, jsonb, pgEnum, text, timestamp } from "drizzle-orm/pg-core";

import * as Utils from "../utils";
import { organization, user } from "./auth";
import { conversation } from "./conversations";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const conversationEventType = [
  "email_received",
  "email_sent",
  "status_changed",
  "priority_changed",
  "assigned",
  "unassigned",
  "note_added",
  "tag_added",
  "tag_removed",
  "conversation_created",
  "conversation_closed",
  "ticket_merged",
  "ticket_unmerged",
] as const;
export type ConversationEventType = (typeof conversationEventType)[number];
export const conversationEventTypeEnum = pgEnum("conversation_event_type", conversationEventType);

// ─── Conversation Event ──────────────────────────────────────────────────────

export const conversationEvent = Utils.createTable(
  "conversation_event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    conversationId: text("conversation_id").references(() => conversation.id, {
      onDelete: "cascade",
    }),
    actorId: text("actor_id").references(() => user.id),
    type: conversationEventTypeEnum("type").$type<ConversationEventType>().notNull(),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("event_conversation_idx").on(t.conversationId),
    index("event_org_type_idx").on(t.organizationId, t.type),
  ]
);

export type ConversationEvent = typeof conversationEvent.$inferSelect;
export type NewConversationEvent = typeof conversationEvent.$inferInsert;

// ─── Relations ───────────────────────────────────────────────────────────────

export const conversationEventRelations = relations(conversationEvent, ({ one }) => ({
  organization: one(organization, {
    fields: [conversationEvent.organizationId],
    references: [organization.id],
  }),
  conversation: one(conversation, {
    fields: [conversationEvent.conversationId],
    references: [conversation.id],
  }),
  actor: one(user, {
    fields: [conversationEvent.actorId],
    references: [user.id],
  }),
}));
