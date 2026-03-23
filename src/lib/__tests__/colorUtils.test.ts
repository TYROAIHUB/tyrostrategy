import { describe, it, expect } from "vitest";
import { progressColor, hexToHSL } from "../colorUtils";

describe("progressColor", () => {
  it("returns green (#22c55e) for 100%", () => {
    expect(progressColor(100)).toBe("#22c55e");
  });

  it("returns green (#22c55e) for values above 100%", () => {
    expect(progressColor(150)).toBe("#22c55e");
  });

  it("returns light green (#4ade80) for 75-99%", () => {
    expect(progressColor(75)).toBe("#4ade80");
    expect(progressColor(99)).toBe("#4ade80");
  });

  it("returns yellow (#facc15) for 50-74%", () => {
    expect(progressColor(50)).toBe("#facc15");
    expect(progressColor(74)).toBe("#facc15");
  });

  it("returns orange (#fb923c) for 25-49%", () => {
    expect(progressColor(25)).toBe("#fb923c");
    expect(progressColor(49)).toBe("#fb923c");
  });

  it("returns red (#ef4444) for below 25%", () => {
    expect(progressColor(0)).toBe("#ef4444");
    expect(progressColor(24)).toBe("#ef4444");
  });

  it("returns red for negative values", () => {
    expect(progressColor(-10)).toBe("#ef4444");
  });
});

describe("hexToHSL", () => {
  it("converts pure red (#ff0000)", () => {
    expect(hexToHSL("#ff0000")).toBe("0 100% 50%");
  });

  it("converts pure green (#00ff00)", () => {
    expect(hexToHSL("#00ff00")).toBe("120 100% 50%");
  });

  it("converts pure blue (#0000ff)", () => {
    expect(hexToHSL("#0000ff")).toBe("240 100% 50%");
  });

  it("converts white (#ffffff) as achromatic", () => {
    expect(hexToHSL("#ffffff")).toBe("0 0% 100%");
  });

  it("converts black (#000000) as achromatic", () => {
    expect(hexToHSL("#000000")).toBe("0 0% 0%");
  });

  it("converts a mid-grey (#808080) as achromatic", () => {
    const result = hexToHSL("#808080");
    expect(result).toBe("0 0% 50%");
  });

  it("converts a typical color (#fb923c)", () => {
    const result = hexToHSL("#fb923c");
    // Should produce an HSL string with three space-separated parts
    const parts = result.split(" ");
    expect(parts).toHaveLength(3);
    expect(parts[1]).toContain("%");
    expect(parts[2]).toContain("%");
  });
});
