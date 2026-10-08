import { describe, it, expect } from "vitest";
import { resolveShowReviewDate } from "@/lib/reportTemplateConfig";

/**
 * Kullanıcı isteği 2026-10-08: rapordaki "Kontrol tarihi" görünür olmalı
 * ama gizlenebilmeli. Alan yeni eklendiği için ESKİ şablonlarda yok —
 * "yok" durumu kapalı sayılmamalı, varsayılana (açık) düşmeli.
 */
describe("resolveShowReviewDate", () => {
  it("alan hiç kaydedilmemişse varsayılan AÇIK", () => {
    expect(resolveShowReviewDate(undefined)).toBe(true);
  });

  it("null da kaydedilmemiş sayılır → AÇIK", () => {
    expect(resolveShowReviewDate(null)).toBe(true);
  });

  it("kullanıcı bilerek kapattıysa KAPALI kalır", () => {
    expect(resolveShowReviewDate(false)).toBe(false);
  });

  it("açıkça true ise açık", () => {
    expect(resolveShowReviewDate(true)).toBe(true);
  });
});
