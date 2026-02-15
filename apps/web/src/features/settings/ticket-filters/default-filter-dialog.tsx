"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import z from "zod";

import type { FilterType } from "@help-desk/db/validators/default-filter";
import { FILTER_TYPE_LABELS, filterTypeEnum } from "@help-desk/db/validators/default-filter";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc";

type FilterOption = {
  value: string;
  label: string;
  position: number;
};

type EditFilter = {
  id: string;
  name: string;
  displayName: string;
  type: FilterType;
  options: FilterOption[];
  isSystem: boolean;
};

type DefaultFilterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editFilter?: EditFilter;
};

const formSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  name: z.string().min(1, "Name is required"),
  type: filterTypeEnum,
  options: z.array(
    z.object({
      value: z.string().min(1, "Value is required"),
      label: z.string().min(1, "Label is required"),
      position: z.number(),
    })
  ),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function DefaultFilterDialog({ open, onOpenChange, editFilter }: DefaultFilterDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEditing = !!editFilter;

  const { mutateAsync: createFilter } = useMutation(
    trpc.defaultFilter.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.defaultFilter.list.queryKey(),
        });
      },
    })
  );

  const { mutateAsync: updateFilter } = useMutation(
    trpc.defaultFilter.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.defaultFilter.list.queryKey(),
        });
      },
    })
  );

  const form = useForm({
    defaultValues: {
      displayName: editFilter?.displayName ?? "",
      name: editFilter?.name ?? "",
      type: editFilter?.type ?? "multi-select",
      options:
        editFilter?.options?.length ?
          [...editFilter.options].sort((a, b) => a.position - b.position)
        : [{ value: "", label: "", position: 0 }],
    },
    onSubmit: async ({ value }) => {
      try {
        // Re-index positions
        const options = value.options.map((opt, idx) => ({
          ...opt,
          position: idx,
        }));

        if (isEditing) {
          await updateFilter({
            id: editFilter.id,
            displayName: value.displayName,
            name: value.name,
            type: value.type,
            options,
          });
          toast.success("Filter updated");
        } else {
          await createFilter({
            name: value.name,
            displayName: value.displayName,
            type: value.type,
            options,
          });
          toast.success("Filter created");
        }
        form.reset();
        onOpenChange(false);
      } catch (error) {
        toast.error(
          error instanceof Error ?
            error.message
          : `Failed to ${isEditing ? "update" : "create"} filter`
        );
      }
    },
    validators: {
      onSubmit: formSchema,
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Filter" : "Add Filter"}</DialogTitle>
          <DialogDescription>
            {isEditing ?
              "Update the filter name and its options."
            : "Create a new filter with custom options."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          {/* Display Name */}
          <form.Field name="displayName">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="filter-display-name">Display Name</Label>
                <Input
                  id="filter-display-name"
                  placeholder="e.g. Priority, Department"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                    // Auto-derive name from display name for new filters
                    if (!isEditing) {
                      form.setFieldValue("name", slugify(e.target.value));
                    }
                  }}
                />
                {field.state.meta.errors.map((error) => (
                  <p
                    key={error?.message}
                    className="text-destructive text-sm"
                  >
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Name (slug) */}
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="filter-name">
                  Key <span className="text-muted-foreground text-xs">(used programmatically)</span>
                </Label>
                <Input
                  id="filter-name"
                  placeholder="e.g. priority, department"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p
                    key={error?.message}
                    className="text-destructive text-sm"
                  >
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Component Type */}
          <form.Field name="type">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="filter-type">Component Type</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as FilterType)}
                >
                  <SelectTrigger
                    id="filter-type"
                    className="w-full"
                  >
                    <SelectValue placeholder="Select component type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(FILTER_TYPE_LABELS) as [FilterType, string][]).map(
                      ([value, label]) => (
                        <SelectItem
                          key={value}
                          value={value}
                        >
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                {field.state.meta.errors.map((error) => (
                  <p
                    key={error?.message}
                    className="text-destructive text-sm"
                  >
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          {/* Options */}
          <form.Field
            name="options"
            mode="array"
          >
            {(field) => (
              <div className="space-y-3">
                <Label>Options</Label>
                <div className="space-y-2">
                  {field.state.value.map((_, optIdx) => (
                    <div
                      key={optIdx}
                      className="bg-muted/50 flex items-start gap-2 rounded-md border p-3"
                    >
                      <div className="grid flex-1 grid-cols-2 gap-2">
                        <form.Field name={`options[${optIdx}].label`}>
                          {(subField) => (
                            <div>
                              {optIdx === 0 && (
                                <Label className="text-muted-foreground mb-1 block text-xs">
                                  Label
                                </Label>
                              )}
                              <Input
                                placeholder="e.g. High"
                                value={subField.state.value}
                                onBlur={subField.handleBlur}
                                onChange={(e) => {
                                  subField.handleChange(e.target.value);
                                  // Auto-derive value from label
                                  form.setFieldValue(
                                    `options[${optIdx}].value`,
                                    slugify(e.target.value)
                                  );
                                }}
                                className="h-8 text-sm"
                              />
                            </div>
                          )}
                        </form.Field>
                        <form.Field name={`options[${optIdx}].value`}>
                          {(subField) => (
                            <div>
                              {optIdx === 0 && (
                                <Label className="text-muted-foreground mb-1 block text-xs">
                                  Value
                                </Label>
                              )}
                              <Input
                                placeholder="e.g. high"
                                value={subField.state.value}
                                onBlur={subField.handleBlur}
                                onChange={(e) => subField.handleChange(e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                          )}
                        </form.Field>
                      </div>

                      {/* Remove button */}
                      {field.state.value.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={cn("h-8 w-8 p-0", optIdx === 0 && "mt-5")}
                          onClick={() => field.removeValue(optIdx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    field.pushValue({
                      value: "",
                      label: "",
                      position: field.state.value.length,
                    })
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Option
                </Button>

                {field.state.meta.errors.map((error) => (
                  <p
                    key={typeof error === "string" ? error : error?.message}
                    className="text-destructive text-sm"
                  >
                    {typeof error === "string" ? error : error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Subscribe>
            {(state) => (
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={state.isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!state.canSubmit || state.isSubmitting}
                >
                  {state.isSubmitting ?
                    isEditing ?
                      "Updating..."
                    : "Creating..."
                  : isEditing ?
                    "Update"
                  : "Create"}
                </Button>
              </DialogFooter>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
