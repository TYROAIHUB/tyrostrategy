import { CalendarDate } from "@internationalized/date";

export function toCalendarDate(dateStr: string): CalendarDate | null {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    return new CalendarDate(parts[0], parts[1], parts[2]);
  } catch {
    return null;
  }
}

export function fromCalendarDate(date: CalendarDate | null): string {
  if (!date) return "";
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}
