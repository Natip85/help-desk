import { useMemo } from "react";

import type { TicketFilter } from "@help-desk/db/validators/ticket-filter";

import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Normalize date to start of day (midnight) in UTC to avoid timezone shifts when serialized
const startOfDayUTC = (date: Date): Date => {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatDateRange = (from?: Date, to?: Date): string | null => {
  if (!from) return null;
  const fromStr = formatDate(from);
  if (!to || from.getTime() === to.getTime()) return fromStr;
  return `${fromStr} – ${formatDate(to)}`;
};

const PRESETS = [
  { value: "any", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this-week", label: "This week" },
  { value: "this-month", label: "This month" },
  { value: "last-60-days", label: "Last 60 days" },
] as const;

type PresetValue = (typeof PRESETS)[number]["value"];

type DateRangeValue = TicketFilter["createdAt"];

type CreatedDateFilterProps = {
  value: DateRangeValue;
  onChange: (createdAt: DateRangeValue) => void;
};

export const CreatedDateFilter = ({ value, onChange }: CreatedDateFilterProps) => {
  const today = startOfDayUTC(new Date());

  const getPresetRange = (preset: PresetValue): DateRangeValue => {
    switch (preset) {
      case "any":
        return undefined;
      case "today":
        return { from: today, to: today };
      case "yesterday": {
        const y = today.getUTCDate() - 1;
        const yesterday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), y));
        return { from: yesterday, to: yesterday };
      }
      case "this-week": {
        // Start of week (Sunday)
        const d = today.getUTCDate() - today.getUTCDay();
        const weekStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), d));
        return { from: weekStart, to: today };
      }
      case "this-month": {
        const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
        return { from: monthStart, to: today };
      }
      case "last-60-days": {
        const d60 = today.getUTCDate() - 60;
        const sixtyDaysAgo = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), d60));
        return { from: sixtyDaysAgo, to: today };
      }
    }
  };

  // Derive the active preset from the current value so the select reflects the right state
  const activePreset = useMemo<PresetValue | "custom">(() => {
    if (!value?.from && !value?.to) return "any";

    const from = value.from ? startOfDayUTC(value.from).getTime() : null;
    const to = value.to ? startOfDayUTC(value.to).getTime() : null;

    for (const preset of PRESETS) {
      if (preset.value === "any") continue;
      const range = getPresetRange(preset.value);
      if (!range) continue;
      const presetFrom = range.from ? startOfDayUTC(range.from).getTime() : null;
      const presetTo = range.to ? startOfDayUTC(range.to).getTime() : null;
      if (from === presetFrom && to === presetTo) return preset.value;
    }

    return "custom";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.from, value?.to]);

  const handlePresetChange = (presetValue: string) => {
    const range = getPresetRange(presetValue as PresetValue);
    onChange(range);
  };

  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) {
      onChange(undefined);
      return;
    }

    onChange({
      from: range.from ? startOfDayUTC(range.from) : undefined,
      to: range.to ? startOfDayUTC(range.to) : undefined,
    });
  };

  return (
    <>
      <div className="space-y-2">
        <Select
          value={activePreset}
          onValueChange={handlePresetChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a preset" />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((preset) => (
              <SelectItem
                key={preset.value}
                value={preset.value}
              >
                {preset.label}
              </SelectItem>
            ))}
            {activePreset === "custom" && (
              <SelectItem
                value="custom"
                disabled
              >
                Custom range
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {value?.from && (
          <p className="text-muted-foreground text-xs">{formatDateRange(value.from, value.to)}</p>
        )}
      </div>

      <div className="flex justify-center rounded-lg">
        <Calendar
          mode="range"
          selected={
            value?.from ?
              {
                from: startOfDayUTC(value.from),
                to: value.to ? startOfDayUTC(value.to) : undefined,
              }
            : undefined
          }
          onSelect={handleCalendarSelect}
          numberOfMonths={1}
          disabled={(date) => date > today}
          toDate={today}
        />
      </div>
    </>
  );
};
