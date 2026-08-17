/**
 * CAPEX / para biçimlendirme — tek kaynak.
 *
 * Proje tutarları USD tutuluyor (`projeler.capex_usd`, migration 033).
 * Gösterim aktif dile göre gruplanır (TR: 1.250.000 — EN: 1,250,000) ama
 * para birimi her zaman USD; kur çevrimi YOK, alan zaten USD.
 */

export const CAPEX_CURRENCY = "USD";

/** Formda kullanıcının girdiği metni sayıya çevirir.
 *
 *  Kullanıcı "1.250.000", "1,250,000", "1250000" veya "1250000.50" yazabilir.
 *  Basamak ayırıcılarını atıp ondalık ayırıcıyı normalize ediyoruz:
 *    • Son ayırıcı karakterden sonra 1-2 hane varsa → ondalık ayırıcı
 *    • Aksi halde tümü basamak ayırıcısı
 *  Geçersiz / boş girdi için null döner (alan opsiyonel → NULL). */
export function parseCapexInput(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;

  // Sadece rakam, nokta, virgül ve boşluk kabul ediyoruz
  if (!/^[\d.,\s]+$/.test(s)) return null;
  const cleaned = s.replace(/\s/g, "");

  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  const lastSep = Math.max(lastDot, lastComma);

  let normalized: string;
  if (lastSep === -1) {
    normalized = cleaned;
  } else {
    const decimals = cleaned.length - lastSep - 1;
    if (decimals >= 1 && decimals <= 2) {
      // Son ayırıcı ondalık: öncesindeki tüm ayırıcıları at
      const intPart = cleaned.slice(0, lastSep).replace(/[.,]/g, "");
      const fracPart = cleaned.slice(lastSep + 1);
      normalized = `${intPart}.${fracPart}`;
    } else {
      // Hepsi basamak ayırıcısı
      normalized = cleaned.replace(/[.,]/g, "");
    }
  }

  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** Tam gösterim: "1.250.000 USD" (tr) / "1,250,000 USD" (en).
 *  Değer yoksa boş string — çağıran taraf "—" basar. */
export function formatCapex(
  value: number | undefined | null,
  locale: string = "tr"
): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return "";
  const grouped = new Intl.NumberFormat(locale, {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(value);
  return `${grouped} ${CAPEX_CURRENCY}`;
}

/** Dar alanlar (tablo hücresi, kompakt kart) için kısaltılmış gösterim:
 *  1.250.000 → "1,25 Mn USD" · 12.000 → "12 B USD"
 *  Eşik altındaki değerler tam gösterime düşer. */
export function formatCapexCompact(
  value: number | undefined | null,
  locale: string = "tr"
): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return "";
  const isTr = locale.startsWith("tr");
  const MILLION = 1_000_000;
  const THOUSAND = 1_000;

  const fmt = (n: number, digits: number) =>
    new Intl.NumberFormat(locale, {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0,
    }).format(n);

  if (value >= MILLION) {
    return `${fmt(value / MILLION, 2)} ${isTr ? "Mn" : "M"} ${CAPEX_CURRENCY}`;
  }
  if (value >= 10 * THOUSAND) {
    return `${fmt(value / THOUSAND, 0)} ${isTr ? "B" : "K"} ${CAPEX_CURRENCY}`;
  }
  return formatCapex(value, locale);
}
