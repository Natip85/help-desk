import { relations } from "drizzle-orm";
import { index, text } from "drizzle-orm/pg-core";

import * as Utils from "../utils";
import { user } from "./auth";
import { conversation } from "./conversations";

// ─── Note ────────────────────────────────────────────────────────────────────

export const note = Utils.createTable(
  "note",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id),
    body: text("body").notNull(),
    ...Utils.createUpdateTimestamps,
  },
  (t) => [index("note_conversation_idx").on(t.conversationId)]
);

export type Note = typeof note.$inferSelect;
export type NewNote = typeof note.$inferInsert;

// ─── Relations ───────────────────────────────────────────────────────────────

export const noteRelations = relations(note, ({ one }) => ({
  conversation: one(conversation, {
    fields: [note.conversationId],
    references: [conversation.id],
  }),
  author: one(user, {
    fields: [note.authorId],
    references: [user.id],
  }),
}));
