import { describe, it, expect } from "vitest";
import { parseCapexInput, formatCapex, formatCapexCompact, CAPEX_CURRENCY } from "../money";

describe("parseCapexInput", () => {
  it("parses a plain integer", () => {
    expect(parseCapexInput("1250000")).toBe(1250000);
  });

  it("parses TR-style thousand separators (dots)", () => {
    expect(parseCapexInput("1.250.000")).toBe(1250000);
  });

  it("parses EN-style thousand separators (commas)", () => {
    expect(parseCapexInput("1,250,000")).toBe(1250000);
  });

  it("treats a trailing 1-2 digit group as decimals", () => {
    expect(parseCapexInput("1250000.50")).toBe(1250000.5);
    expect(parseCapexInput("1.250.000,75")).toBe(1250000.75);
    expect(parseCapexInput("12,5")).toBe(12.5);
  });

  it("treats a trailing 3-digit group as a thousand separator", () => {
    expect(parseCapexInput("1.250")).toBe(1250);
    expect(parseCapexInput("1,250")).toBe(1250);
  });

  it("ignores surrounding and inner whitespace", () => {
    expect(parseCapexInput("  1 250 000 ")).toBe(1250000);
  });

  it("accepts zero — 0 is a valid amount, not 'empty'", () => {
    expect(parseCapexInput("0")).toBe(0);
  });

  it("returns null for empty input (optional field)", () => {
    expect(parseCapexInput("")).toBeNull();
    expect(parseCapexInput("   ")).toBeNull();
  });

  it("returns null for non-numeric junk", () => {
    expect(parseCapexInput("abc")).toBeNull();
    expect(parseCapexInput("12abc")).toBeNull();
    expect(parseCapexInput("-500")).toBeNull(); // negatif CAPEX yok (DB CHECK ile aynı)
  });
});

describe("formatCapex", () => {
  it("groups digits and appends the currency", () => {
    const out = formatCapex(1250000, "tr");
    expect(out).toContain(CAPEX_CURRENCY);
    expect(out.replace(/\s/g, "")).toBe(`1.250.000${CAPEX_CURRENCY}`);
  });

  it("drops decimals for whole numbers", () => {
    expect(formatCapex(1000, "tr")).not.toContain(",");
  });

  it("returns empty string when the value is missing (optional field)", () => {
    expect(formatCapex(undefined)).toBe("");
    expect(formatCapex(null)).toBe("");
  });

  it("formats zero rather than treating it as empty", () => {
    expect(formatCapex(0, "tr")).toBe(`0 ${CAPEX_CURRENCY}`);
  });
});

describe("formatCapexCompact", () => {
  it("abbreviates millions", () => {
    expect(formatCapexCompact(1250000, "tr")).toBe(`1,25 Mn ${CAPEX_CURRENCY}`);
    expect(formatCapexCompact(1250000, "en")).toBe(`1.25 M ${CAPEX_CURRENCY}`);
  });

  it("abbreviates values from ten thousand up", () => {
    expect(formatCapexCompact(12000, "tr")).toBe(`12 B ${CAPEX_CURRENCY}`);
    expect(formatCapexCompact(12000, "en")).toBe(`12 K ${CAPEX_CURRENCY}`);
  });

  it("falls back to the full format below the threshold", () => {
    expect(formatCapexCompact(500, "tr")).toBe(`500 ${CAPEX_CURRENCY}`);
  });

  it("returns empty string when missing", () => {
    expect(formatCapexCompact(undefined)).toBe("");
  });
});
