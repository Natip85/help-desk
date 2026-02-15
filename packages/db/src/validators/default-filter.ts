import { z } from "zod/v4";

export const filterTypeEnum = z.enum(["select", "multi-select", "radio", "checkbox"]);

export type FilterType = z.infer<typeof filterTypeEnum>;

export const FILTER_TYPE_LABELS: Record<FilterType, string> = {
  select: "Select",
  "multi-select": "Multi-Select",
  radio: "Radio Group",
  checkbox: "Checkbox List",
};

export const defaultFilterOptionSchema = z.object({
  value: z.string().min(1, "Value is required"),
  label: z.string().min(1, "Label is required"),
  position: z.number().int().min(0),
});

export type DefaultFilterOption = z.infer<typeof defaultFilterOptionSchema>;

export const defaultFilterFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  displayName: z.string().min(1, "Display name is required").max(255),
  type: filterTypeEnum.default("multi-select"),
  options: z.array(defaultFilterOptionSchema),
});

export type DefaultFilterFormValues = z.infer<typeof defaultFilterFormSchema>;
