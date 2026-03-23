import { describe, it, expect } from "vitest";
import { toCalendarDate, fromCalendarDate } from "../utils";
import { CalendarDate } from "@internationalized/date";

describe("toCalendarDate", () => {
  it("parses a valid date string", () => {
    const result = toCalendarDate("2024-06-15");
    expect(result).not.toBeNull();
    expect(result!.year).toBe(2024);
    expect(result!.month).toBe(6);
    expect(result!.day).toBe(15);
  });

  it("returns null for empty string", () => {
    expect(toCalendarDate("")).toBeNull();
  });

  it("returns null for invalid format (too few parts)", () => {
    expect(toCalendarDate("2024-06")).toBeNull();
  });

  it("returns null for non-numeric parts", () => {
    expect(toCalendarDate("abc-de-fg")).toBeNull();
  });

  it("returns null for non-date strings", () => {
    expect(toCalendarDate("not-a-date")).toBeNull();
  });
});

describe("fromCalendarDate", () => {
  it("formats a CalendarDate to YYYY-MM-DD", () => {
    const date = new CalendarDate(2024, 1, 5);
    expect(fromCalendarDate(date)).toBe("2024-01-05");
  });

  it("returns empty string for null", () => {
    expect(fromCalendarDate(null)).toBe("");
  });

  it("pads single-digit month and day", () => {
    const date = new CalendarDate(2024, 3, 9);
    expect(fromCalendarDate(date)).toBe("2024-03-09");
  });

  it("handles double-digit month and day without extra padding", () => {
    const date = new CalendarDate(2024, 12, 25);
    expect(fromCalendarDate(date)).toBe("2024-12-25");
  });
});
