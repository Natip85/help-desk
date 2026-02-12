import { z } from "zod/v4";

// ─── Ticket Sort ────────────────────────────────────────────────────────────

export const ticketSortOptionSchema = z.object({
  field: z.enum(["createdAt", "updatedAt", "lastMessageAt", "priority", "status", "subject"]),
  direction: z.enum(["asc", "desc"]),
});

export const ticketSortSchema = z.array(ticketSortOptionSchema);

export type TicketSortOption = z.infer<typeof ticketSortOptionSchema>;
export type TicketSortOptions = z.infer<typeof ticketSortSchema>;
