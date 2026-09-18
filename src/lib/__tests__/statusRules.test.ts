import { describe, it, expect } from "vitest";
import {
  suggestStatusFromProgress,
  rollUpProje,
  planStatusRefresh,
  type AksiyonShape,
  type ProjeShape,
  type StatusThresholds,
} from "@/lib/statusRules";

/**
 * Bu modül hem uygulamanın hem haftalık zamanlanmış işin ORTAK beyni.
 * Buradaki testler ikisini birden koruyor.
 */

const ESIK: StatusThresholds = { behindThreshold: 15, atRiskThreshold: 5 };
// Sabit zaman: kural takvime baktığı için test zamana bağımlı olmamalı.
const BASLANGIC = "2026-01-01";
const BITIS = "2026-12-31";
const YILIN_YARISI = new Date("2026-07-02").getTime(); // ~%50 beklenen ilerleme

describe("suggestStatusFromProgress", () => {
  it("%100 her zaman Achieved — takvime bakmaz", () => {
    expect(suggestStatusFromProgress(100, BASLANGIC, BITIS, ESIK, YILIN_YARISI)).toBe("Achieved");
  });

  it("beklenenin çok gerisi High Risk, az gerisi At Risk", () => {
    // Beklenen ~%50. Fark > 15 → High Risk, > 5 → At Risk.
    expect(suggestStatusFromProgress(20, BASLANGIC, BITIS, ESIK, YILIN_YARISI)).toBe("High Risk");
    expect(suggestStatusFromProgress(42, BASLANGIC, BITIS, ESIK, YILIN_YARISI)).toBe("At Risk");
    expect(suggestStatusFromProgress(48, BASLANGIC, BITIS, ESIK, YILIN_YARISI)).toBe("On Track");
  });

  it("eşikler DIŞARIDAN geliyor — Ayarlar'dan değişince sonuç değişir", () => {
    const gevsek: StatusThresholds = { behindThreshold: 40, atRiskThreshold: 30 };
    expect(suggestStatusFromProgress(20, BASLANGIC, BITIS, ESIK, YILIN_YARISI)).toBe("High Risk");
    expect(suggestStatusFromProgress(20, BASLANGIC, BITIS, gevsek, YILIN_YARISI)).toBe("On Track");
  });

  it("ilerleme 0 ve gecikme yoksa Not Started", () => {
    const hemenBasinda = new Date("2026-01-02").getTime();
    expect(suggestStatusFromProgress(0, BASLANGIC, BITIS, ESIK, hemenBasinda)).toBe("Not Started");
  });

  it("tarih yoksa ya da bitiş başlangıçtan önceyse takvime bakmaz", () => {
    expect(suggestStatusFromProgress(0, "", "", ESIK, YILIN_YARISI)).toBe("Not Started");
    expect(suggestStatusFromProgress(30, "", "", ESIK, YILIN_YARISI)).toBe("On Track");
    expect(suggestStatusFromProgress(30, BITIS, BASLANGIC, ESIK, YILIN_YARISI)).toBe("On Track");
  });
});

function aksiyon(over: Partial<AksiyonShape> = {}): AksiyonShape {
  return {
    id: "A26-0001", projeId: "P26-0001", name: "Aksiyon",
    status: "On Track", progress: 50, startDate: BASLANGIC, endDate: BITIS, ...over,
  };
}
function proje(over: Partial<ProjeShape> = {}): ProjeShape {
  return { id: "P26-0001", name: "Proje", status: "On Track", progress: 50, ...over };
}

describe("rollUpProje", () => {
  it("ilerleme aksiyonların ortalaması", () => {
    const r = rollUpProje(proje(), [aksiyon({ progress: 40 }), aksiyon({ id: "A2", progress: 70 })]);
    expect(r!.progress).toBe(55);
  });

  it("eskalasyon: bir High Risk hepsini High Risk yapar", () => {
    const r = rollUpProje(proje(), [aksiyon({ status: "Achieved" }), aksiyon({ id: "A2", status: "High Risk" })]);
    expect(r!.status).toBe("High Risk");
  });

  it("At Risk, High Risk'ten sonra gelir", () => {
    const r = rollUpProje(proje(), [aksiyon({ status: "On Track" }), aksiyon({ id: "A2", status: "At Risk" })]);
    expect(r!.status).toBe("At Risk");
  });

  it("hepsi Achieved ise proje Achieved ve tarih damgalanır", () => {
    const r = rollUpProje(proje({ status: "On Track" }), [aksiyon({ status: "Achieved" })], () => "2026-05-05T00:00:00.000Z");
    expect(r!.status).toBe("Achieved");
    expect(r!.completedAt).toBe("2026-05-05T00:00:00.000Z");
  });

  it("zaten Achieved ise tarihe DOKUNULMAZ — tarih uydurulmaz", () => {
    const r = rollUpProje(proje({ status: "Achieved" }), [aksiyon({ status: "Achieved" })]);
    expect(r!.completedAt).toBeUndefined();
  });

  it("Achieved değilse tamamlanma tarihi temizlenir (null)", () => {
    const r = rollUpProje(proje(), [aksiyon({ status: "At Risk" })]);
    expect(r!.completedAt).toBeNull();
  });

  it("On Hold / Cancelled otomatik ezilmez, sadece ilerleme güncellenir", () => {
    for (const s of ["On Hold", "Cancelled"] as const) {
      const r = rollUpProje(proje({ status: s, progress: 0 }), [aksiyon({ progress: 80, status: "High Risk" })]);
      expect(r!.status).toBe(s);
      expect(r!.progress).toBe(80);
      expect(r!.completedAt).toBeUndefined();
    }
  });

  it("aksiyonu olmayan proje için null döner — dokunulmaz", () => {
    expect(rollUpProje(proje(), [])).toBeNull();
  });
});

describe("planStatusRefresh", () => {
  it("yaşam döngüsü statüsündeki aksiyonlara dokunmaz", () => {
    const aksiyonlar = (["On Hold", "Cancelled", "Achieved"] as const).map((s, i) =>
      aksiyon({ id: `A${i}`, status: s, progress: 0 }),
    );
    const plan = planStatusRefresh([proje()], aksiyonlar, ESIK, YILIN_YARISI);
    expect(plan.aksiyonlar).toHaveLength(0);
  });

  it("gecikmiş aksiyonu düşürür ve projeyi ona göre günceller", () => {
    const plan = planStatusRefresh(
      [proje({ status: "On Track", progress: 50 })],
      [aksiyon({ progress: 10 })],
      ESIK, YILIN_YARISI,
    );
    expect(plan.aksiyonlar[0].status).toBe("High Risk");
    expect(plan.projeler[0].status).toBe("High Risk");
    expect(plan.projeler[0].progress).toBe(10);
  });

  it("İDEMPOTENT: ikinci geçiş sıfır değişiklik üretir", () => {
    // Haftalık işin en kritik özelliği — aksi halde her koşuşta aynı kayıtları
    // tekrar tekrar yazar ve hiç yakınsamazdı.
    const projeler = [proje({ status: "On Track", progress: 50 })];
    const aksiyonlar = [aksiyon({ progress: 10 })];
    const ilk = planStatusRefresh(projeler, aksiyonlar, ESIK, YILIN_YARISI);
    expect(ilk.aksiyonlar.length + ilk.projeler.length).toBeGreaterThan(0);

    const uygulanmis = projeler.map((p) => {
      const c = ilk.projeler.find((x) => x.id === p.id);
      return c ? { ...p, progress: c.progress, status: c.status, completedAt: c.completedAt ?? undefined } : p;
    });
    const ikinci = planStatusRefresh(uygulanmis, ilk.nextAksiyonlar, ESIK, YILIN_YARISI);
    expect(ikinci.aksiyonlar).toHaveLength(0);
    expect(ikinci.projeler).toHaveLength(0);
  });

  it("%100'e ulaşan aksiyon Achieved olur ve tarih damgalanır", () => {
    const plan = planStatusRefresh([proje()], [aksiyon({ progress: 100, status: "On Track" })], ESIK, YILIN_YARISI);
    expect(plan.aksiyonlar[0].status).toBe("Achieved");
    expect(typeof plan.aksiyonlar[0].completedAt).toBe("string");
  });

  it("Achieved olmayan aksiyondaki kalıntı tarih temizlenir", () => {
    const plan = planStatusRefresh(
      [proje()],
      [aksiyon({ progress: 50, status: "On Track", completedAt: "2026-02-02T00:00:00.000Z" })],
      ESIK, YILIN_YARISI,
    );
    expect(plan.aksiyonlar[0].completedAt).toBeNull();
  });
});
