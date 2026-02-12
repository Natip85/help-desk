import { z } from "zod/v4";

import {
  conversationChannel,
  conversationPriority,
  conversationStatus,
} from "../schema/conversations";

export const dateRangeSchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .optional();

export type DateRange = NonNullable<z.infer<typeof dateRangeSchema>>;

export const ticketFilterSchema = z.object({
  statuses: z.array(z.enum(conversationStatus)).optional(),
  priorities: z.array(z.enum(conversationPriority)).optional(),
  channels: z.array(z.enum(conversationChannel)).optional(),
  assignedToIds: z.array(z.string()).optional(),
  contactIds: z.array(z.string()).optional(),
  companyIds: z.array(z.string()).optional(),
  mailboxIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  createdAt: dateRangeSchema,
  lastMessageAt: dateRangeSchema,
  closedAt: dateRangeSchema,
});

export type TicketFilter = z.infer<typeof ticketFilterSchema>;
