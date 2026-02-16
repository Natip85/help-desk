import { z } from "zod/v4";

import { conversationPriority, conversationStatus } from "../schema/conversations";
import { contactFormSchema } from "./contact-form";

export const emailFormSchema = z
  .object({
    mailboxId: z.string().min(1, "From mailbox is required"),
    contactId: z.string().optional(),
    newContact: contactFormSchema.optional(),
    subject: z
      .string()
      .trim()
      .min(1, "Subject is required")
      .max(255, "Subject must be 255 characters or fewer"),
    description: z.string().trim().min(1, "Description is required"),
    // System default filters (mandatory with defaults)
    status: z.enum(conversationStatus, { message: "Please select a status" }),
    priority: z.enum(conversationPriority, { message: "Please select a priority" }),
    // Optional fields
    assignedToId: z.string().optional(),
    tagIds: z.array(z.string()).optional(),
    customFields: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
    cc: z.array(z.string().email()).optional(),
    bcc: z.array(z.string().email()).optional(),
  })
  .refine((data) => !!data.contactId || !!data.newContact?.email, {
    message: "Select an existing contact or create a new one",
    path: ["contactId"],
  });

export type EmailForm = z.infer<typeof emailFormSchema>;

export const emailFormDefaults: EmailForm = {
  mailboxId: "",
  contactId: "",
  newContact: undefined,
  subject: "",
  description: "",
  status: "open",
  priority: "normal",
  assignedToId: undefined,
  tagIds: [],
  customFields: {},
  cc: [],
  bcc: [],
};
