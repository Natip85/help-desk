import { z } from "zod/v4";

export const cannedResponseFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name must be 255 characters or fewer"),
  body: z.string().min(1, "Body is required"),
  folderId: z.string().optional(),
});

export type CannedResponseForm = z.infer<typeof cannedResponseFormSchema>;

export const cannedResponseFormDefaults: CannedResponseForm = {
  name: "",
  body: "",
  folderId: undefined,
};
