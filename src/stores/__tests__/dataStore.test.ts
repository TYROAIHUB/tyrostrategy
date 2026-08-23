import { describe, it, expect, beforeEach, vi } from "vitest";
import { useDataStore } from "../dataStore";
import { useUIStore } from "../uiStore";
import type { Aksiyon, Proje } from "@/types";

// Mock mock-adapter
vi.mock("@/lib/data/mock-adapter", () => ({
  getInitialProjeler: () => [],
  getInitialAksiyonlar: () => [],
  getInitialData: () => ({ projeler: [], aksiyonlar: [] }),
  getInitialTagDefinitions: () => [],
  getInitialLocations: () => [],
}));

// Reset the store before each test to avoid shared state
beforeEach(() => {
  useDataStore.setState({
    projeler: [],
    aksiyonlar: [],
    locations: [],
  });
});

describe("Proje CRUD", () => {
  it("addProje adds a new proje with generated id", () => {
    useDataStore.getState().addProje({
      name: "Test Proje",
      source: "Kurumsal",
      status: "On Track",
      owner: "Test Owner",
      participants: ["Test Owner"],
      department: "IT",
      progress: 0,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });

    const projeler = useDataStore.getState().projeler;
    expect(projeler).toHaveLength(1);
    expect(projeler[0].name).toBe("Test Proje");
    expect(projeler[0].id).toBeTruthy();
    expect(projeler[0].id).toMatch(/^P\d{2}-\d{4}$/);
  });

  it("updateProje updates an existing proje", () => {
    useDataStore.getState().addProje({
      name: "Original",
      source: "Türkiye",
      status: "Not Started",
      owner: "Owner",
      participants: ["Owner"],
      department: "IT",
      progress: 0,
      startDate: "2024-01-01",
      endDate: "2024-06-30",
    });

    const id = useDataStore.getState().projeler[0].id;
    useDataStore.getState().updateProje(id, { name: "Updated", status: "Achieved" });

    const updated = useDataStore.getState().projeler[0];
    expect(updated.name).toBe("Updated");
    expect(updated.status).toBe("Achieved");
    expect(updated.owner).toBe("Owner"); // unchanged field
  });

  it("deleteProje removes a proje by id (when no child aksiyonlar)", () => {
    useDataStore.getState().addProje({
      name: "To Delete",
      source: "International",
      status: "High Risk",
      owner: "Owner",
      participants: ["Owner"],
      department: "IT",
      progress: 0,
      startDate: "2024-01-01",
      endDate: "2024-06-30",
    });

    const id = useDataStore.getState().projeler[0].id;
    expect(useDataStore.getState().projeler).toHaveLength(1);

    useDataStore.getState().deleteProje(id);
    expect(useDataStore.getState().projeler).toHaveLength(0);
  });

  it("getProjeById returns the correct proje", () => {
    useDataStore.getState().addProje({
      name: "Find Me",
      source: "Kurumsal",
      status: "On Track",
      owner: "Owner",
      participants: ["Owner"],
      department: "IT",
      progress: 0,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });

    const id = useDataStore.getState().projeler[0].id;
    const found = useDataStore.getState().getProjeById(id);
    expect(found).toBeDefined();
    expect(found!.name).toBe("Find Me");
  });

  it("getProjeById returns undefined for nonexistent id", () => {
    expect(useDataStore.getState().getProjeById("nonexistent")).toBeUndefined();
  });
});

describe("Aksiyon CRUD", () => {
  it("addAksiyon adds a new aksiyon with generated id", () => {
    useDataStore.getState().addAksiyon({
      projeId: "p1",
      name: "Test Aksiyon",
      owner: "Worker",
      progress: 0,
      status: "Not Started",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    });

    const aksiyonlar = useDataStore.getState().aksiyonlar;
    expect(aksiyonlar).toHaveLength(1);
    expect(aksiyonlar[0].name).toBe("Test Aksiyon");
    expect(aksiyonlar[0].id).toMatch(/^A\d{2}-\d{4}$/);
    expect(aksiyonlar[0].projeId).toBe("p1");
  });

  it("updateAksiyon updates an existing aksiyon", () => {
    useDataStore.getState().addAksiyon({
      projeId: "p1",
      name: "Original Aksiyon",
      owner: "Worker",
      progress: 0,
      status: "Not Started",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    });

    const id = useDataStore.getState().aksiyonlar[0].id;
    useDataStore.getState().updateAksiyon(id, { progress: 100, status: "Achieved" });

    const updated = useDataStore.getState().aksiyonlar[0];
    expect(updated.progress).toBe(100);
    expect(updated.status).toBe("Achieved");
    expect(updated.name).toBe("Original Aksiyon");
  });

  it("deleteAksiyon removes an aksiyon by id", () => {
    useDataStore.getState().addAksiyon({
      projeId: "p1",
      name: "To Delete",
      owner: "Worker",
      progress: 0,
      status: "Not Started",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    });

    const id = useDataStore.getState().aksiyonlar[0].id;
    useDataStore.getState().deleteAksiyon(id);
    expect(useDataStore.getState().aksiyonlar).toHaveLength(0);
  });

  it("getAksiyonlarByProjeId returns matching aksiyonlar", () => {
    useDataStore.getState().addAksiyon({
      projeId: "p1",
      name: "Aksiyon A",
      owner: "Worker",
      progress: 0,
      status: "Not Started",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    });
    useDataStore.getState().addAksiyon({
      projeId: "p2",
      name: "Aksiyon B",
      owner: "Worker",
      progress: 50,
      status: "On Track",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
    });

    const result = useDataStore.getState().getAksiyonlarByProjeId("p1");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Aksiyon A");
  });
});

// ===== Lokasyon tanımları (migration 031) =====
// Ülke + şehir aynı satırda; Ayarlar > Lokasyon sekmesinden yönetilir.
describe("Location CRUD", () => {
  it("addLocation stores country and city on the same record", () => {
    const created = useDataStore.getState().addLocation({
      country: "Türkiye",
      city: "Ankara",
    });

    const locations = useDataStore.getState().locations;
    expect(locations).toHaveLength(1);
    expect(locations[0].country).toBe("Türkiye");
    expect(locations[0].city).toBe("Ankara");
    expect(locations[0].id).toBeTruthy();
    expect(created.id).toBe(locations[0].id);
  });

  it("addLocation trims surrounding whitespace", () => {
    useDataStore.getState().addLocation({ country: "  Irak  ", city: "  Basra  " });

    const loc = useDataStore.getState().locations[0];
    expect(loc.country).toBe("Irak");
    expect(loc.city).toBe("Basra");
  });

  it("keeps the list sorted by country then city", () => {
    const store = useDataStore.getState();
    store.addLocation({ country: "Türkiye", city: "İstanbul" });
    store.addLocation({ country: "Irak", city: "Basra" });
    store.addLocation({ country: "Türkiye", city: "Ankara" });

    const pairs = useDataStore
      .getState()
      .locations.map((l) => `${l.country}/${l.city}`);
    expect(pairs).toEqual(["Irak/Basra", "Türkiye/Ankara", "Türkiye/İstanbul"]);
  });

  it("updateLocation changes country and city", () => {
    useDataStore.getState().addLocation({ country: "Türkiye", city: "Ankara" });
    const id = useDataStore.getState().locations[0].id;

    useDataStore.getState().updateLocation(id, { country: "Kazakistan", city: "Almatı" });

    const updated = useDataStore.getState().locations[0];
    expect(updated.country).toBe("Kazakistan");
    expect(updated.city).toBe("Almatı");
    expect(updated.id).toBe(id);
  });

  it("updateLocation can change only the city", () => {
    useDataStore.getState().addLocation({ country: "Türkiye", city: "Ankara" });
    const id = useDataStore.getState().locations[0].id;

    useDataStore.getState().updateLocation(id, { city: "Çorum" });

    const updated = useDataStore.getState().locations[0];
    expect(updated.country).toBe("Türkiye");
    expect(updated.city).toBe("Çorum");
  });

  it("deleteLocation removes a location by id", () => {
    useDataStore.getState().addLocation({ country: "Türkiye", city: "Ankara" });
    useDataStore.getState().addLocation({ country: "Irak", city: "Basra" });
    const id = useDataStore.getState().locations.find((l) => l.city === "Ankara")!.id;

    useDataStore.getState().deleteLocation(id);

    const remaining = useDataStore.getState().locations;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].city).toBe("Basra");
  });

  it("getLocationById returns the matching location", () => {
    useDataStore.getState().addLocation({ country: "Irak", city: "Umm Qasr" });
    const id = useDataStore.getState().locations[0].id;

    expect(useDataStore.getState().getLocationById(id)?.city).toBe("Umm Qasr");
    expect(useDataStore.getState().getLocationById("yok")).toBeUndefined();
  });
});

// ===== refreshDerivedStatuses — tarih bazlı statü tazeleme =====
// "Verileri yenile" butonunun çağırdığı fonksiyon. Toplu yazım yaptığı için
// kuralları test ile kilitliyoruz.
describe("refreshDerivedStatuses", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const iso = (offsetDays: number) =>
    new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);

  /** Süresinin %50'si geçmiş bir aksiyon — beklenen ilerleme ≈ %50 */
  function halfElapsed(over: Partial<Aksiyon> & { id: string }): Aksiyon {
    return {
      projeId: "P1",
      name: `Aksiyon ${over.id}`,
      owner: "Sahip",
      progress: 0,
      status: "On Track",
      startDate: iso(-50),
      endDate: iso(+50),
      ...over,
    } as Aksiyon;
  }

  function seedProje(): Proje {
    return {
      id: "P1",
      name: "Test Proje",
      source: "Kurumsal",
      status: "On Track",
      owner: "Sahip",
      participants: [],
      department: "BT",
      progress: 0,
      startDate: iso(-50),
      endDate: iso(+50),
    } as Proje;
  }

  beforeEach(() => {
    // Eşikler app_settings'ten geliyor; testte store'a doğrudan yazıyoruz.
    // Canlı değerlerle aynı: 15 / 5.
    useUIStore.setState({ behindThreshold: 15, atRiskThreshold: 5 });
  });

  it("beklenenin 15 puan altındaki aksiyonu Yüksek Riskte yapar", () => {
    // beklenen ≈ 50, ilerleme 30 → fark 20 > 15
    useDataStore.setState({
      projeler: [seedProje()],
      aksiyonlar: [halfElapsed({ id: "A1", progress: 30, status: "On Track" })],
    });
    const res = useDataStore.getState().refreshDerivedStatuses();
    expect(useDataStore.getState().aksiyonlar[0].status).toBe("High Risk");
    expect(res.aksiyonlar).toBe(1);
  });

  it("beklenenin 5-15 puan altındaki aksiyonu Riskte yapar", () => {
    // beklenen ≈ 50, ilerleme 42 → fark 8 → 5 < 8 <= 15
    useDataStore.setState({
      projeler: [seedProje()],
      aksiyonlar: [halfElapsed({ id: "A1", progress: 42, status: "On Track" })],
    });
    useDataStore.getState().refreshDerivedStatuses();
    expect(useDataStore.getState().aksiyonlar[0].status).toBe("At Risk");
  });

  it("planında olan aksiyonu Yolunda bırakır ve değişiklik saymaz", () => {
    useDataStore.setState({
      projeler: [seedProje()],
      aksiyonlar: [halfElapsed({ id: "A1", progress: 48, status: "On Track" })],
    });
    const res = useDataStore.getState().refreshDerivedStatuses();
    expect(useDataStore.getState().aksiyonlar[0].status).toBe("On Track");
    expect(res.aksiyonlar).toBe(0);
  });

  it("lifecycle statülerine DOKUNMAZ (Askıda / İptal / Tamamlandı)", () => {
    // Üçü de fena geride ama statüleri korunmalı — manuel kararlar
    useDataStore.setState({
      projeler: [seedProje()],
      aksiyonlar: [
        halfElapsed({ id: "A1", progress: 0, status: "On Hold" }),
        halfElapsed({ id: "A2", progress: 0, status: "Cancelled" }),
        halfElapsed({ id: "A3", progress: 0, status: "Achieved" }),
      ],
    });
    const res = useDataStore.getState().refreshDerivedStatuses();
    const byId = new Map(useDataStore.getState().aksiyonlar.map((a) => [a.id, a.status]));
    expect(byId.get("A1")).toBe("On Hold");
    expect(byId.get("A2")).toBe("Cancelled");
    expect(byId.get("A3")).toBe("Achieved");
    expect(res.aksiyonlar).toBe(0);
  });

  it("kullanıcının girdiği ilerlemeye dokunmaz", () => {
    useDataStore.setState({
      projeler: [seedProje()],
      aksiyonlar: [halfElapsed({ id: "A1", progress: 30, status: "On Track" })],
    });
    useDataStore.getState().refreshDerivedStatuses();
    // Statü değişti ama progress aynı kaldı (fixDataConsistency'nin tersi)
    expect(useDataStore.getState().aksiyonlar[0].progress).toBe(30);
  });

  it("projeye yukarı yayar: ilerleme ortalaması + escalation", () => {
    useDataStore.setState({
      projeler: [seedProje()],
      aksiyonlar: [
        halfElapsed({ id: "A1", progress: 30, status: "On Track" }), // → High Risk
        halfElapsed({ id: "A2", progress: 50, status: "On Track" }), // → On Track
      ],
    });
    const res = useDataStore.getState().refreshDerivedStatuses();
    const proje = useDataStore.getState().projeler[0];
    expect(proje.progress).toBe(40);          // (30 + 50) / 2
    expect(proje.status).toBe("High Risk");   // bir aksiyon Yüksek Riskte
    expect(res.projeler).toBe(1);
  });

  it("askıdaki projenin statüsünü korur ama ilerlemesini günceller", () => {
    useDataStore.setState({
      projeler: [{ ...seedProje(), status: "On Hold" }],
      aksiyonlar: [halfElapsed({ id: "A1", progress: 60, status: "On Track" })],
    });
    useDataStore.getState().refreshDerivedStatuses();
    const proje = useDataStore.getState().projeler[0];
    expect(proje.status).toBe("On Hold");
    expect(proje.progress).toBe(60);
  });

  it("eşikler store'dan okunur — eşik gevşetilince statü değişmez", () => {
    // fark 20; eşik 25 olursa artık Yüksek Riskte değil
    useUIStore.setState({ behindThreshold: 25, atRiskThreshold: 22 });
    useDataStore.setState({
      projeler: [seedProje()],
      aksiyonlar: [halfElapsed({ id: "A1", progress: 30, status: "On Track" })],
    });
    useDataStore.getState().refreshDerivedStatuses();
    expect(useDataStore.getState().aksiyonlar[0].status).toBe("On Track");
  });

  it("aksiyonu olmayan projeye dokunmaz", () => {
    useDataStore.setState({ projeler: [seedProje()], aksiyonlar: [] });
    const res = useDataStore.getState().refreshDerivedStatuses();
    expect(res).toEqual({ aksiyonlar: 0, projeler: 0 });
    expect(useDataStore.getState().projeler[0].progress).toBe(0);
  });
});

describe("Proje opsiyonel yatırım alanlarını temizleme", () => {
  const base = {
    name: "Yatırım projesi",
    source: "Kurumsal" as const,
    status: "On Track" as const,
    owner: "Test Owner",
    participants: ["Test Owner"],
    department: "IT",
    progress: 10,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
  };

  it("null gönderilince yerel durumda alan undefined oluyor, null KALMIYOR", () => {
    // `null` yalnızca adapter'a giden "bu alanı NULL yap" sinyali. `Proje` tipi
    // ve localStorage şekli null tutmuyor; tutsa ikon/etiket okuyan bileşenler
    // beklenmedik değerle karşılaşırdı.
    useDataStore.getState().addProje({
      ...base,
      locationId: "loc-1",
      capexUsd: 1_000_000,
      assetClass: "AST-PROC",
      actionType: "ACT-NEW",
    });
    const id = useDataStore.getState().projeler[0].id;

    useDataStore.getState().updateProje(id, {
      locationId: null,
      capexUsd: null,
      assetClass: null,
      actionType: null,
      parentObjectiveId: null,
    });

    const p = useDataStore.getState().projeler[0];
    expect(p.locationId).toBeUndefined();
    expect(p.capexUsd).toBeUndefined();
    expect(p.assetClass).toBeUndefined();
    expect(p.actionType).toBeUndefined();
    expect(p.parentObjectiveId).toBeUndefined();
    // localStorage'a null sızmasın
    expect(JSON.stringify(p)).not.toContain("null");
  });

  it("temizleme diğer alanlara dokunmuyor", () => {
    useDataStore.getState().addProje({
      ...base,
      locationId: "loc-1",
      capexUsd: 500,
      assetClass: "AST-PORT",
      actionType: "ACT-EXP",
    });
    const id = useDataStore.getState().projeler[0].id;

    useDataStore.getState().updateProje(id, { capexUsd: null });

    const p = useDataStore.getState().projeler[0];
    expect(p.capexUsd).toBeUndefined();
    // Sadece CAPEX temizlendi; diğerleri yerinde
    expect(p.locationId).toBe("loc-1");
    expect(p.assetClass).toBe("AST-PORT");
    expect(p.actionType).toBe("ACT-EXP");
    expect(p.name).toBe(base.name);
    expect(p.progress).toBe(base.progress);
  });

  it("değer güncelleme (temizleme değil) çalışmaya devam ediyor", () => {
    useDataStore.getState().addProje({ ...base, capexUsd: 100 });
    const id = useDataStore.getState().projeler[0].id;

    useDataStore.getState().updateProje(id, {
      capexUsd: 250,
      assetClass: "AST-STOR",
      locationId: "loc-9",
    });

    const p = useDataStore.getState().projeler[0];
    expect(p.capexUsd).toBe(250);
    expect(p.assetClass).toBe("AST-STOR");
    expect(p.locationId).toBe("loc-9");
  });
});
