import type { LocationDefinition } from "@/types";

/**
 * Lokasyon etiketi biçimlendirme — tek kaynak.
 *
 * Proje listesi, detay paneli, kokpit master-detail, workspace kartları ve
 * wizard özeti aynı gösterimi kullanır ki kullanıcı her ekranda aynı metni
 * görsün. Boş dönüş = lokasyon yok; çağıran taraf kendi placeholder'ını
 * ("—" / "-") basar çünkü her ekranın boş-değer göstergesi farklı.
 */

/** Ülke ile şehir arasındaki ayırıcı. Tek yerde tanımlı — değişirse her ekran birlikte değişir. */
export const LOCATION_SEPARATOR = " / ";

/** "Türkiye / İstanbul". Kayıt yoksa boş string. */
export function formatLocationLabel(loc: LocationDefinition | undefined | null): string {
  if (!loc) return "";
  return `${loc.country}${LOCATION_SEPARATOR}${loc.city}`;
}

/** locationId → "Türkiye / İstanbul". id yoksa veya tanım silinmişse boş string. */
export function resolveLocationLabel(
  locationId: string | undefined | null,
  locations: LocationDefinition[]
): string {
  if (!locationId) return "";
  return formatLocationLabel(locations.find((l) => l.id === locationId));
}
