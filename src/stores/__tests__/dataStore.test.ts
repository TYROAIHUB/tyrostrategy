import { describe, it, expect, beforeEach, vi } from "vitest";
import { useDataStore } from "../dataStore";

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
