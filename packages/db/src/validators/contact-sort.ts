import { z } from "zod/v4";

export const contactSortOptionSchema = z.object({
  field: z.enum(["createdAt", "updatedAt", "firstName", "lastName", "email", "phone", "companyId"]),
  direction: z.enum(["asc", "desc"]),
});

export const contactSortSchema = z.array(contactSortOptionSchema);

export type ContactSortOption = z.infer<typeof contactSortOptionSchema>;
export type ContactSortOptions = z.infer<typeof contactSortSchema>;
