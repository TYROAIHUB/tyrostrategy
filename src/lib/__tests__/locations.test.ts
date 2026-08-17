import { describe, it, expect } from "vitest";
import { formatLocationLabel, resolveLocationLabel, LOCATION_SEPARATOR } from "../locations";
import type { LocationDefinition } from "@/types";

const LOCATIONS: LocationDefinition[] = [
  { id: "loc-1", country: "Türkiye", city: "İstanbul" },
  { id: "loc-2", country: "Irak", city: "Basra" },
];

describe("formatLocationLabel", () => {
  it("joins country and city with the shared separator", () => {
    expect(formatLocationLabel(LOCATIONS[0])).toBe(`Türkiye${LOCATION_SEPARATOR}İstanbul`);
  });

  it("returns an empty string for undefined and null", () => {
    expect(formatLocationLabel(undefined)).toBe("");
    expect(formatLocationLabel(null)).toBe("");
  });
});

describe("resolveLocationLabel", () => {
  it("resolves a known id to its label", () => {
    expect(resolveLocationLabel("loc-2", LOCATIONS)).toBe("Irak / Basra");
  });

  it("returns empty string when the project has no location (optional field)", () => {
    expect(resolveLocationLabel(undefined, LOCATIONS)).toBe("");
    expect(resolveLocationLabel("", LOCATIONS)).toBe("");
    expect(resolveLocationLabel(null, LOCATIONS)).toBe("");
  });

  it("returns empty string when the definition was deleted (dangling id)", () => {
    // ON DELETE SET NULL sunucuda halleder, ama local store henüz eski id'yi
    // taşıyorsa UI çökmemeli — boş dönüp çağıran "—" basmalı.
    expect(resolveLocationLabel("loc-silinmis", LOCATIONS)).toBe("");
  });

  it("returns empty string when there are no definitions at all", () => {
    expect(resolveLocationLabel("loc-1", [])).toBe("");
  });
});
