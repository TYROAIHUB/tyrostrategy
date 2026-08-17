import type { Proje, LocationDefinition, EntityStatus, AssetClass, ProjectActionType } from "@/types";
import { resolveCoordinates, type GeoPoint } from "@/config/geoCoordinates";

/**
 * T-Atlas portföy hesapları — harita ve özet kartları AYNI kümeden beslenir.
 *
 * Dokümanın en kritik iş kuralı: "haritada görünen küme ile özetteki sayılar
 * her zaman aynıdır". Bunu garanti etmenin yolu tek bir türetme zinciri:
 *
 *   tüm projeler
 *     → selectInvestmentProjects()   (yatırım portföyü)
 *     → applyAtlasFilters()          (kullanıcı filtreleri)
 *     → resolveAtlasPoints()         (koordinatı olanlar / olmayanlar)
 *     → computePortfolioMetrics()    (6 kart)  +  computeBreakdowns()  (7 panel)
 *
 * Koordinatı olmayan projeler haritada gösterilmez ve HİÇBİR özet hesabına
 * dahil edilmez (doküman §3) — ayrıca "konumu bekleyen projeler" listesinde
 * çıkar ki eksik veri sessizce kaybolmasın.
 */

/** Riskli sayılan statüler. DB'de iki risk seviyesi var (High Risk / At Risk);
 *  doküman tek "Riskli" kartı istiyor, ikisini birleştiriyoruz. */
export const RISKY_STATUSES: readonly EntityStatus[] = ["High Risk", "At Risk"];

/** "Yeni yatırım" kartı bu aksiyon tipini sayar (doküman: ACT-NEW adedi). */
export const NEW_INVESTMENT_ACTION: ProjectActionType = "ACT-NEW";

/**
 * Yatırım portföyü ayracı.
 *
 * Sistemde "bu proje bir yatırımdır" diyen ayrı bir alan YOK. `asset_class`
 * dolu olmak doğal ayraç: varlık sınıfı yalnızca yatırım projelerine atanıyor,
 * yeni bir DB alanı gerektirmiyor.
 */
export function selectInvestmentProjects(projeler: Proje[]): Proje[] {
  return projeler.filter((p) => !!p.assetClass);
}

// ── Filtreler ───────────────────────────────────────────────────────────

export interface AtlasFilters {
  assetClasses: string[];
  actionTypes: string[];
  countries: string[];
  statuses: string[];
}

export const EMPTY_ATLAS_FILTERS: AtlasFilters = {
  assetClasses: [],
  actionTypes: [],
  countries: [],
  statuses: [],
};

export function hasActiveFilters(f: AtlasFilters): boolean {
  return (
    f.assetClasses.length > 0 ||
    f.actionTypes.length > 0 ||
    f.countries.length > 0 ||
    f.statuses.length > 0
  );
}

/** Proje → ülke adı (locations üzerinden). Lokasyon yoksa "". */
export function projectCountry(
  proje: Proje,
  locationById: Map<string, LocationDefinition>
): string {
  if (!proje.locationId) return "";
  return locationById.get(proje.locationId)?.country ?? "";
}

/**
 * Grup İÇİNDE VEYA, gruplar ARASINDA VE (doküman §7).
 * Boş grup = o eksende filtre yok.
 */
export function applyAtlasFilters(
  projeler: Proje[],
  filters: AtlasFilters,
  locationById: Map<string, LocationDefinition>
): Proje[] {
  return projeler.filter((p) => {
    if (filters.assetClasses.length && !filters.assetClasses.includes(p.assetClass ?? "")) return false;
    if (filters.actionTypes.length && !filters.actionTypes.includes(p.actionType ?? "")) return false;
    if (filters.statuses.length && !filters.statuses.includes(p.status)) return false;
    if (filters.countries.length) {
      const c = projectCountry(p, locationById);
      if (!filters.countries.includes(c)) return false;
    }
    return true;
  });
}

// ── Koordinat çözümleme ─────────────────────────────────────────────────

export interface AtlasPoint {
  proje: Proje;
  location: LocationDefinition;
  geo: GeoPoint;
}

export interface ResolvedAtlas {
  /** Haritada gösterilecek + tüm özet hesaplarına giren projeler */
  points: AtlasPoint[];
  /** Lokasyonu hiç girilmemiş VEYA koordinatı çözülemeyen projeler */
  pending: Proje[];
}

/**
 * Filtrelenmiş projeleri haritalanabilir / bekleyen diye ikiye ayırır.
 * Lokasyonu olan ama sözlükte koordinatı bulunmayan şehirler de `pending`e
 * düşer — sessizce (0,0)'a pin atmaktansa eksik olduğunu söylemek doğru.
 */
export function resolveAtlasPoints(
  projeler: Proje[],
  locationById: Map<string, LocationDefinition>
): ResolvedAtlas {
  const points: AtlasPoint[] = [];
  const pending: Proje[] = [];

  for (const proje of projeler) {
    const location = proje.locationId ? locationById.get(proje.locationId) : undefined;
    if (!location) {
      pending.push(proje);
      continue;
    }
    const geo = resolveCoordinates(location.country, location.city);
    if (!geo) {
      pending.push(proje);
      continue;
    }
    points.push({ proje, location, geo });
  }

  return { points, pending };
}

// ── Özet kartları ───────────────────────────────────────────────────────

export interface PortfolioMetrics {
  projectCount: number;
  totalCapex: number;
  /** CAPEX'i girilmiş proje adedi — "0 USD" ile "veri yok"u ayırmak için */
  capexEnteredCount: number;
  countryCount: number;
  newInvestmentCount: number;
  avgProgress: number;
  riskyCount: number;
}

export function computePortfolioMetrics(points: AtlasPoint[]): PortfolioMetrics {
  const countries = new Set<string>();
  let totalCapex = 0;
  let capexEnteredCount = 0;
  let progressSum = 0;
  let newInvestmentCount = 0;
  let riskyCount = 0;

  for (const { proje, location } of points) {
    if (location.country) countries.add(location.country);
    if (typeof proje.capexUsd === "number" && Number.isFinite(proje.capexUsd)) {
      totalCapex += proje.capexUsd;
      capexEnteredCount++;
    }
    progressSum += proje.progress ?? 0;
    if (proje.actionType === NEW_INVESTMENT_ACTION) newInvestmentCount++;
    if (RISKY_STATUSES.includes(proje.status)) riskyCount++;
  }

  const projectCount = points.length;
  return {
    projectCount,
    totalCapex,
    capexEnteredCount,
    countryCount: countries.size,
    newInvestmentCount,
    // Ortalama ilerleme: boş kümede 0, aksi halde yuvarlanmış aritmetik ortalama
    avgProgress: projectCount ? Math.round(progressSum / projectCount) : 0,
    riskyCount,
  };
}

// ── Kırılım panelleri ───────────────────────────────────────────────────

export interface BreakdownRow {
  /** Gruplama anahtarı — ülke adı, ya da AST- / ACT- taksonomi kodu */
  key: string;
  count: number;
  capex: number;
}

function toSortedRows(map: Map<string, { count: number; capex: number }>): BreakdownRow[] {
  return Array.from(map.entries())
    .map(([key, v]) => ({ key, count: v.count, capex: v.capex }))
    // Adede göre azalan; eşitlikte anahtar alfabetik (TR) — sıra kararlı olsun
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key, "tr"));
}

function accumulate(
  points: AtlasPoint[],
  keyOf: (p: AtlasPoint) => string
): BreakdownRow[] {
  const map = new Map<string, { count: number; capex: number }>();
  for (const point of points) {
    const key = keyOf(point);
    if (!key) continue;
    const cur = map.get(key) ?? { count: 0, capex: 0 };
    cur.count += 1;
    if (typeof point.proje.capexUsd === "number" && Number.isFinite(point.proje.capexUsd)) {
      cur.capex += point.proje.capexUsd;
    }
    map.set(key, cur);
  }
  return toSortedRows(map);
}

export interface AtlasBreakdowns {
  byStatus: BreakdownRow[];
  byCountry: BreakdownRow[];
  byActionType: BreakdownRow[];
  byAssetClass: BreakdownRow[];
}

/**
 * Dört eksende adet + CAPEX toplamı. Doküman 7 panel istiyor ama bunlar
 * aynı 4 kırılımın "adet" ve "CAPEX" görünümleri — tek hesap, iki gösterim.
 */
export function computeBreakdowns(points: AtlasPoint[]): AtlasBreakdowns {
  return {
    byStatus: accumulate(points, (p) => p.proje.status),
    byCountry: accumulate(points, (p) => p.location.country),
    byActionType: accumulate(points, (p) => p.proje.actionType ?? ""),
    byAssetClass: accumulate(points, (p) => p.proje.assetClass ?? ""),
  };
}

// ── Filtre seçenekleri ──────────────────────────────────────────────────

/**
 * Filtre dropdown'larını portföyde FİİLEN bulunan değerlerden doldurur —
 * kullanıcı hiçbir projede olmayan bir ülkeyi seçip boş sonuç almasın.
 * (Departman dropdown'ında da aynı yaklaşımı kullanıyoruz.)
 */
export interface AtlasFilterOptions {
  assetClasses: AssetClass[];
  actionTypes: ProjectActionType[];
  countries: string[];
  statuses: EntityStatus[];
}

export function computeFilterOptions(
  investmentProjects: Proje[],
  locationById: Map<string, LocationDefinition>
): AtlasFilterOptions {
  const assets = new Set<AssetClass>();
  const actions = new Set<ProjectActionType>();
  const countries = new Set<string>();
  const statuses = new Set<EntityStatus>();

  for (const p of investmentProjects) {
    if (p.assetClass) assets.add(p.assetClass);
    if (p.actionType) actions.add(p.actionType);
    statuses.add(p.status);
    const c = projectCountry(p, locationById);
    if (c) countries.add(c);
  }

  return {
    assetClasses: Array.from(assets).sort(),
    actionTypes: Array.from(actions).sort(),
    countries: Array.from(countries).sort((a, b) => a.localeCompare(b, "tr")),
    statuses: Array.from(statuses).sort(),
  };
}

/** locations dizisinden id→kayıt map'i. Bileşenlerde useMemo ile sarılmalı. */
export function buildLocationMap(locations: LocationDefinition[]): Map<string, LocationDefinition> {
  return new Map(locations.map((l) => [l.id, l]));
}
