import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * "Verileri yenile" YAKINSAMA testi — uçtan uca.
 *
 * Kullanıcının bildirdiği hata: butona her basışta aynı sayı çıkıyordu
 * ("Statü tazelendi: 0 aksiyon, 14 proje"), 5 dakika arayla bile. Sebep:
 * Achieved'dan çıkmış projelerde `recalcProjeProgress` completedAt'i doğru
 * şekilde temizliyordu, ama temizleme niyeti adapter'a `undefined` olarak
 * gidiyordu; `projeToDb`'nin `!== undefined` guard'ı alanı PATCH gövdesinden
 * düşürüyordu. Veritabanındaki eski tarih hiç silinmiyor, bir sonraki
 * "verileri yenile" onu tekrar okuyup tekrar "değişti" sayıyordu. Sonsuz döngü.
 *
 * Bu test mağazayı GERÇEK Supabase modunda koşturup adapter'a giden PATCH
 * gövdesini yakalar — yani hem sayımı hem de veritabanına gerçekten NULL
 * yazıldığını doğrular.
 */

const patches: { table: string; body: Record<string, unknown> }[] = [];

vi.mock("@/lib/supabaseMode", () => ({ isSupabaseMode: true }));

vi.mock("@/lib/data/mock-adapter", () => ({
  getInitialProjeler: () => [],
  getInitialAksiyonlar: () => [],
  getInitialData: () => ({ projeler: [], aksiyonlar: [] }),
  getInitialTagDefinitions: () => [],
  getInitialLocations: () => [],
}));

vi.mock("@/lib/supabase", () => {
  const makeChain = (table: string) => {
    const chain: Record<string, unknown> = {};
    for (const m of ["eq", "select", "insert", "delete", "in", "order", "limit"]) chain[m] = () => chain;
    chain.update = (body: Record<string, unknown>) => { patches.push({ table, body }); return chain; };
    chain.single = () => Promise.resolve({ data: { id: "X" }, error: null });
    chain.then = (r: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(r);
    chain.catch = () => chain;
    return chain;
  };
  return {
    supabase: { from: (t: string) => makeChain(t) },
    isSupabaseConfigured: true,
    setSupabaseUserContext: () => {},
    getSupabaseUserContext: () => null,
  };
});

const { useDataStore } = await import("../dataStore");

/** Achieved'dan çıkmış ama completed_at'i DB'de kalmış bir proje kurar. */
function seedStaleProject() {
  useDataStore.setState({
    projeler: [{
      id: "P26-0230",
      name: "Amerika Fıstık Tesisi",
      source: "Kurumsal",
      status: "On Track",
      owner: "Cenk Şayli",
      participants: [],
      department: "IT",
      progress: 92,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      // Kalıntı: bir zamanlar Achieved'dı, sonra çıktı, tarih DB'de kaldı
      completedAt: "2026-08-21T00:00:00.000Z",
    }],
    aksiyonlar: [{
      id: "A26-0001",
      projeId: "P26-0230",
      name: "Aksiyon",
      owner: "Cenk Şayli",
      status: "On Track",
      progress: 92,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    }],
    locations: [],
  });
}

describe("refreshDerivedStatuses — yakınsama", () => {
  beforeEach(() => { patches.length = 0; });

  it("REGRESYON: kalıntı completedAt için PATCH gövdesine NULL yazıyor", () => {
    seedStaleProject();
    const result = useDataStore.getState().refreshDerivedStatuses();

    expect(result.projeler).toBe(1);
    const projePatch = patches.find((p) => p.table === "projeler");
    expect(projePatch, "projeler tablosuna PATCH gitmeli").toBeDefined();
    // Asıl hata buradaydı: alan gövdeye HİÇ girmiyordu.
    expect("completed_at" in projePatch!.body).toBe(true);
    expect(projePatch!.body.completed_at).toBeNull();
  });

  it("İKİNCİ basışta 0 döndürüyor — sonsuz döngü bitti", () => {
    seedStaleProject();
    const first = useDataStore.getState().refreshDerivedStatuses();
    expect(first.projeler).toBe(1);

    // İkinci basış: DB'ye NULL yazıldığı için yeniden okumada da temiz gelir;
    // yerel durum da temizlendiği için burada doğrudan tekrar çağırabiliyoruz.
    const second = useDataStore.getState().refreshDerivedStatuses();
    expect(second.projeler).toBe(0);
    expect(second.aksiyonlar).toBe(0);
  });

  it("yerel durumda null bırakmıyor — undefined'a çeviriyor", () => {
    seedStaleProject();
    useDataStore.getState().refreshDerivedStatuses();
    const p = useDataStore.getState().projeler[0];
    expect(p.completedAt).toBeUndefined();
    expect(JSON.stringify(p)).not.toContain("null");
  });

  it("Achieved projenin tamamlanma tarihine DOKUNMUYOR", () => {
    // Tarih uydurmuyoruz: dolu olan korunur, boş olan boş kalır.
    seedStaleProject();
    useDataStore.setState((s) => ({
      projeler: s.projeler.map((p) => ({ ...p, status: "Achieved", completedAt: "2026-03-01T00:00:00.000Z" })),
      aksiyonlar: s.aksiyonlar.map((a) => ({ ...a, status: "Achieved", progress: 100 })),
    }));
    patches.length = 0;
    useDataStore.getState().refreshDerivedStatuses();
    expect(useDataStore.getState().projeler[0].completedAt).toBe("2026-03-01T00:00:00.000Z");
  });

  it("REGRESYON: %100'e ulaşıp otomatik Achieved olan aksiyona tarih BASIYOR", () => {
    // Bu dal önceki sürümde koşulsuz `completedAt: null` gönderiyordu: aksiyon
    // Achieved'a geçiyor ama tamamlanma tarihi hiç oluşmuyordu.
    seedStaleProject();
    useDataStore.setState((s) => ({
      projeler: s.projeler.map((p) => ({ ...p, completedAt: undefined })),
      aksiyonlar: s.aksiyonlar.map((a) => ({ ...a, progress: 100, status: "On Track" as const })),
    }));
    patches.length = 0;
    const result = useDataStore.getState().refreshDerivedStatuses();

    expect(result.aksiyonlar).toBe(1);
    const aksiyonPatch = patches.find((p) => p.table === "aksiyonlar");
    expect(aksiyonPatch!.body.status).toBe("Achieved");
    expect(aksiyonPatch!.body.completed_at).not.toBeNull();
    expect(typeof aksiyonPatch!.body.completed_at).toBe("string");
    expect(useDataStore.getState().aksiyonlar[0].completedAt).toBeTruthy();
  });

  it("zaten tarihi olan Achieved aksiyonun tarihini yeniden yazmıyor", () => {
    seedStaleProject();
    useDataStore.setState((s) => ({
      aksiyonlar: s.aksiyonlar.map((a) => ({
        ...a, progress: 100, status: "On Track" as const,
        completedAt: "2026-02-02T00:00:00.000Z",
      })),
    }));
    patches.length = 0;
    useDataStore.getState().refreshDerivedStatuses();
    expect(useDataStore.getState().aksiyonlar[0].completedAt).toBe("2026-02-02T00:00:00.000Z");
  });

  it("kalıntı completedAt'i olan aksiyonu da temizliyor", () => {
    // Aksiyon tarafında da 15 kayıt bu durumdaydı: statü doğru olduğu için
    // eski kod satıra hiç dokunmuyordu, tarih kalıyordu.
    seedStaleProject();
    useDataStore.setState((s) => ({
      aksiyonlar: s.aksiyonlar.map((a) => ({ ...a, completedAt: "2026-07-01T00:00:00.000Z" })),
    }));
    patches.length = 0;
    const result = useDataStore.getState().refreshDerivedStatuses();

    expect(result.aksiyonlar).toBe(1);
    const aksiyonPatch = patches.find((p) => p.table === "aksiyonlar");
    expect(aksiyonPatch!.body.completed_at).toBeNull();
    expect(useDataStore.getState().aksiyonlar[0].completedAt).toBeUndefined();
  });
});
