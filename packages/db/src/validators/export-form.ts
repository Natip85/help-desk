import { z } from "zod/v4";

import { dateRangeSchema, ticketFilterSchema } from "./ticket-filter";

export const exportFormat = ["csv", "xlsx"] as const;

export const ticketExportableFields = [
  "id",
  "subject",
  "status",
  "priority",
  "channel",
  "assignedTo",
  "company",
  "tags",
  "createdAt",
  "updatedAt",
  "lastMessageAt",
  "closedAt",
] as const;

export const contactExportableFields = ["contactName", "contactEmail", "contactPhone"] as const;

export const exportFormSchema = z.object({
  format: z.enum(exportFormat),
  dateRange: dateRangeSchema,
  filter: ticketFilterSchema.optional().nullable(),
  q: z.string().optional().default(""),
  ticketFields: z.array(z.enum(ticketExportableFields)).min(1, "Select at least one field"),
  contactFields: z.array(z.enum(contactExportableFields)).optional().default([]),
});

export type ExportForm = z.infer<typeof exportFormSchema>;
