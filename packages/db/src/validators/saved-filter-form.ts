import { z } from "zod/v4";

export const savedFilterFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or fewer"),
  description: z.string().trim().optional(),
});

export type SavedFilterForm = z.infer<typeof savedFilterFormSchema>;

export const savedFilterFormDefaults: SavedFilterForm = {
  title: "",
  description: "",
};
