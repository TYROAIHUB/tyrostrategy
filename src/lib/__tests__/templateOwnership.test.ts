import { describe, it, expect } from "vitest";
import { sameEmail, isOwnReportTemplate } from "@/lib/templateOwnership";

/**
 * Regresyon: 449ff9a rapor şablonlarını tüm adminlere GÖRÜNÜR yaptı ama
 * silme/üzerine yazma yetkisini sahibine kilitlemeyi atladı — bir admin
 * listede gördüğü başka bir adminin şablonunu silebiliyordu.
 * Kullanıcı kuralı: "görebilmeliyim ama silmemeliyim."
 */
describe("sameEmail", () => {
  it("büyük/küçük harf farkını yok sayar", () => {
    expect(sameEmail("Cenk.Sayli@tiryaki.com.tr", "cenk.sayli@tiryaki.com.tr")).toBe(true);
  });

  it("baştaki/sondaki boşluğu yok sayar", () => {
    expect(sameEmail("  a@b.com ", "a@b.com")).toBe(true);
  });

  it("farklı kullanıcıları ayırt eder", () => {
    expect(sameEmail("a@tiryaki.com.tr", "b@tiryaki.com.tr")).toBe(false);
  });

  it("boş/eksik değerde ASLA eşleşme vermez (fail-closed)", () => {
    expect(sameEmail(null, "a@b.com")).toBe(false);
    expect(sameEmail("a@b.com", undefined)).toBe(false);
    expect(sameEmail(null, null)).toBe(false);
    expect(sameEmail("", "")).toBe(false);
  });
});

describe("isOwnReportTemplate", () => {
  const me = "cenk.sayli@tiryaki.com.tr";

  it("kendi şablonu → sahibi", () => {
    expect(isOwnReportTemplate(me, me)).toBe(true);
  });

  it("şablonun sahibi farklı yazımda da olsa sahibi", () => {
    expect(isOwnReportTemplate("Cenk.Sayli@Tiryaki.com.tr", me)).toBe(true);
  });

  it("BAŞKA bir adminin şablonu → sahibi DEĞİL (silinemez)", () => {
    expect(isOwnReportTemplate("diger.admin@tiryaki.com.tr", me)).toBe(false);
  });

  it("ownerEmail yoksa yerel şablondur → sahibi kullanıcıdır", () => {
    expect(isOwnReportTemplate(undefined, me)).toBe(true);
    expect(isOwnReportTemplate(null, me)).toBe(true);
    expect(isOwnReportTemplate("", me)).toBe(true);
  });
});
