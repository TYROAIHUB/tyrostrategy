import { describe, it, expect } from "vitest";
import {
  selectInvestmentProjects,
  applyAtlasFilters,
  resolveAtlasPoints,
  computePortfolioMetrics,
  computeBreakdowns,
  computeFilterOptions,
  buildLocationMap,
  hasActiveFilters,
  EMPTY_ATLAS_FILTERS,
} from "../investmentPortfolio";
import type { LocationDefinition, Proje } from "@/types";

const LOCATIONS: LocationDefinition[] = [
  { id: "loc-tr-giresun", country: "Türkiye", city: "Giresun" },
  { id: "loc-tr-corum", country: "Türkiye", city: "Çorum" },
  { id: "loc-iq-basra", country: "Irak", city: "Basra" },
  { id: "loc-xx-unknown", country: "Wakanda", city: "Birnin Zana" },
];
const locationById = buildLocationMap(LOCATIONS);

function proje(over: Partial<Proje> & { id: string }): Proje {
  return {
    name: `Proje ${over.id}`,
    source: "Türkiye",
    status: "On Track",
    owner: "Sahip",
    participants: [],
    department: "Yatırım",
    progress: 0,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    ...over,
  } as Proje;
}

const P = {
  // Giresun, liman, idame, 100k, %50, yolunda
  port: proje({ id: "P1", assetClass: "AST-PORT", actionType: "ACT-SUS", locationId: "loc-tr-giresun", capexUsd: 100_000, progress: 50 }),
  // Giresun, depo, yeni, CAPEX yok, %100, tamamlandı
  stor: proje({ id: "P2", assetClass: "AST-STOR", actionType: "ACT-NEW", locationId: "loc-tr-giresun", progress: 100, status: "Achieved" }),
  // Çorum, üretim, yeni, 900k, %0, yüksek riskte
  proc: proje({ id: "P3", assetClass: "AST-PROC", actionType: "ACT-NEW", locationId: "loc-tr-corum", capexUsd: 900_000, status: "High Risk" }),
  // Basra, idari, yeni, 1M, %25, riskte
  admin: proje({ id: "P4", assetClass: "AST-ADMIN", actionType: "ACT-NEW", locationId: "loc-iq-basra", capexUsd: 1_000_000, progress: 25, status: "At Risk" }),
  // Lokasyonu YOK — bekleyenlere düşmeli
  noLoc: proje({ id: "P5", assetClass: "AST-UTIL", actionType: "ACT-UPG" }),
  // Lokasyonu var ama şehir koordinat sözlüğünde yok — bekleyenlere düşmeli
  unknownGeo: proje({ id: "P6", assetClass: "AST-CIVIL", actionType: "ACT-REL", locationId: "loc-xx-unknown" }),
  // Yatırım değil (asset_class yok) — portföye hiç girmemeli
  notInvestment: proje({ id: "P7", locationId: "loc-tr-giresun", capexUsd: 5_000_000 }),
};

const ALL = Object.values(P);

describe("selectInvestmentProjects", () => {
  it("only keeps projects that carry an asset class", () => {
    const sel = selectInvestmentProjects(ALL);
    expect(sel.map((p) => p.id)).not.toContain("P7");
    expect(sel).toHaveLength(6);
  });
});

describe("resolveAtlasPoints", () => {
  it("splits mappable projects from the ones awaiting a location", () => {
    const { points, pending } = resolveAtlasPoints(selectInvestmentProjects(ALL), locationById);
    expect(points.map((p) => p.proje.id).sort()).toEqual(["P1", "P2", "P3", "P4"]);
    // Lokasyonu olmayan VE koordinatı çözülemeyen ikisi de bekliyor
    expect(pending.map((p) => p.id).sort()).toEqual(["P5", "P6"]);
  });

  it("attaches the resolved coordinate to each point", () => {
    const { points } = resolveAtlasPoints([P.port], locationById);
    expect(points[0].geo.precision).toBe("city");
    expect(points[0].geo.lat).toBeCloseTo(40.9128, 3);
    expect(points[0].location.city).toBe("Giresun");
  });
});

describe("computePortfolioMetrics", () => {
  const { points } = resolveAtlasPoints(selectInvestmentProjects(ALL), locationById);
  const m = computePortfolioMetrics(points);

  it("counts only mapped projects — pending ones are excluded from every figure", () => {
    expect(m.projectCount).toBe(4);
  });

  it("sums CAPEX and reports how many projects actually carry it", () => {
    expect(m.totalCapex).toBe(2_000_000);
    expect(m.capexEnteredCount).toBe(3);
  });

  it("counts distinct countries", () => {
    expect(m.countryCount).toBe(2); // Türkiye + Irak
  });

  it("counts ACT-NEW as new investment", () => {
    expect(m.newInvestmentCount).toBe(3);
  });

  it("averages progress over the mapped set", () => {
    // (50 + 100 + 0 + 25) / 4 = 43.75 → 44
    expect(m.avgProgress).toBe(44);
  });

  it("treats both High Risk and At Risk as risky", () => {
    expect(m.riskyCount).toBe(2);
  });

  it("returns zeros for an empty set without dividing by zero", () => {
    const empty = computePortfolioMetrics([]);
    expect(empty).toMatchObject({ projectCount: 0, totalCapex: 0, avgProgress: 0, countryCount: 0 });
  });
});

describe("applyAtlasFilters", () => {
  const investment = selectInvestmentProjects(ALL);

  it("returns everything when no filter is active", () => {
    expect(applyAtlasFilters(investment, EMPTY_ATLAS_FILTERS, locationById)).toHaveLength(6);
  });

  it("uses OR inside a group", () => {
    const out = applyAtlasFilters(
      investment,
      { ...EMPTY_ATLAS_FILTERS, assetClasses: ["AST-PORT", "AST-STOR"] },
      locationById
    );
    expect(out.map((p) => p.id).sort()).toEqual(["P1", "P2"]);
  });

  it("uses AND between groups", () => {
    // AST-PROC + Türkiye + High Risk → yalnızca P3
    const out = applyAtlasFilters(
      investment,
      { assetClasses: ["AST-PROC"], actionTypes: [], countries: ["Türkiye"], statuses: ["High Risk"] },
      locationById
    );
    expect(out.map((p) => p.id)).toEqual(["P3"]);
  });

  it("filters by country through the location table", () => {
    const out = applyAtlasFilters(
      investment,
      { ...EMPTY_ATLAS_FILTERS, countries: ["Irak"] },
      locationById
    );
    expect(out.map((p) => p.id)).toEqual(["P4"]);
  });

  it("drops location-less projects when a country filter is active", () => {
    const out = applyAtlasFilters(
      investment,
      { ...EMPTY_ATLAS_FILTERS, countries: ["Türkiye"] },
      locationById
    );
    expect(out.map((p) => p.id)).not.toContain("P5");
  });
});

describe("map and summary stay in sync", () => {
  it("metric project count always equals the number of pins", () => {
    const filters = { ...EMPTY_ATLAS_FILTERS, actionTypes: ["ACT-NEW"] };
    const filtered = applyAtlasFilters(selectInvestmentProjects(ALL), filters, locationById);
    const { points } = resolveAtlasPoints(filtered, locationById);
    const metrics = computePortfolioMetrics(points);
    // Dokümanın en kritik iş kuralı: haritadaki küme = özetteki sayı
    expect(metrics.projectCount).toBe(points.length);
    const breakdowns = computeBreakdowns(points);
    const countrySum = breakdowns.byCountry.reduce((a, r) => a + r.count, 0);
    expect(countrySum).toBe(points.length);
  });
});

describe("computeBreakdowns", () => {
  const { points } = resolveAtlasPoints(selectInvestmentProjects(ALL), locationById);
  const b = computeBreakdowns(points);

  it("groups by country with counts and CAPEX", () => {
    const tr = b.byCountry.find((r) => r.key === "Türkiye");
    expect(tr).toMatchObject({ count: 3, capex: 1_000_000 });
    expect(b.byCountry.find((r) => r.key === "Irak")).toMatchObject({ count: 1, capex: 1_000_000 });
  });

  it("sorts by count descending", () => {
    const counts = b.byCountry.map((r) => r.count);
    expect(counts).toEqual([...counts].sort((a, z) => z - a));
  });

  it("groups by action type and asset class", () => {
    expect(b.byActionType.find((r) => r.key === "ACT-NEW")?.count).toBe(3);
    expect(b.byAssetClass.find((r) => r.key === "AST-PORT")?.count).toBe(1);
  });

  it("groups by status", () => {
    expect(b.byStatus.find((r) => r.key === "High Risk")?.count).toBe(1);
  });
});

describe("computeFilterOptions", () => {
  it("only offers values present in the portfolio", () => {
    const opts = computeFilterOptions(selectInvestmentProjects(ALL), locationById);
    // Wakanda lokasyonu tanımlı olduğu için ülke listesinde çıkar, ama
    // koordinatı olmadığı için haritada pin'i olmaz — filtre seçenekleri
    // portföyden, harita kümesinden değil.
    expect(opts.countries).toContain("Türkiye");
    expect(opts.countries).toContain("Irak");
    expect(opts.assetClasses).toContain("AST-PORT");
    expect(opts.actionTypes).toContain("ACT-REL");
    expect(opts.statuses).toContain("Achieved");
  });
});

describe("hasActiveFilters", () => {
  it("is false for the empty filter and true once any group is set", () => {
    expect(hasActiveFilters(EMPTY_ATLAS_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_ATLAS_FILTERS, statuses: ["On Track"] })).toBe(true);
  });
});
