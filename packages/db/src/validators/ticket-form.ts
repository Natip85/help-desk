import { z } from "zod/v4";

import {
  conversationChannel,
  conversationPriority,
  conversationStatus,
} from "../schema/conversations";

export const ticketFormSchema = z.object({
  contactId: z.string().optional(),
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(255, "Subject must be 255 characters or fewer"),
  channel: z.enum(conversationChannel).optional(),
  status: z.enum(conversationStatus, { message: "Please select a status" }),
  priority: z.enum(conversationPriority, { message: "Please select a priority" }),
  assignedToId: z.string().optional(),
  description: z.string().trim().min(1, "Description is required"),
  tagIds: z.array(z.string()).optional(),
});

export type TicketForm = z.infer<typeof ticketFormSchema>;

export const ticketFormDefaults: TicketForm = {
  contactId: undefined,
  subject: "",
  channel: "email",
  status: "open",
  priority: "normal",
  assignedToId: undefined,
  description: "",
  tagIds: [],
};
