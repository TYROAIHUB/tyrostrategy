import type { EntityStatus, LocationDefinition, UserRole } from "@/types";
import { formatLocationLabel } from "@/lib/locations";
import { normalizeGeoKey } from "@/config/geoCoordinates";
import { isAssetClass, isActionType, CODE_LABEL_SEPARATOR } from "@/config/projectTaxonomy";
import { parseCapexInput } from "@/lib/money";

/**
 * Veri Yönetimi sayfasının dışa/içe aktarma dönüşümleri.
 *
 * Daha önce bu mantık `VeriYonetimiPage` içinde iç fonksiyonlardı; iki sorun
 * vardı: (1) her render'da yeniden yaratılıyorlardı, (2) test edilemiyorlardı.
 * Burada saf fonksiyonlar hâlinde duruyorlar — sayfa yalnızca iki giriş
 * noktası çağırıyor: `buildSheetRows` (dışa) ve `prepareImportRows` (içe).
 *
 * Tasarım kararı — hangi sütun nereden geliyor:
 *   • JSON = uygulama↔uygulama tel formatı, HAM iç şekli korur (locationId
 *     UUID'si dahil). Bu dosyadaki dönüşümler JSON'a uygulanmaz.
 *   • CSV / XLSX = insanın açıp düzenlediği format. Burada `locationId`
 *     UUID'si yerine okunabilir "Türkiye / İstanbul" etiketi yazılır;
 *     içe aktarmada etiket tekrar UUID'ye çözülür.
 */

/** Dönüşümlerin ihtiyaç duyduğu mağaza bağlamı — lokasyon etiketi ↔ id çözümü için. */
export interface TransferContext {
  locations: LocationDefinition[];
}

// ===== Header maps — internal field ↔ user-visible Turkish label =====
// Hem dışa aktarmada (anahtarları etikete çevir) hem içe aktarmada (iç ad VEYA
// Türkçe başlık kabul et) kullanılır; böylece her dönemden gelen dosya
// sorunsuz gidip geliyor. Uygulamaya yeni bir kolon eklendiğinde BURAYA da
// eklenir — Excel şablonunun tek doğruluk kaynağı burası.
export const PROJELER_HEADER_MAP: Record<string, string> = {
  id: "ID",
  name: "Proje Adı",
  description: "Açıklama",
  source: "İş Kolu",
  status: "Durum",
  owner: "Proje Lideri",
  participants: "Proje Üyeleri",
  department: "Departman",
  progress: "İlerleme (%)",
  startDate: "Başlangıç Tarihi",
  endDate: "Bitiş Tarihi",
  reviewDate: "Kontrol Tarihi",
  tags: "Etiketler",
  // ── migration 031/032/033 ile gelen yatırım alanları ──
  location: "Lokasyon",
  locationId: "Lokasyon ID",
  capexUsd: "CAPEX (USD)",
  assetClass: "Varlık Sınıfı",
  actionType: "Yatırım Tipi",
  parentObjectiveId: "Üst Proje ID",
  createdBy: "Oluşturan",
  createdAt: "Oluşturulma",
  updatedBy: "Güncelleyen",
  updatedAt: "Son Güncelleme",
  completedAt: "Tamamlanma",
};
export const AKSIYONLAR_HEADER_MAP: Record<string, string> = {
  id: "ID",
  projeId: "Proje ID",
  name: "Aksiyon Adı",
  description: "Açıklama",
  owner: "Sorumlu",
  status: "Durum",
  progress: "İlerleme (%)",
  startDate: "Başlangıç Tarihi",
  endDate: "Bitiş Tarihi",
  sortOrder: "Sıra",
  createdBy: "Oluşturan",
  createdAt: "Oluşturulma",
  updatedBy: "Güncelleyen",
  updatedAt: "Son Güncelleme",
  completedAt: "Tamamlanma",
};
export const ETIKETLER_HEADER_MAP: Record<string, string> = {
  id: "ID",
  name: "Etiket Adı",
  color: "Renk",
};
export const LOKASYONLAR_HEADER_MAP: Record<string, string> = {
  id: "ID",
  country: "Ülke",
  city: "Şehir",
};
export const KULLANICILAR_HEADER_MAP: Record<string, string> = {
  id: "ID",
  email: "E-posta",
  displayName: "Ad Soyad",
  department: "Departman",
  role: "Rol",
  locale: "Dil",
  title: "Ünvan",
  isActive: "Aktif",
  createdAt: "Oluşturulma",
  updatedAt: "Son Güncelleme",
};
export const HEADER_MAPS: Record<string, Record<string, string>> = {
  projeler: PROJELER_HEADER_MAP,
  aksiyonlar: AKSIYONLAR_HEADER_MAP,
  etiketler: ETIKETLER_HEADER_MAP,
  lokasyonlar: LOKASYONLAR_HEADER_MAP,
  kullanicilar: KULLANICILAR_HEADER_MAP,
};

/**
 * Tabloya göre CSV/XLSX'te GÖSTERİLMEYECEK iç alanlar.
 *
 * `locationId` çıplak bir UUID; elektronik tabloda hiçbir anlamı yok ve
 * kullanıcı elle düzenleyemez. Yerine okunabilir `location` etiketi yazılıyor,
 * içe aktarmada etiketten UUID'ye geri çözülüyor. Yine de başlık haritasında
 * duruyor: eski dosyalarda ya da JSON kökenli veride bu kolon varsa içe
 * aktarma onu okumaya devam etsin.
 */
const SHEET_EXCLUDED_COLUMNS: Record<string, ReadonlySet<string>> = {
  projeler: new Set(["locationId"]),
};

/** Statü CHECK kısıtının kabul ettiği değerler — içe aktarmada erken uyarı için. */
const VALID_STATUSES: ReadonlySet<string> = new Set<EntityStatus>([
  "On Track", "Achieved", "High Risk", "At Risk", "Not Started", "Cancelled", "On Hold",
]);

/** users.role CHECK kısıtının allowlist'i. */
const VALID_ROLES: ReadonlySet<UserRole> = new Set<UserRole>([
  "Admin", "Proje Lideri", "Management",
]);

/** Zorunlu alanlar — iç alan adları üzerinden (alias + normalize sonrası). */
const REQUIRED_FIELDS: Record<string, string[]> = {
  projeler: ["name", "status", "startDate", "endDate"],
  aksiyonlar: ["name", "projeId", "status", "startDate", "endDate"],
  etiketler: ["name", "color"],
  lokasyonlar: ["country", "city"],
  kullanicilar: ["email", "displayName", "role"],
};

// ===== Dışa aktarma =====

/**
 * İç anahtarları ("startDate") Türkçe etikete ("Başlangıç Tarihi") çevir.
 * Haritada olmayan anahtar aynen geçer — yeni bir alan eklendiğinde sessizce
 * düşmek yerine ham adıyla görünsün.
 */
export function applyExportLabels(
  tableId: string,
  data: Record<string, unknown>[],
): Record<string, unknown>[] {
  const map = HEADER_MAPS[tableId];
  if (!map) return data;
  return data.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) out[map[k] ?? k] = v;
    return out;
  });
}

/** Dizileri "A; B; C", nesneleri JSON'a düzleştir — tek hücreye sığsın. */
export function flattenObjects(data: Record<string, unknown>[]): Record<string, unknown>[] {
  return data.map((item) => {
    const flat: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(item)) {
      if (Array.isArray(val)) flat[key] = val.join("; ");
      else if (val && typeof val === "object") flat[key] = JSON.stringify(val);
      else flat[key] = val;
    }
    return flat;
  });
}

/**
 * Tabloya özgü TÜRETİLMİŞ kolonları ekle — veritabanında olmayan, yalnızca
 * elektronik tablo okunabilirliği için hesaplanan sütunlar.
 * projeler → `location`: locationId UUID'sinin "Türkiye / İstanbul" karşılığı.
 */
export function decorateSheetRows(
  tableId: string,
  rows: Record<string, unknown>[],
  ctx: TransferContext,
): Record<string, unknown>[] {
  if (tableId !== "projeler") return rows;
  const byId = new Map(ctx.locations.map((l) => [l.id, l]));
  return rows.map((row) => ({
    ...row,
    location: formatLocationLabel(byId.get(String(row.locationId ?? ""))),
  }));
}

/**
 * Sütun kümesini ve SIRASINI sabitle.
 *
 * Neden gerekli: yeni alanların hepsi opsiyonel. Eski kod CSV başlıklarını
 * `Object.keys(flat[0])` ile — yani YALNIZCA İLK SATIRDAN — alıyordu; ilk
 * projede CAPEX boşsa kolon TÜM satırlar için kayboluyordu. XLSX tarafında da
 * kolon sırası ilk-görülen-anahtara göre değişkendi. Burada başlık haritasının
 * sırası otoriter: her satır aynı anahtar kümesini alıyor, eksik değer "" olur.
 * Haritada olmayan ama veride bulunan anahtarlar sona eklenir (sessiz kayıp yok).
 */
export function orderSheetColumns(
  tableId: string,
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  if (rows.length === 0) return rows;
  const map = HEADER_MAPS[tableId];
  const excluded = SHEET_EXCLUDED_COLUMNS[tableId] ?? new Set<string>();

  const present = new Set<string>();
  for (const row of rows) for (const k of Object.keys(row)) present.add(k);

  const ordered: string[] = [];
  if (map) {
    for (const k of Object.keys(map)) {
      if (present.has(k) && !excluded.has(k)) ordered.push(k);
    }
  }
  // Haritada tanımlı olmayan alanlar — sona, stabil sırayla.
  for (const k of present) {
    if (!excluded.has(k) && !ordered.includes(k)) ordered.push(k);
  }

  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const k of ordered) out[k] = row[k] ?? "";
    return out;
  });
}

/**
 * CSV/XLSX satırlarını üreten tek giriş noktası:
 * düzleştir → türetilmiş kolonları ekle → sütunları sırala → etiketle.
 */
export function buildSheetRows(
  tableId: string,
  data: Record<string, unknown>[],
  ctx: TransferContext,
): Record<string, unknown>[] {
  return applyExportLabels(
    tableId,
    orderSheetColumns(tableId, decorateSheetRows(tableId, flattenObjects(data), ctx)),
  );
}

/** RFC 4180 kaçışlı CSV üret. Satırlar aynı anahtar kümesine sahip varsayılmaz. */
export function arrayToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";
  const headers: string[] = [];
  for (const row of data) for (const k of Object.keys(row)) if (!headers.includes(k)) headers.push(k);
  const cell = (v: unknown): string => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = data.map((row) => headers.map((h) => cell(row[h])).join(","));
  return [headers.map(cell).join(","), ...rows].join("\n");
}

/**
 * RFC 4180 uyumlu CSV çözümleyici.
 *
 * Eskisi `line.split(",")` yapıyordu; kendi ürettiğimiz dosyayı geri okurken
 * bile bozuyordu — virgül içeren bir açıklama alanı tırnaklanıyor, naif bölme
 * ise tırnağı görmezden gelip o satırdaki TÜM sütunları kaydırıyordu. Yeni
 * alanlar tablonun sonuna geldiği için kayma en çok onları vuruyordu.
 */
export function csvToArray(csv: string): Record<string, string>[] {
  const text = csv.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ",") { row.push(field); field = ""; continue; }
    if (ch === "\r") continue;
    if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue; }
    field += ch;
  }
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (nonEmpty.length < 2) return [];
  const headers = nonEmpty[0].map((h) => h.trim());
  return nonEmpty.slice(1).map((values) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (values[i] ?? "").trim(); });
    return obj;
  });
}

// ===== İçe aktarma =====

/**
 * Türkçe başlıklı satırı iç alan adlarına çevir. Eşleşme büyük/küçük harf ve
 * boşluk toleranslı; hâlihazırda iç adla gelen anahtar aynen geçer.
 */
export function applyImportAliases(
  tableId: string,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const map = HEADER_MAPS[tableId];
  if (!map) return row;
  const reverseLookup = new Map<string, string>();
  for (const [internal, label] of Object.entries(map)) {
    reverseLookup.set(label.toLowerCase().trim(), internal);
    reverseLookup.set(internal.toLowerCase(), internal);
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const internal = reverseLookup.get(k.toLowerCase().trim()) ?? k;
    out[internal] = v;
  }
  return out;
}

/**
 * "AST-PROC — Üretim tesisi" ya da " ast-proc " gibi girdiden sabit kodu çıkar.
 * Arayüz seçim kutuları "KOD — Ad" gösterdiği için kullanıcı o metni kopyalayıp
 * hücreye yapıştırabiliyor; kodu ayıklayıp büyük harfe çeviriyoruz.
 */
function extractTaxonomyCode(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const head = raw.split(CODE_LABEL_SEPARATOR)[0] ?? raw;
  return head.trim().toUpperCase();
}

/**
 * Satır bazlı değer normalizasyonu — alias adımından SONRA çalışır.
 *   • projeler/aksiyonlar: eski statü "Behind" → "High Risk" (migration 010),
 *     `progress` sayıya çevrilir.
 *   • projeler: participants + tags "A; B; C" dizgesinden diziye döner;
 *     `capexUsd` "1.250.000" gibi biçimli girdiden sayıya çözülür;
 *     varlık sınıfı / yatırım tipi koda indirgenir; `location` etiketi
 *     `locationId` UUID'sine çözülür.
 *   • kullanicilar: locale kodu ve isActive boolean'ı toleranslı okunur.
 */
export function normalizeImportRow(
  tableId: string,
  row: Record<string, unknown>,
  ctx: TransferContext,
): Record<string, unknown> {
  const r = { ...row };
  const parseArr = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    if (typeof v === "string" && v.trim()) return v.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    return [];
  };

  if (tableId === "projeler" || tableId === "aksiyonlar") {
    if (r.status === "Behind") r.status = "High Risk" as EntityStatus;
    if (r.progress !== undefined && typeof r.progress !== "number") {
      const n = Number(r.progress);
      if (!Number.isNaN(n)) r.progress = n;
    }
  }

  if (tableId === "projeler") {
    r.participants = parseArr(r.participants);
    r.tags = parseArr(r.tags);

    // CAPEX — hücre sayı da olabilir, "1.250.000" / "1,250,000" da.
    // Çözülemeyen metin SİLİNMİYOR, ham bırakılıyor: `parseCapexInput` negatif
    // ve alfabetik girdiye null döner; silmek sessiz veri kaybı olurdu.
    // Ham değeri bırakınca `collectImportIssues` satır numarasıyla bildiriyor.
    if (r.capexUsd === null) delete r.capexUsd;
    else if (typeof r.capexUsd === "string") {
      const trimmed = r.capexUsd.trim();
      if (!trimmed) delete r.capexUsd;
      else {
        const parsed = parseCapexInput(trimmed);
        r.capexUsd = parsed === null ? trimmed : parsed;
      }
    }

    // Sabit seçimler — koda indirge; geçersiz kalan değer doğrulamada yakalanır.
    for (const key of ["assetClass", "actionType"] as const) {
      if (r[key] === "" || r[key] === null || r[key] === undefined) { delete r[key]; continue; }
      r[key] = extractTaxonomyCode(r[key]);
    }

    // Lokasyon: açık `locationId` varsa o kazanır; yoksa "Türkiye / İstanbul"
    // etiketi tanımlı lokasyonlarla eşleştirilir. Eşleşmezse `location`
    // olduğu gibi kalır ve `collectImportIssues` bunu kullanıcıya bildirir.
    const rawLabel = typeof r.location === "string" ? r.location.trim() : "";
    if (typeof r.locationId === "string" && r.locationId.trim()) {
      r.locationId = r.locationId.trim();
      delete r.location;
    } else if (rawLabel) {
      const key = normalizeGeoKey(rawLabel);
      const hit = ctx.locations.find((l) => normalizeGeoKey(formatLocationLabel(l)) === key);
      if (hit) { r.locationId = hit.id; delete r.location; }
      else delete r.locationId;
    } else {
      delete r.location;
      delete r.locationId;
    }
  }

  if (tableId === "kullanicilar") {
    if (typeof r.locale === "string") {
      const l = r.locale.toLowerCase().trim();
      r.locale = l.startsWith("en") || l.startsWith("ing") ? "en" : "tr";
    }
    if (r.isActive !== undefined && typeof r.isActive !== "boolean") {
      const v = String(r.isActive).toLowerCase().trim();
      r.isActive = v === "true" || v === "1" || v === "evet" || v === "yes" || v === "aktif";
    }
  }

  return r;
}

/** Doğrulama bulgusu — sayfa bunu `dataManagement.requiredField` ile çevirir. */
export interface ImportIssue {
  /** 1 tabanlı satır numarası (başlık satırı hariç). */
  row: number;
  /** Alan adı ya da "status=Foo" gibi açıklayıcı ifade. */
  field: string;
}

/**
 * Zorunlu alan + enum + sayı denetimleri. Amaç: kullanıcıya SATIR NUMARASI
 * vermek — aksi hâlde hata PostgREST'ten jenerik bir CHECK ihlali olarak döner.
 */
export function collectImportIssues(
  tableId: string,
  rows: Record<string, unknown>[],
): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const required = REQUIRED_FIELDS[tableId] ?? [];

  rows.forEach((row, i) => {
    const line = i + 1;
    for (const field of required) {
      if (!row[field] && row[field] !== 0) issues.push({ row: line, field });
    }

    if (tableId === "projeler" || tableId === "aksiyonlar") {
      const s = row.status;
      if (typeof s === "string" && !VALID_STATUSES.has(s)) issues.push({ row: line, field: `status=${s}` });
    }

    if (tableId === "projeler") {
      if (row.assetClass !== undefined && !isAssetClass(row.assetClass)) {
        issues.push({ row: line, field: `assetClass=${String(row.assetClass)}` });
      }
      if (row.actionType !== undefined && !isActionType(row.actionType)) {
        issues.push({ row: line, field: `actionType=${String(row.actionType)}` });
      }
      // capex_usd CHECK kısıtı negatifi reddediyor — burada yakala.
      if (row.capexUsd !== undefined) {
        const n = Number(row.capexUsd);
        if (Number.isNaN(n) || n < 0) issues.push({ row: line, field: `capexUsd=${String(row.capexUsd)}` });
      }
      // Çözülemeyen lokasyon etiketi: sessizce düşürmek yerine bildir.
      if (typeof row.location === "string" && row.location.trim()) {
        issues.push({ row: line, field: `location=${row.location.trim()}` });
      }
    }

    if (tableId === "kullanicilar") {
      const r = row.role;
      if (typeof r === "string" && !VALID_ROLES.has(r as UserRole)) issues.push({ row: line, field: `role=${r}` });
    }
  });

  return issues;
}

/** `prepareImportRows` sonucu — mağazaya yazılacak satırlar + kullanıcıya gösterilecek bulgular. */
export interface PreparedImport {
  rows: Record<string, unknown>[];
  issues: ImportIssue[];
}

/**
 * İçe aktarmanın tek giriş noktası: başlık alias'ı → değer normalizasyonu →
 * doğrulama. Türetilmiş `location` kolonu mağazaya yazılmadan önce
 * temizlenir; `Proje` tipinde böyle bir alan yok.
 */
export function prepareImportRows(
  tableId: string,
  raw: Record<string, unknown>[],
  ctx: TransferContext,
): PreparedImport {
  const normalized = raw.map((row) => normalizeImportRow(tableId, applyImportAliases(tableId, row), ctx));
  const issues = collectImportIssues(tableId, normalized);
  const rows = normalized.map((row) => {
    if (!("location" in row)) return row;
    const { location: _label, ...rest } = row;
    return rest;
  });
  return { rows, issues };
}
