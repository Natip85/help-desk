import { z } from "zod/v4";

import { ticketFilterSchema } from "@help-desk/db/validators";

export const createBasicListInput = <T extends string[]>(
  sortableColumns: T = ["title"] as T,
  defaultSortField: T[number] = "title"
) =>
  z.object({
    limit: z.number().min(1).max(1000).default(50),
    page: z.number().min(1).default(1),
    q: z.string().optional().default(""),
    viewMode: z.enum(["card", "list"]).optional().default("card"),
    sort: z
      .array(
        z.object({
          field: z.enum(sortableColumns).default(defaultSortField).or(z.literal("")),
          direction: z.enum(["asc", "desc"]).optional().default("asc"),
        })
      )
      .optional()
      .default([{ field: defaultSortField, direction: "asc" }]),
  });

export const createListInput = (sortableColumns: string[], defaultSortField?: string) =>
  createBasicListInput(sortableColumns, defaultSortField).extend({
    filter: ticketFilterSchema.optional().nullable(),
  });
