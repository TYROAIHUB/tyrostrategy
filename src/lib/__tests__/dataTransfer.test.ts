import { describe, it, expect } from "vitest";
import {
  buildSheetRows,
  prepareImportRows,
  arrayToCSV,
  csvToArray,
  orderSheetColumns,
  PROJELER_HEADER_MAP,
} from "@/lib/dataTransfer";
import type { LocationDefinition, Proje } from "@/types";

const LOCATIONS: LocationDefinition[] = [
  { id: "loc-1", country: "Türkiye", city: "İstanbul" },
  { id: "loc-2", country: "Ukrayna", city: "Odesa" },
];
const CTX = { locations: LOCATIONS };

function proje(over: Partial<Proje> = {}): Proje {
  return {
    id: "P26-0001",
    name: "Test projesi",
    source: "TİRYAKİ AGRO",
    status: "On Track",
    owner: "Cenk Şayli",
    participants: ["Ali Veli", "Ayşe Yılmaz"],
    department: "IT",
    progress: 40,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    ...over,
  } as Proje;
}

describe("dataTransfer — dışa aktarma (CSV/XLSX)", () => {
  it("yeni yatırım alanlarını okunabilir başlıklarla veriyor", () => {
    const rows = buildSheetRows("projeler", [
      proje({ locationId: "loc-1", capexUsd: 1250000, assetClass: "AST-PROC", actionType: "ACT-NEW" }),
    ] as unknown as Record<string, unknown>[], CTX);

    expect(rows[0]["Lokasyon"]).toBe("Türkiye / İstanbul");
    expect(rows[0]["CAPEX (USD)"]).toBe(1250000);
    expect(rows[0]["Varlık Sınıfı"]).toBe("AST-PROC");
    expect(rows[0]["Yatırım Tipi"]).toBe("ACT-NEW");
  });

  it("çıplak UUID kolonunu tabloya yazmıyor — yerine etiket var", () => {
    const rows = buildSheetRows("projeler",
      [proje({ locationId: "loc-2" })] as unknown as Record<string, unknown>[], CTX);
    expect(Object.keys(rows[0])).not.toContain("Lokasyon ID");
    expect(Object.keys(rows[0])).not.toContain("locationId");
    expect(rows[0]["Lokasyon"]).toBe("Ukrayna / Odesa");
  });

  it("silinmiş lokasyon referansında boş hücre bırakıyor, patlamıyor", () => {
    const rows = buildSheetRows("projeler",
      [proje({ locationId: "yok-artik" })] as unknown as Record<string, unknown>[], CTX);
    expect(rows[0]["Lokasyon"]).toBe("");
  });

  it("REGRESYON: ilk satırda alan boşsa kolon diğer satırlar için kaybolmuyor", () => {
    // Eski kod başlıkları Object.keys(flat[0]) ile alıyordu; opsiyonel alanlar
    // ilk projede boş olduğunda TÜM satırlar için sütun düşüyordu.
    const rows = buildSheetRows("projeler", [
      proje({ id: "P26-0001" }),
      proje({ id: "P26-0002", capexUsd: 500000, assetClass: "AST-PORT", actionType: "ACT-EXP" }),
    ] as unknown as Record<string, unknown>[], CTX);

    expect(Object.keys(rows[0])).toContain("CAPEX (USD)");
    expect(rows[0]["CAPEX (USD)"]).toBe("");
    expect(rows[1]["CAPEX (USD)"]).toBe(500000);
    expect(rows[1]["Varlık Sınıfı"]).toBe("AST-PORT");
    // Her satır aynı sütun kümesine sahip olmalı — XLSX/CSV kolon kayması olmasın.
    expect(Object.keys(rows[0])).toEqual(Object.keys(rows[1]));
  });

  it("kolon sırası başlık haritasının sırasını izliyor", () => {
    const rows = buildSheetRows("projeler",
      [proje({ locationId: "loc-1", capexUsd: 1, assetClass: "AST-UTIL", actionType: "ACT-SUS" })] as unknown as Record<string, unknown>[], CTX);
    const keys = Object.keys(rows[0]);
    expect(keys.indexOf("Etiketler")).toBeLessThan(keys.indexOf("Lokasyon"));
    expect(keys.indexOf("Lokasyon")).toBeLessThan(keys.indexOf("CAPEX (USD)"));
    expect(keys.indexOf("CAPEX (USD)")).toBeLessThan(keys.indexOf("Varlık Sınıfı"));
    expect(keys.indexOf("Varlık Sınıfı")).toBeLessThan(keys.indexOf("Yatırım Tipi"));
  });

  it("haritada olmayan yeni bir alan sessizce düşmüyor, sona ekleniyor", () => {
    const rows = orderSheetColumns("projeler", [{ id: "P1", yeniAlan: "x" }]);
    expect(Object.keys(rows[0])).toContain("yeniAlan");
  });

  it("dizileri tek hücreye topluyor", () => {
    const rows = buildSheetRows("projeler",
      [proje({ tags: ["Yatırım", "Öncelikli"] })] as unknown as Record<string, unknown>[], CTX);
    expect(rows[0]["Etiketler"]).toBe("Yatırım; Öncelikli");
    expect(rows[0]["Proje Üyeleri"]).toBe("Ali Veli; Ayşe Yılmaz");
  });

  it("lokasyon tablosunu Ülke/Şehir başlıklarıyla veriyor", () => {
    const rows = buildSheetRows("lokasyonlar", LOCATIONS as unknown as Record<string, unknown>[], CTX);
    expect(Object.keys(rows[0])).toEqual(["ID", "Ülke", "Şehir"]);
    expect(rows[1]["Şehir"]).toBe("Odesa");
  });
});

describe("dataTransfer — CSV kodlama", () => {
  it("virgül, tırnak ve satır sonunu RFC 4180 ile kaçırıyor", () => {
    const csv = arrayToCSV([{ a: "x,y", b: 'de"mek', c: "alt\nsatır" }]);
    expect(csv.split("\n")[0]).toBe("a,b,c");
    expect(csv).toContain('"x,y"');
    expect(csv).toContain('"de""mek"');
  });

  it("başlıkları tüm satırların birleşiminden alıyor", () => {
    const csv = arrayToCSV([{ a: 1 }, { a: 2, b: 3 }]);
    expect(csv.split("\n")[0]).toBe("a,b");
  });

  it("REGRESYON: tırnaklı virgül sütunları kaydırmıyor", () => {
    // Eski csvToArray line.split(",") yapıyordu; virgüllü bir açıklama
    // alanı o satırdaki tüm sonraki sütunları kaydırıyordu.
    const csv = 'Proje Adı,Açıklama,Durum\nA,"x, y ve z",On Track';
    const parsed = csvToArray(csv);
    expect(parsed[0]["Açıklama"]).toBe("x, y ve z");
    expect(parsed[0]["Durum"]).toBe("On Track");
  });

  it("BOM, CRLF ve kaçırılmış tırnağı çözüyor", () => {
    const csv = '﻿a,b\r\n"de""mek",2\r\n';
    const parsed = csvToArray(csv);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]["a"]).toBe('de"mek');
    expect(parsed[0]["b"]).toBe("2");
  });

  it("gömülü satır sonunu tek hücrede tutuyor", () => {
    const parsed = csvToArray('a,b\n"iki\nsatır",2');
    expect(parsed).toHaveLength(1);
    expect(parsed[0]["a"]).toBe("iki\nsatır");
  });
});

describe("dataTransfer — içe aktarma", () => {
  it("Türkçe başlıkları iç alan adlarına çeviriyor", () => {
    const { rows } = prepareImportRows("projeler", [{
      "Proje Adı": "A", "Durum": "On Track",
      "Başlangıç Tarihi": "2026-01-01", "Bitiş Tarihi": "2026-12-31",
      "CAPEX (USD)": "1.250.000", "Varlık Sınıfı": "AST-PROC", "Yatırım Tipi": "ACT-NEW",
      "Lokasyon": "Türkiye / İstanbul",
    }], CTX);
    expect(rows[0]).toMatchObject({
      name: "A", capexUsd: 1250000, assetClass: "AST-PROC",
      actionType: "ACT-NEW", locationId: "loc-1",
    });
  });

  it("türetilmiş Lokasyon kolonunu mağazaya yazmıyor", () => {
    const { rows } = prepareImportRows("projeler", [{
      "Proje Adı": "A", "Durum": "On Track",
      "Başlangıç Tarihi": "2026-01-01", "Bitiş Tarihi": "2026-12-31",
      "Lokasyon": "Türkiye / İstanbul",
    }], CTX);
    expect(rows[0]).not.toHaveProperty("location");
  });

  it("lokasyon etiketini büyük-küçük harf ve noktalama toleransıyla eşliyor", () => {
    const { rows, issues } = prepareImportRows("projeler",
      [{ name: "A", status: "On Track", startDate: "x", endDate: "y", location: "turkiye/istanbul" }], CTX);
    expect(rows[0].locationId).toBe("loc-1");
    expect(issues).toHaveLength(0);
  });

  it("açık Lokasyon ID kolonu etiketi yeniyor", () => {
    const { rows } = prepareImportRows("projeler", [{
      name: "A", status: "On Track", startDate: "x", endDate: "y",
      "Lokasyon ID": "loc-2", "Lokasyon": "Türkiye / İstanbul",
    }], CTX);
    expect(rows[0].locationId).toBe("loc-2");
  });

  it("tanımsız lokasyonu sessizce düşürmüyor, satır numarasıyla bildiriyor", () => {
    const { rows, issues } = prepareImportRows("projeler",
      [{ name: "A", status: "On Track", startDate: "x", endDate: "y", location: "Mars / Olympus" }], CTX);
    expect(rows[0].locationId).toBeUndefined();
    expect(issues).toEqual([{ row: 1, field: "location=Mars / Olympus", blocking: false }]);
  });

  it('arayüzden kopyalanan "KOD — Ad" metninden kodu ayıklıyor', () => {
    const { rows, issues } = prepareImportRows("projeler", [{
      name: "A", status: "On Track", startDate: "x", endDate: "y",
      assetClass: "AST-PORT — Liman / terminal", actionType: " act-upg ",
    }], CTX);
    expect(rows[0].assetClass).toBe("AST-PORT");
    expect(rows[0].actionType).toBe("ACT-UPG");
    expect(issues).toHaveLength(0);
  });

  it("geçersiz sabit seçimi satır numarasıyla bildiriyor", () => {
    const { issues } = prepareImportRows("projeler",
      [{ name: "A", status: "On Track", startDate: "x", endDate: "y", assetClass: "AST-YOK" }], CTX);
    expect(issues).toEqual([{ row: 1, field: "assetClass=AST-YOK", blocking: true }]);
  });

  it("negatif ve alfabetik CAPEX'i bildiriyor, sessizce silmiyor", () => {
    const { issues } = prepareImportRows("projeler", [
      { name: "A", status: "On Track", startDate: "x", endDate: "y", capexUsd: -500 },
      { name: "B", status: "On Track", startDate: "x", endDate: "y", capexUsd: "bilinmiyor" },
    ], CTX);
    expect(issues.map((i) => i.row)).toEqual([1, 2]);
    expect(issues[0].field).toContain("capexUsd");
    expect(issues[1].field).toContain("capexUsd");
  });

  it("boş CAPEX hücresi hata üretmiyor", () => {
    const { rows, issues } = prepareImportRows("projeler",
      [{ name: "A", status: "On Track", startDate: "x", endDate: "y", capexUsd: "" }], CTX);
    expect(rows[0]).not.toHaveProperty("capexUsd");
    expect(issues).toHaveLength(0);
  });

  it("lokasyon tablosunda ülke/şehir zorunlu", () => {
    const { issues } = prepareImportRows("lokasyonlar",
      [{ "Ülke": "Türkiye", "Şehir": "" }], CTX);
    expect(issues).toEqual([{ row: 1, field: "city", blocking: true }]);
  });

  it("yazılamayacak satırı mağazaya göndermiyor, atlanan olarak sayıyor", () => {
    // Önceden bu satır da yazılıyordu: PostgREST CHECK ile reddediyor, kayıt
    // optimistik olarak ekranda görünüyor ve ilk yenilemede kayboluyordu.
    const { rows, issues, skipped } = prepareImportRows("projeler", [
      { name: "Geçerli", status: "On Track", startDate: "x", endDate: "y" },
      { name: "Bozuk", status: "On Track", startDate: "x", endDate: "y", assetClass: "AST-YOK" },
      { name: "Eksik durum", startDate: "x", endDate: "y" },
    ], CTX);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Geçerli");
    expect(skipped).toBe(2);
    expect(issues.filter((i) => i.blocking).map((i) => i.row)).toEqual([2, 3]);
  });

  it("uyarı seviyesindeki bulgu satırı engellemiyor", () => {
    // Çözülemeyen lokasyon ETİKETİ satırı geçersiz kılmaz — yalnızca o hücre boş
    // kalır. Kullanıcı yine haberdar edilir ama kayıt içe aktarılır.
    const { rows, issues, skipped } = prepareImportRows("projeler",
      [{ name: "A", status: "On Track", startDate: "x", endDate: "y", location: "Mars / Olympus" }], CTX);
    expect(rows).toHaveLength(1);
    expect(skipped).toBe(0);
    expect(issues[0].blocking).toBe(false);
  });

  it("bilinmeyen lokasyon UUID'sini FK hatasına gitmeden yakalıyor", () => {
    // Başka ortamdan gelen JSON yedeğinde tipik: location_id bir FK, yazım
    // 23503 ile döner ve kullanıcı satır numarası görmez.
    const { rows, issues, skipped } = prepareImportRows("projeler",
      [{ name: "A", status: "On Track", startDate: "x", endDate: "y", locationId: "baska-ortamdan" }], CTX);
    expect(rows).toHaveLength(0);
    expect(skipped).toBe(1);
    expect(issues).toEqual([{ row: 1, field: "locationId=baska-ortamdan", blocking: true }]);
  });

  it("eski 'Behind' statüsünü hâlâ çeviriyor", () => {
    const { rows } = prepareImportRows("projeler",
      [{ name: "A", status: "Behind", startDate: "x", endDate: "y" }], CTX);
    expect(rows[0].status).toBe("High Risk");
  });
});

describe("dataTransfer — kısmi / boş hücreli dosyalar", () => {
  it("REGRESYON: boş hücre anahtarı düşürülüyor, veritabanına \"\" gitmiyor", () => {
    // Elektronik tabloda her satır aynı kolon kümesine sahip. Bir alanı yalnızca
    // BAZI kayıtlar doldurduğunda (canlıda 14 projede tamamlanma tarihi var) o
    // kolon dosyaya giriyor ve diğer satırlar "" taşıyor. "" bir tarih ya da
    // UUID kolonuna gönderilirse Postgres 22007 / FK hatası veriyor.
    const { rows } = prepareImportRows("projeler", [{
      "ID": "P26-0001", "Proje Adı": "A", "Durum": "On Track",
      "Başlangıç Tarihi": "2026-01-01", "Bitiş Tarihi": "2026-12-31",
      "Tamamlanma": "", "Üst Proje ID": "", "Kontrol Tarihi": "", "Açıklama": "",
    }], CTX);
    expect(rows[0]).not.toHaveProperty("completedAt");
    expect(rows[0]).not.toHaveProperty("parentObjectiveId");
    expect(rows[0]).not.toHaveProperty("reviewDate");
    expect(rows[0]).not.toHaveProperty("description");
    // Hiçbir değer boş string olarak kalmamalı
    expect(Object.values(rows[0])).not.toContain("");
  });

  it("REGRESYON: kolonu OLMAYAN dosyada üyelik/etiket alanlarına dokunmuyor", () => {
    // Koşulsuz atama `[]` üretiyordu; adapter bunu "üyeliklerin ve etiketlerin
    // hepsini sil" olarak uygulayıp bağlantı tablolarını boşaltıyordu.
    const { rows } = prepareImportRows("projeler", [{
      "ID": "P26-0001", "Proje Adı": "A", "Durum": "On Track",
      "Başlangıç Tarihi": "2026-01-01", "Bitiş Tarihi": "2026-12-31",
    }], CTX);
    expect(rows[0]).not.toHaveProperty("participants");
    expect(rows[0]).not.toHaveProperty("tags");
  });

  it("kolon VARSA ve doluysa üyelik/etiketleri güncelliyor", () => {
    const { rows } = prepareImportRows("projeler", [{
      name: "A", status: "On Track", startDate: "x", endDate: "y",
      "Proje Üyeleri": "Ali; Ayşe", "Etiketler": "Yatırım",
    }], CTX);
    expect(rows[0].participants).toEqual(["Ali", "Ayşe"]);
    expect(rows[0].tags).toEqual(["Yatırım"]);
  });

  it("zorunlu alan boş hücreyle geldiyse hâlâ hata veriyor", () => {
    // Boş string düşürülüyor ama bu zorunluluğu kaybettirmemeli.
    const { issues, rows, skipped } = prepareImportRows("projeler",
      [{ "Proje Adı": "", "Durum": "On Track", "Başlangıç Tarihi": "x", "Bitiş Tarihi": "y" }], CTX);
    expect(issues.some((i) => i.field === "name" && i.blocking)).toBe(true);
    expect(rows).toHaveLength(0);
    expect(skipped).toBe(1);
  });
});

describe("dataTransfer — tam gidiş-dönüş", () => {
  it("projeyi CSV'ye yazıp geri okuduğunda yeni alanların hepsi korunuyor", () => {
    const original = proje({
      description: "Virgüllü, tırnaklı \"açıklama\"",
      locationId: "loc-1",
      capexUsd: 1250000,
      assetClass: "AST-STOR",
      actionType: "ACT-REL",
      tags: ["Yatırım", "Öncelikli"],
    });

    const csv = arrayToCSV(buildSheetRows("projeler",
      [original] as unknown as Record<string, unknown>[], CTX));
    const { rows, issues } = prepareImportRows("projeler", csvToArray(csv), CTX);

    expect(issues).toHaveLength(0);
    expect(rows[0]).toMatchObject({
      name: original.name,
      description: original.description,
      locationId: "loc-1",
      capexUsd: 1250000,
      assetClass: "AST-STOR",
      actionType: "ACT-REL",
      status: "On Track",
      progress: 40,
    });
    expect(rows[0].tags).toEqual(["Yatırım", "Öncelikli"]);
    expect(rows[0].participants).toEqual(["Ali Veli", "Ayşe Yılmaz"]);
  });

  it("başlık haritası her yeni alanı kapsıyor — Proje tipiyle senkron", () => {
    // Bu test, tipe alan eklenip haritaya eklenmeyi unutulduğunda kırılır.
    const covered = Object.keys(PROJELER_HEADER_MAP);
    for (const field of ["locationId", "capexUsd", "assetClass", "actionType"]) {
      expect(covered).toContain(field);
    }
  });
});
