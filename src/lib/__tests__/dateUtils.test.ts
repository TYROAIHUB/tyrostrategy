import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock i18n before importing dateUtils
vi.mock("i18next", () => ({
  default: {
    language: "tr",
  },
}));

import i18n from "i18next";
import { formatDate, formatDateTime } from "../dateUtils";

beforeEach(() => {
  // Reset to Turkish
  (i18n as { language: string }).language = "tr";
});

describe("formatDate", () => {
  it("returns formatted date for valid date string (Turkish locale)", () => {
    const result = formatDate("2024-06-15");
    // Turkish locale format: DD.MM.YYYY
    expect(result).toContain("2024");
    expect(result).toContain("6");
    expect(result).toContain("15");
  });

  it("returns '-' for empty string", () => {
    expect(formatDate("")).toBe("-");
  });

  it("returns formatted date for valid ISO string", () => {
    const result = formatDate("2024-01-01T00:00:00.000Z");
    expect(result).toBeTruthy();
    expect(result).not.toBe("-");
  });

  it("uses en-US locale when i18n language is 'en'", () => {
    (i18n as { language: string }).language = "en";
    const result = formatDate("2024-06-15");
    // en-US format: M/D/YYYY
    expect(result).toContain("2024");
    expect(result).toContain("6");
    expect(result).toContain("15");
  });

  it("uses tr-TR locale when i18n language is 'tr'", () => {
    (i18n as { language: string }).language = "tr";
    const result = formatDate("2024-06-15");
    // tr-TR format: DD.MM.YYYY
    expect(result).toContain("2024");
  });
});

describe("formatDateTime", () => {
  it("returns formatted date-time for valid date string", () => {
    const result = formatDateTime("2024-06-15T14:30:00");
    expect(result).toBeTruthy();
    expect(result).not.toBe("-");
    // Should contain date parts
    expect(result).toContain("2024");
    expect(result).toContain("15");
  });

  it("returns '-' for empty string", () => {
    expect(formatDateTime("")).toBe("-");
  });

  it("includes time components in output", () => {
    const result = formatDateTime("2024-06-15T14:30:00");
    // Should include some time indicator
    expect(result.length).toBeGreaterThan(10); // Longer than just a date
  });

  it("uses en-US locale when i18n language is 'en'", () => {
    (i18n as { language: string }).language = "en";
    const result = formatDateTime("2024-06-15T14:30:00");
    expect(result).toBeTruthy();
    expect(result).not.toBe("-");
  });
});
