import { describe, it, expect } from "vitest";
import { resolveCoordinates, normalizeGeoKey, isKnownCountry, GEO_DICTIONARY_SIZE } from "../geoCoordinates";

describe("normalizeGeoKey", () => {
  it("folds Turkish characters so İstanbul and Istanbul match", () => {
    expect(normalizeGeoKey("İstanbul")).toBe(normalizeGeoKey("Istanbul"));
    expect(normalizeGeoKey("ÇORUM")).toBe(normalizeGeoKey("corum"));
    expect(normalizeGeoKey("Muş")).toBe("mus");
  });

  it("strips punctuation and spaces", () => {
    expect(normalizeGeoKey("Umm Qasr")).toBe("ummqasr");
    expect(normalizeGeoKey("  New Orleans ")).toBe("neworleans");
  });

  it("handles empty input", () => {
    expect(normalizeGeoKey(undefined)).toBe("");
    expect(normalizeGeoKey(null)).toBe("");
    expect(normalizeGeoKey("")).toBe("");
  });
});

describe("resolveCoordinates", () => {
  it("resolves a known country + city pair at city precision", () => {
    const p = resolveCoordinates("Türkiye", "Giresun");
    expect(p).not.toBeNull();
    expect(p!.precision).toBe("city");
    expect(p!.lat).toBeCloseTo(40.9128, 3);
    expect(p!.lon).toBeCloseTo(38.3895, 3);
  });

  it("is insensitive to Turkish casing and diacritics", () => {
    const a = resolveCoordinates("Turkiye", "istanbul");
    const b = resolveCoordinates("TÜRKİYE", "İstanbul");
    expect(a).toEqual(b);
    expect(a!.precision).toBe("city");
  });

  it("matches English country spellings via aliases", () => {
    expect(resolveCoordinates("Turkey", "Çorum")).toEqual(resolveCoordinates("Türkiye", "Çorum"));
    expect(resolveCoordinates("Iraq", "Basra")).toEqual(resolveCoordinates("Irak", "Basra"));
  });

  it("matches city aliases (port / alternative names)", () => {
    expect(resolveCoordinates("Irak", "Umm Kasr")).toEqual(resolveCoordinates("Irak", "Umm Qasr"));
    expect(resolveCoordinates("ABD", "NOLA")).toEqual(resolveCoordinates("ABD", "New Orleans"));
  });

  it("falls back to the country centre when the city is unknown", () => {
    const p = resolveCoordinates("Türkiye", "Bilinmeyenşehir");
    expect(p).not.toBeNull();
    expect(p!.precision).toBe("country");
  });

  it("still resolves when only the city is known but the country spelling is odd", () => {
    const p = resolveCoordinates("Turkiye Cumhuriyeti", "Giresun");
    expect(p!.precision).toBe("city");
  });

  it("returns null when neither country nor city is known", () => {
    expect(resolveCoordinates("Wakanda", "Birnin Zana")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(resolveCoordinates("", "")).toBeNull();
    expect(resolveCoordinates(undefined, undefined)).toBeNull();
  });
});

describe("isKnownCountry", () => {
  it("recognises Turkish and English names", () => {
    expect(isKnownCountry("Türkiye")).toBe(true);
    expect(isKnownCountry("Turkey")).toBe(true);
    expect(isKnownCountry("Wakanda")).toBe(false);
  });
});

describe("dictionary sanity", () => {
  it("carries a meaningful number of entries", () => {
    expect(GEO_DICTIONARY_SIZE.cities).toBeGreaterThan(30);
    expect(GEO_DICTIONARY_SIZE.countries).toBeGreaterThan(30);
  });

  it("covers every country that has a city entry", () => {
    // Şehir kaydı olan her ülkenin ülke fallback'i de olmalı — aksi halde
    // aynı ülkenin başka bir şehri girildiğinde koordinat çözülemez.
    const cityCountries = ["Türkiye", "Irak", "Kazakistan", "Venezuela", "ABD", "Ukrayna", "Rusya",
      "Romanya", "Bulgaristan", "Gürcistan", "Mısır", "Hollanda", "BAE", "Suudi Arabistan",
      "Pakistan", "Arjantin", "Brezilya"];
    for (const c of cityCountries) {
      expect(isKnownCountry(c), `${c} ülke sözlüğünde yok`).toBe(true);
    }
  });
});

describe("Investment Map yüklemesinin lokasyonları (2026-09-18)", () => {
  // Kullanıcının Excel'indeki 19 benzersiz lokasyon. Yükleme öncesi 5'i HİÇ
  // çözülmüyordu (proje haritada görünmüyordu), 6'sı ülke merkezine düşüyordu.
  // Bu test o gerilemeyi kilitliyor: hepsi çözülmeli ve biri hariç hepsi
  // ülke merkezinden FARKLI bir noktaya oturmalı.
  const LOKASYONLAR: [string, string][] = [
    ["Venezuela", "Karakas"], ["Türkiye", "Çorum"], ["Kazakistan", "Astana"],
    ["Umman", "Sohar"], ["Venezuela", "Zulia"], ["Irak", "Basra"],
    ["Irak", "Umm Qasr"], ["Irak", "Baghdad"], ["Cibuti", "Tadjourah"],
    ["Türkiye", "İzmir"], ["Almanya", "Premnitz"], ["Suriye", "Tartus"],
    ["ABD", "New Orleans"], ["Kazakistan", "Petropavlovsk"], ["Türkiye", "Mersin"],
    ["ABD", "Kaliforniya"], ["Gana", "Tema"], ["Sudan", "Port Sudan"],
  ];

  it("hepsi bir koordinata çözülüyor — haritada görünmeyen proje kalmıyor", () => {
    for (const [country, city] of LOKASYONLAR) {
      expect(resolveCoordinates(country, city), `${country}/${city}`).not.toBeNull();
    }
  });

  it("hepsi ülke merkezinden farklı, gerçek şehir noktasına oturuyor", () => {
    for (const [country, city] of LOKASYONLAR) {
      const sehir = resolveCoordinates(country, city)!;
      const ulke = resolveCoordinates(country, "");
      expect(
        !ulke || sehir.lat !== ulke.lat || sehir.lon !== ulke.lon,
        `${country}/${city} ülke merkezine düşüyor`,
      ).toBe(true);
    }
  });

  it("REGRESYON: sözlükte hiç olmayan 5 ülke artık tanınıyor", () => {
    // Umman, Cibuti, Suriye, Gana, Sudan öncesinde ne şehir ne ülke olarak vardı.
    for (const country of ["Umman", "Cibuti", "Suriye", "Gana", "Sudan"]) {
      expect(resolveCoordinates(country, ""), country).not.toBeNull();
    }
  });

  it("eyalet adları makul noktalara bağlandı", () => {
    // Zulia → Maracaibo (eyalet başkenti), Kaliforniya → eyaletin coğrafi merkezi.
    const zulia = resolveCoordinates("Venezuela", "Zulia")!;
    expect(zulia.lon).toBeLessThan(-70); // Maracaibo, Karakas'ın çok batısında
    const ca = resolveCoordinates("ABD", "Kaliforniya")!;
    expect(ca.lon).toBeLessThan(-110); // Batı kıyısı, Washington DC değil
  });
});
