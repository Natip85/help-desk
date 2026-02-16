import { relations } from "drizzle-orm";
import { index, integer, jsonb, pgEnum, text, timestamp } from "drizzle-orm/pg-core";

import * as Utils from "../utils";
import { organization, user } from "./auth";
import { company, contact } from "./contacts";
import { mailbox } from "./mailboxes";
import { conversationTag } from "./tags";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const conversationStatus = ["open", "pending", "resolved", "closed", "merged"] as const;
export type ConversationStatus = (typeof conversationStatus)[number];
export const conversationStatusEnum = pgEnum("conversation_status", conversationStatus);

export const conversationPriority = ["low", "normal", "high", "urgent"] as const;
export type ConversationPriority = (typeof conversationPriority)[number];
export const conversationPriorityEnum = pgEnum("conversation_priority", conversationPriority);

export const conversationChannel = ["email", "web", "api"] as const;
export type ConversationChannel = (typeof conversationChannel)[number];
export const conversationChannelEnum = pgEnum("conversation_channel", conversationChannel);

export const messageDirection = ["inbound", "outbound"] as const;
export type MessageDirection = (typeof messageDirection)[number];
export const messageDirectionEnum = pgEnum("message_direction", messageDirection);

export const messageType = ["reply", "forward"] as const;
export type MessageType = (typeof messageType)[number];
export const messageTypeEnum = pgEnum("message_type", messageType);

// ─── Conversation ────────────────────────────────────────────────────────────

export const conversation = Utils.createTable(
  "conversation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    subject: text("subject"),
    status: conversationStatusEnum("status").$type<ConversationStatus>().default("open").notNull(),
    priority: conversationPriorityEnum("priority")
      .$type<ConversationPriority>()
      .default("normal")
      .notNull(),
    channel: conversationChannelEnum("channel")
      .$type<ConversationChannel>()
      .default("email")
      .notNull(),
    contactId: text("contact_id")
      .notNull()
      .references(() => contact.id),
    companyId: text("company_id").references(() => company.id),
    mailboxId: text("mailbox_id").references(() => mailbox.id),
    assignedToId: text("assigned_to_id").references(() => user.id),
    customFields: jsonb("custom_fields").$type<Record<string, string | string[]>>().default({}),
    mergedIntoId: text("merged_into_id"),
    lastMessageAt: timestamp("last_message_at"),
    closedAt: timestamp("closed_at"),
    deletedAt: timestamp("deleted_at"),
    ...Utils.createUpdateTimestamps,
  },
  (t) => [
    index("conversation_org_status_idx").on(t.organizationId, t.status),
    index("conversation_assigned_idx").on(t.assignedToId),
    index("conversation_contact_idx").on(t.contactId),
    index("conversation_org_idx").on(t.organizationId),
    index("conversation_deleted_at_idx").on(t.deletedAt),
    index("conversation_merged_into_idx").on(t.mergedIntoId),
  ]
);

export type Conversation = typeof conversation.$inferSelect;
export type NewConversation = typeof conversation.$inferInsert;

// ─── Message ─────────────────────────────────────────────────────────────────

export const message = Utils.createTable(
  "message",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    contactId: text("contact_id").references(() => contact.id),
    senderId: text("sender_id").references(() => user.id),
    direction: messageDirectionEnum("direction").$type<MessageDirection>().notNull(),
    messageType: messageTypeEnum("message_type").$type<MessageType>().default("reply").notNull(),
    resendEmailId: text("resend_email_id"),
    fromEmail: text("from_email").notNull(),
    toEmail: text("to_email").array().notNull(),
    cc: text("cc").array(),
    bcc: text("bcc").array(),
    subject: text("subject"),
    textBody: text("text_body"),
    htmlBody: text("html_body"),
    emailMessageId: text("email_message_id"),
    inReplyTo: text("in_reply_to"),
    references: text("references"),
    rawHeaders: jsonb("raw_headers"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("message_conversation_idx").on(t.conversationId),
    index("message_email_message_id_idx").on(t.emailMessageId),
  ]
);

export type Message = typeof message.$inferSelect;
export type NewMessage = typeof message.$inferInsert;

// ─── Attachment ──────────────────────────────────────────────────────────────

export const attachment = Utils.createTable(
  "attachment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    messageId: text("message_id")
      .notNull()
      .references(() => message.id, { onDelete: "cascade" }),
    resendAttachmentId: text("resend_attachment_id"),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size"),
    storageUrl: text("storage_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("attachment_message_idx").on(t.messageId)]
);

export type Attachment = typeof attachment.$inferSelect;
export type NewAttachment = typeof attachment.$inferInsert;

// ─── Relations ───────────────────────────────────────────────────────────────

export const conversationRelations = relations(conversation, ({ one, many }) => ({
  organization: one(organization, {
    fields: [conversation.organizationId],
    references: [organization.id],
  }),
  contact: one(contact, {
    fields: [conversation.contactId],
    references: [contact.id],
  }),
  company: one(company, {
    fields: [conversation.companyId],
    references: [company.id],
  }),
  mailbox: one(mailbox, {
    fields: [conversation.mailboxId],
    references: [mailbox.id],
  }),
  assignedTo: one(user, {
    fields: [conversation.assignedToId],
    references: [user.id],
  }),
  mergedInto: one(conversation, {
    fields: [conversation.mergedIntoId],
    references: [conversation.id],
    relationName: "mergedTickets",
  }),
  mergedTickets: many(conversation, { relationName: "mergedTickets" }),
  messages: many(message),
  conversationTags: many(conversationTag),
}));

export const messageRelations = relations(message, ({ one, many }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
  contact: one(contact, {
    fields: [message.contactId],
    references: [contact.id],
  }),
  sender: one(user, {
    fields: [message.senderId],
    references: [user.id],
  }),
  attachments: many(attachment),
}));

export const attachmentRelations = relations(attachment, ({ one }) => ({
  message: one(message, {
    fields: [attachment.messageId],
    references: [message.id],
  }),
}));
