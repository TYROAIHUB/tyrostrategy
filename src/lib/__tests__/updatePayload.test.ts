import { describe, it, expect } from "vitest";
import { clearIfEmptied } from "@/lib/updatePayload";

describe("clearIfEmptied — temizle mi, dokunma mı", () => {
  it("kullanıcı değer bıraktıysa onu geçiriyor", () => {
    expect(clearIfEmptied(undefined, "AST-PROC")).toBe("AST-PROC");
    expect(clearIfEmptied("AST-PORT", "AST-PROC")).toBe("AST-PROC");
  });

  it("dolu bir alan boşaltıldıysa TEMİZLE (null)", () => {
    expect(clearIfEmptied("loc-1", undefined)).toBeNull();
    expect(clearIfEmptied(1_000_000, undefined)).toBeNull();
  });

  it("REGRESYON: yüklenen kayıtta da boşsa DOKUNMA (undefined)", () => {
    // Bu dal kritik: form varsayılanları BELLEKTEKİ kayıttan geliyor ve
    // uygulamada veri tazeleme yok. Burada `null` dönseydi, sabahtan açık bir
    // sekmede sadece ilerlemeyi değiştirip kaydeden kullanıcı, o arada
    // başkasının girdiği değeri NULL'a çekerdi.
    expect(clearIfEmptied(undefined, undefined)).toBeUndefined();
    expect(clearIfEmptied(null, undefined)).toBeUndefined();
  });

  it("0 geçerli bir değer — 'yok' sayılmıyor", () => {
    // CAPEX 0 gerçek bir tutar; boşaltılırsa temizlenmeli.
    expect(clearIfEmptied(0, undefined)).toBeNull();
    expect(clearIfEmptied(0, 500)).toBe(500);
  });

  it("boş string de geçerli bir yüklenmiş değer sayılıyor", () => {
    expect(clearIfEmptied("", undefined)).toBeNull();
  });
});
