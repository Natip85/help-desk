import type { DaySchedule } from "@help-desk/db/schema/sla";

export const DEFAULT_SCHEDULE: DaySchedule[] = [
  { dayOfWeek: 0, isEnabled: false, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 1, isEnabled: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 2, isEnabled: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 3, isEnabled: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 4, isEnabled: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 5, isEnabled: true, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 6, isEnabled: false, startTime: "09:00", endTime: "17:00" },
];

function parseTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function getScheduleForDay(schedule: DaySchedule[], dayOfWeek: number): DaySchedule | undefined {
  return schedule.find((d) => d.dayOfWeek === dayOfWeek);
}

function getMinuteOfDay(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function setMinuteOfDay(date: Date, minuteOfDay: number): Date {
  const result = new Date(date);
  result.setUTCHours(Math.floor(minuteOfDay / 60), minuteOfDay % 60, 0, 0);
  return result;
}

function advanceToNextDay(date: Date): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + 1);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

/**
 * Adds N business-minutes to a start time, walking forward through the weekly
 * schedule. If business hours are disabled, adds wall-clock minutes instead.
 *
 * Safety: breaks after 400 day-iterations to prevent infinite loops if all
 * days are disabled.
 */
export function addBusinessMinutes(
  startTime: Date,
  minutes: number,
  schedule: DaySchedule[],
  isEnabled: boolean
): Date {
  if (!isEnabled || minutes <= 0) {
    return new Date(startTime.getTime() + minutes * 60_000);
  }

  let remaining = minutes;
  let cursor = new Date(startTime);

  for (let safety = 0; safety < 400 && remaining > 0; safety++) {
    const daySchedule = getScheduleForDay(schedule, cursor.getUTCDay());

    if (!daySchedule?.isEnabled) {
      cursor = advanceToNextDay(cursor);
      continue;
    }

    const openMinute = parseTime(daySchedule.startTime);
    const closeMinute = parseTime(daySchedule.endTime);
    const currentMinute = getMinuteOfDay(cursor);

    if (currentMinute >= closeMinute) {
      cursor = advanceToNextDay(cursor);
      continue;
    }

    const effectiveStart = Math.max(currentMinute, openMinute);
    const availableMinutes = closeMinute - effectiveStart;

    if (remaining <= availableMinutes) {
      return setMinuteOfDay(cursor, effectiveStart + remaining);
    }

    remaining -= availableMinutes;
    cursor = advanceToNextDay(cursor);
  }

  return cursor;
}

/**
 * Counts how many business-minutes elapsed between two timestamps. If business
 * hours are disabled, returns wall-clock minutes.
 */
export function getBusinessMinutesBetween(
  start: Date,
  end: Date,
  schedule: DaySchedule[],
  isEnabled: boolean
): number {
  if (!isEnabled) {
    return Math.max(0, (end.getTime() - start.getTime()) / 60_000);
  }

  if (end <= start) return 0;

  let total = 0;
  let cursor = new Date(start);

  for (let safety = 0; safety < 400 && cursor < end; safety++) {
    const daySchedule = getScheduleForDay(schedule, cursor.getUTCDay());

    if (!daySchedule?.isEnabled) {
      cursor = advanceToNextDay(cursor);
      continue;
    }

    const openMinute = parseTime(daySchedule.startTime);
    const closeMinute = parseTime(daySchedule.endTime);
    const currentMinute = getMinuteOfDay(cursor);

    if (currentMinute >= closeMinute) {
      cursor = advanceToNextDay(cursor);
      continue;
    }

    const effectiveStart = Math.max(currentMinute, openMinute);

    const endOfDay = new Date(cursor);
    endOfDay.setUTCHours(Math.floor(closeMinute / 60), closeMinute % 60, 0, 0);

    if (end <= endOfDay) {
      const endMinute = getMinuteOfDay(end);
      const effectiveEnd = Math.min(Math.max(endMinute, openMinute), closeMinute);
      total += Math.max(0, effectiveEnd - effectiveStart);
      break;
    }

    total += closeMinute - effectiveStart;
    cursor = advanceToNextDay(cursor);
  }

  return total;
}
