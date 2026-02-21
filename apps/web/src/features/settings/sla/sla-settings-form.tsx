"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { DaySchedule } from "@help-desk/db/schema/sla";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTRPC } from "@/trpc";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${String(hours).padStart(2, "0")}:${minutes}`;
});

const PRIORITY_CONFIG = [
  { value: "urgent" as const, label: "Urgent", className: "text-red-500" },
  { value: "high" as const, label: "High", className: "text-amber-500" },
  { value: "normal" as const, label: "Normal", className: "text-blue-500" },
  { value: "low" as const, label: "Low", className: "text-muted-foreground" },
];

type PolicyDraft = {
  priority: "low" | "normal" | "high" | "urgent";
  firstResponseMinutes: number;
  isActive: boolean;
};

export function SlaSettingsForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // ─── Business Hours ──────────────────────────────────────────────────────────

  const { data: bhData, dataUpdatedAt: bhUpdatedAt } = useQuery(
    trpc.sla.getBusinessHours.queryOptions()
  );

  const [bhEnabled, setBhEnabled] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [bhSyncedAt, setBhSyncedAt] = useState(0);

  if (bhData && bhUpdatedAt > bhSyncedAt) {
    setBhEnabled(bhData.isEnabled);
    setSchedule(bhData.schedule);
    setBhSyncedAt(bhUpdatedAt);
  }

  const { mutate: saveBusinessHours, isPending: isSavingBh } = useMutation(
    trpc.sla.updateBusinessHours.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.sla.getBusinessHours.queryKey() });
        toast.success("Business hours saved");
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to save business hours");
      },
    })
  );

  function updateDaySchedule(dayOfWeek: number, updates: Partial<DaySchedule>) {
    setSchedule((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...updates } : d)));
  }

  // ─── SLA Policies ────────────────────────────────────────────────────────────

  const { data: policies, dataUpdatedAt: policiesUpdatedAt } = useQuery(
    trpc.sla.getPolicies.queryOptions()
  );

  const [policyDrafts, setPolicyDrafts] = useState<PolicyDraft[]>([]);
  const [policiesSyncedAt, setPoliciesSyncedAt] = useState(0);

  if (policiesUpdatedAt > policiesSyncedAt) {
    const drafts: PolicyDraft[] = PRIORITY_CONFIG.map(({ value }) => {
      const existing = policies?.find((p) => p.priority === value);
      return {
        priority: value,
        firstResponseMinutes: existing?.firstResponseMinutes ?? 60,
        isActive: existing?.isActive ?? false,
      };
    });
    setPolicyDrafts(drafts);
    setPoliciesSyncedAt(policiesUpdatedAt);
  }

  const { mutate: upsertPolicy, isPending: isSavingPolicy } = useMutation(
    trpc.sla.upsertPolicy.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.sla.getPolicies.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message ?? "Failed to save SLA policy");
      },
    })
  );

  function updatePolicyDraft(priority: string, updates: Partial<PolicyDraft>) {
    setPolicyDrafts((prev) =>
      prev.map((p) => (p.priority === priority ? { ...p, ...updates } : p))
    );
  }

  function savePolicies() {
    for (const draft of policyDrafts) {
      upsertPolicy(draft);
    }
    toast.success("SLA policies saved");
  }

  return (
    <>
      {/* Business Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Business hours</CardTitle>
              <CardDescription>
                When enabled, SLA timers only count during these hours (UTC)
              </CardDescription>
            </div>
            <Switch
              checked={bhEnabled}
              onCheckedChange={setBhEnabled}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {schedule.map((day) => (
            <div
              key={day.dayOfWeek}
              className="flex items-center gap-4"
            >
              <div className="flex w-28 items-center gap-2">
                <Switch
                  size="sm"
                  checked={day.isEnabled}
                  onCheckedChange={(checked) =>
                    updateDaySchedule(day.dayOfWeek, { isEnabled: checked })
                  }
                  disabled={!bhEnabled}
                />
                <Label className="text-xs font-medium">{DAY_LABELS[day.dayOfWeek]}</Label>
              </div>
              {day.isEnabled && bhEnabled ?
                <div className="flex items-center gap-2">
                  <Select
                    value={day.startTime}
                    onValueChange={(val) => updateDaySchedule(day.dayOfWeek, { startTime: val })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem
                          key={t}
                          value={t}
                        >
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground text-xs">to</span>
                  <Select
                    value={day.endTime}
                    onValueChange={(val) => updateDaySchedule(day.dayOfWeek, { endTime: val })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem
                          key={t}
                          value={t}
                        >
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              : <span className="text-muted-foreground text-xs">{bhEnabled ? "Closed" : "—"}</span>}
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              disabled={isSavingBh || schedule.length === 0}
              onClick={() => saveBusinessHours({ isEnabled: bhEnabled, schedule })}
            >
              {isSavingBh ? "Saving..." : "Save business hours"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SLA Targets */}
      <Card>
        <CardHeader>
          <CardTitle>First response targets</CardTitle>
          <CardDescription>
            Set the maximum time (in minutes) to send a first reply, per priority.
            {bhEnabled ? " Minutes are counted in business hours." : " Minutes are counted 24/7."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {policyDrafts.map((draft) => {
            const config = PRIORITY_CONFIG.find((c) => c.value === draft.priority);
            return (
              <div
                key={draft.priority}
                className="flex items-center gap-4"
              >
                <div className="flex w-28 items-center gap-2">
                  <Switch
                    size="sm"
                    checked={draft.isActive}
                    onCheckedChange={(checked) =>
                      updatePolicyDraft(draft.priority, { isActive: checked })
                    }
                  />
                  <Label className={`text-xs font-medium ${config?.className ?? ""}`}>
                    {config?.label}
                  </Label>
                </div>
                {draft.isActive ?
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      className="w-24"
                      value={draft.firstResponseMinutes}
                      onChange={(e) =>
                        updatePolicyDraft(draft.priority, {
                          firstResponseMinutes: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                    />
                    <span className="text-muted-foreground text-xs">minutes</span>
                  </div>
                : <span className="text-muted-foreground text-xs">Disabled</span>}
              </div>
            );
          })}
          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              disabled={isSavingPolicy}
              onClick={() => void savePolicies()}
            >
              {isSavingPolicy ? "Saving..." : "Save SLA targets"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
