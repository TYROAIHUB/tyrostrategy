import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock i18n before importing dateUtils
vi.mock("i18next", () => ({
  default: {
    language: "tr",
  },
}));

import i18n from "i18next";
import { formatDate, formatDateTime, todayISO } from "../dateUtils";

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

describe("todayISO — YEREL tarih", () => {
  it("yerel gün/ay/yılı YYYY-MM-DD olarak veriyor", () => {
    expect(todayISO(new Date(2026, 9, 8, 14, 30))).toBe("2026-10-08");
  });

  it("tek haneli ay ve günü sıfırla dolduruyor", () => {
    expect(todayISO(new Date(2026, 0, 5, 9, 0))).toBe("2026-01-05");
  });

  it("REGRESYON: gece yarısından sonra DÜNÜ göstermiyor", () => {
    // `toISOString().slice(0,10)` UTC verir; TR (UTC+3) saat 01:00'de bir
    // önceki günü döndürürdü. Kullanıcının takvimde gördüğü gün ile
    // uygulamanın yazdığı gün aynı olmalı.
    const geceYarisiSonrasi = new Date(2026, 9, 8, 1, 0); // 8 Ekim 01:00 yerel
    expect(todayISO(geceYarisiSonrasi)).toBe("2026-10-08");
  });

  it("yıl sonunda da yerel günü koruyor", () => {
    expect(todayISO(new Date(2026, 11, 31, 23, 30))).toBe("2026-12-31");
  });
});
