"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Automation } from "@help-desk/db/schema/automations";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTRPC } from "@/trpc";
import { AutomationFormDialog } from "./automation-form-dialog";

export function AutomationsList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);

  const { data } = useQuery(trpc.automation.list.queryOptions());

  const { mutate: toggleAutomation } = useMutation(
    trpc.automation.toggle.mutationOptions({
      onSuccess: (updated) => {
        void queryClient.invalidateQueries({ queryKey: trpc.automation.list.queryKey() });
        toast.success(`Automation ${updated?.isActive ? "enabled" : "disabled"}`);
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to toggle automation");
      },
    })
  );

  const { mutate: deleteAutomation, isPending: isDeleting } = useMutation(
    trpc.automation.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.automation.list.queryKey() });
        toast.success("Automation deleted");
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to delete automation");
      },
    })
  );

  const automations = data?.items ?? [];

  return (
    <div className="w-full space-y-4">
      {automations.length === 0 ?
        <p className="text-muted-foreground py-8 text-center text-sm">
          No automations created yet. Add one to start automating ticket workflows.
        </p>
      : <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Actions</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {automations.map((a) => (
              <TableRow
                key={a.id}
                className="hover:bg-transparent"
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-0.5">
                    <span>{a.name}</span>
                    {a.description && (
                      <span className="text-muted-foreground text-xs">{a.description}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{formatTrigger(a.trigger)}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(a.actions as { type: string; value: string }[]).map((action, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                      >
                        {formatAction(action)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={a.isActive}
                    onCheckedChange={() => toggleAutomation({ id: a.id })}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAutomation(a)}
                    >
                      Edit
                    </Button>
                    <DeleteAutomationButton
                      automationId={a.id}
                      automationName={a.name}
                      onDelete={deleteAutomation}
                      isDeleting={isDeleting}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }

      {editingAutomation && (
        <AutomationFormDialog
          open={!!editingAutomation}
          onOpenChange={(open: boolean) => {
            if (!open) setEditingAutomation(null);
          }}
          editAutomation={editingAutomation}
        />
      )}
    </div>
  );
}

function formatTrigger(trigger: string): string {
  const map: Record<string, string> = {
    ticket_created: "Ticket Created",
    ticket_replied: "Agent Replied",
    status_changed: "Status Changed",
  };
  return map[trigger] ?? trigger;
}

function formatAction(action: { type: string; value: string }): string {
  const map: Record<string, string> = {
    add_tag: "Add Tag",
    remove_tag: "Remove Tag",
    set_priority: "Priority",
    set_status: "Status",
    assign_to: "Assign",
  };
  const label = map[action.type] ?? action.type;
  return `${label}: ${action.value}`;
}

function DeleteAutomationButton({
  automationId,
  automationName,
  onDelete,
  isDeleting,
}: {
  automationId: string;
  automationName: string;
  onDelete: (input: { id: string }) => void;
  isDeleting: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
        >
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Automation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the automation &quot;{automationName}&quot;? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onDelete({ id: automationId });
              setIsOpen(false);
            }}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
