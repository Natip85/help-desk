"use client";

import type { RuleGroupType } from "react-querybuilder";
import { useCallback, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import QueryBuilder from "react-querybuilder";
import { toast } from "sonner";
import z from "zod";

import type { Automation } from "@help-desk/db/schema/automations";

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
import { useTRPC } from "@/trpc";
import { automationFields, automationOperators } from "./automation-query-config";
import { queryToEngine } from "./query-to-engine";

type AutomationAction = {
  type: "add_tag" | "remove_tag" | "set_priority" | "set_status" | "assign_to";
  value: string;
};

type AutomationTrigger = "ticket_created" | "ticket_replied" | "status_changed";

const triggerLabels: Record<AutomationTrigger, string> = {
  ticket_created: "Ticket Created",
  ticket_replied: "Agent Replied",
  status_changed: "Status Changed",
};

const defaultQuery: RuleGroupType = {
  combinator: "and",
  rules: [],
};

const automationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
});

type AutomationFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editAutomation?: Automation;
};

export function AutomationFormDialog({
  open,
  onOpenChange,
  editAutomation,
}: AutomationFormDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEditing = !!editAutomation;

  const [trigger, setTrigger] = useState<AutomationTrigger>(
    () => editAutomation?.trigger ?? "ticket_created"
  );

  const [query, setQuery] = useState<RuleGroupType>(
    () => (editAutomation?.conditionsTree as RuleGroupType) ?? defaultQuery
  );

  const [actions, setActions] = useState<AutomationAction[]>(() => {
    if (editAutomation?.actions && Array.isArray(editAutomation.actions)) {
      return editAutomation.actions as AutomationAction[];
    }
    return [{ type: "add_tag", value: "" }];
  });

  const { mutateAsync: createAutomation } = useMutation(
    trpc.automation.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.automation.list.queryKey() });
      },
    })
  );

  const { mutateAsync: updateAutomation } = useMutation(
    trpc.automation.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.automation.list.queryKey() });
      },
    })
  );

  const form = useForm({
    defaultValues: {
      name: editAutomation?.name ?? "",
      description: editAutomation?.description ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        const hasEmptyAction = actions.some((a) => !a.value.trim());
        if (hasEmptyAction) {
          toast.error("All action values must be filled in");
          return;
        }

        if (actions.length === 0) {
          toast.error("Add at least one action");
          return;
        }

        const engineConditions = queryToEngine(query);

        const typedActions = actions as Parameters<typeof createAutomation>[0]["actions"];

        if (isEditing) {
          await updateAutomation({
            id: editAutomation.id,
            name: value.name,
            description: value.description || undefined,
            trigger,
            conditionsTree: query as unknown as Record<string, unknown>,
            conditions: engineConditions as unknown as Record<string, unknown>,
            actions: typedActions,
          });
          toast.success("Automation updated");
        } else {
          await createAutomation({
            name: value.name,
            description: value.description || undefined,
            trigger,
            conditionsTree: query as unknown as Record<string, unknown>,
            conditions: engineConditions as unknown as Record<string, unknown>,
            actions: typedActions,
          });
          toast.success("Automation created");
        }
        form.reset();
        onOpenChange(false);
      } catch (error) {
        toast.error(
          error instanceof Error ?
            error.message
          : `Failed to ${isEditing ? "update" : "create"} automation`
        );
      }
    },
    validators: {
      onSubmit: automationSchema,
    },
  });

  const addAction = useCallback(() => {
    setActions((prev) => [...prev, { type: "add_tag", value: "" }]);
  }, []);

  const removeAction = useCallback((index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateActionType = useCallback((index: number, type: AutomationAction["type"]) => {
    setActions((prev) => prev.map((a, i) => (i === index ? { ...a, type, value: "" } : a)));
  }, []);

  const updateActionValue = useCallback((index: number, value: string) => {
    setActions((prev) => prev.map((a, i) => (i === index ? { ...a, value } : a)));
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Automation" : "Create Automation"}</DialogTitle>
          <DialogDescription>
            {isEditing ?
              "Update the automation rule."
            : "Define conditions and actions for automatic ticket processing."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
        >
          {/* Name */}
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="automation-name">Name</Label>
                <Input
                  id="automation-name"
                  placeholder="e.g. Tag support emails"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error: { message?: string } | undefined) => (
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

          {/* Description */}
          <form.Field name="description">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="automation-desc">Description (optional)</Label>
                <Input
                  id="automation-desc"
                  placeholder="What does this automation do?"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          {/* Trigger */}
          <div className="space-y-2">
            <Label>Trigger</Label>
            <Select
              value={trigger}
              onValueChange={(val) => setTrigger(val as AutomationTrigger)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(triggerLabels) as [AutomationTrigger, string][]).map(
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
          </div>

          {/* Conditions - Query Builder */}
          <div className="space-y-2">
            <Label>When these conditions are met (optional)</Label>
            <QueryBuilder
              fields={automationFields}
              operators={automationOperators}
              query={query}
              onQueryChange={setQuery}
              controlClassnames={{
                queryBuilder: "qb-root",
                ruleGroup: "qb-group",
                header: "qb-header",
                body: "qb-body",
                rule: "qb-rule",
                combinators: "qb-combinators",
                addRule: "qb-btn",
                addGroup: "qb-btn",
                removeGroup: "qb-remove-group",
                removeRule: "qb-remove-rule",
                fields: "qb-select",
                operators: "qb-select",
                value: "qb-value",
              }}
            />
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Label>Then perform these actions</Label>
            {actions.map((action, index) => (
              <div
                key={index}
                className="flex items-center gap-2"
              >
                <Select
                  value={action.type}
                  onValueChange={(val) => updateActionType(index, val as AutomationAction["type"])}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add_tag">Add tag</SelectItem>
                    <SelectItem value="remove_tag">Remove tag</SelectItem>
                    <SelectItem value="set_priority">Set priority</SelectItem>
                    <SelectItem value="set_status">Set status</SelectItem>
                    <SelectItem value="assign_to">Assign to</SelectItem>
                  </SelectContent>
                </Select>

                <ActionValueInput
                  action={action}
                  onValueChange={(val) => updateActionValue(index, val)}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAction(index)}
                  disabled={actions.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAction}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add action
            </Button>
          </div>

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

function ActionValueInput({
  action,
  onValueChange,
}: {
  action: AutomationAction;
  onValueChange: (value: string) => void;
}) {
  if (action.type === "set_priority") {
    return (
      <Select
        value={action.value}
        onValueChange={onValueChange}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="normal">Normal</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (action.type === "set_status") {
    return (
      <Select
        value={action.value}
        onValueChange={onValueChange}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (action.type === "add_tag" || action.type === "remove_tag") {
    return (
      <TagSelect
        value={action.value}
        onValueChange={onValueChange}
      />
    );
  }

  if (action.type === "assign_to") {
    return (
      <Input
        className="flex-1"
        placeholder="User ID"
        value={action.value}
        onChange={(e) => onValueChange(e.target.value)}
      />
    );
  }

  return null;
}

function TagSelect({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.tags.list.queryOptions());
  const tags = data?.items ?? [];

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
    >
      <SelectTrigger className="flex-1">
        <SelectValue placeholder="Select a tag" />
      </SelectTrigger>
      <SelectContent>
        {tags.map((tag) => (
          <SelectItem
            key={tag.id}
            value={tag.name}
          >
            <span className="flex items-center gap-2">
              <span
                className="inline-block size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </span>
          </SelectItem>
        ))}
        {tags.length === 0 && (
          <div className="text-muted-foreground px-2 py-1.5 text-sm">
            No tags available. Create one in Settings &gt; Tags.
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
