import { describe, it, expect } from "vitest";
import { EXECUTIVE_BOARD, executiveLabel, executiveTooltip } from "@/config/executiveBoard";

describe("executiveLabel — matris satır etiketi", () => {
  it("kısa ünvan tanımlıysa ADIN YERİNE onu gösteriyor", () => {
    // Kullanıcı isteği: matriste "Bahadır Açık" değil "COO" görünsün.
    expect(executiveLabel("Bahadır Açık")).toBe("COO");
    expect(executiveLabel("Süleyman Tiryakioğlu")).toBe("CEO");
  });

  it("kısa ünvanı olmayan üyede ada düşüyor — liste eksik kısaltmayla bozulmuyor", () => {
    const kisaltmasiz = EXECUTIVE_BOARD.find((e) => !e.shortTitle);
    expect(kisaltmasiz, "kısaltması olmayan en az bir üye bekleniyordu").toBeDefined();
    expect(executiveLabel(kisaltmasiz!.name)).toBe(kisaltmasiz!.name);
  });

  it("listede olmayan ad olduğu gibi dönüyor", () => {
    expect(executiveLabel("Bilinmeyen Kişi")).toBe("Bilinmeyen Kişi");
  });
});

describe("executiveTooltip — kişi adı GÖSTERİLMEZ", () => {
  it("kısa ünvanı olan üyede adı değil, uzun ünvanı veriyor", () => {
    // Kullanıcı isteği: "Bahadır açık yazmasın orada üzerine gelince de".
    expect(executiveTooltip("Bahadır Açık")).toBe("Başkan Yardımcısı / Operasyon");
    expect(executiveTooltip("Bahadır Açık")).not.toContain("Bahadır");
  });

  it("listede olmayan ad olduğu gibi dönüyor", () => {
    expect(executiveTooltip("Bilinmeyen Kişi")).toBe("Bilinmeyen Kişi");
  });
});

describe("EXECUTIVE_BOARD tutarlılığı", () => {
  it("her üyenin adı benzersiz — etiket çözümü tekil olmalı", () => {
    const adlar = EXECUTIVE_BOARD.map((e) => e.name);
    expect(new Set(adlar).size).toBe(adlar.length);
  });

  it("tanımlı kısa ünvanlar benzersiz — iki satır aynı etiketi taşımasın", () => {
    const kisa = EXECUTIVE_BOARD.map((e) => e.shortTitle).filter(Boolean);
    expect(new Set(kisa).size).toBe(kisa.length);
  });
});
