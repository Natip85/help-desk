import { z } from "zod/v4";

export const contactFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

export type ContactForm = z.infer<typeof contactFormSchema>;

export const contactFormDefaults: ContactForm = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
};
