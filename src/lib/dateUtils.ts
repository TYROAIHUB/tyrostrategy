import i18n from "i18next";

export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const locale = i18n.language === "en" ? "en-US" : "tr-TR";
    return new Date(dateStr).toLocaleDateString(locale);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const locale = i18n.language === "en" ? "en-US" : "tr-TR";
    return new Date(dateStr).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Bugünün tarihi, YEREL saate göre, `YYYY-MM-DD`.
 *
 * `new Date().toISOString().slice(0, 10)` kullanmak cazip ama YANLIŞ: o UTC
 * tarihini verir. Türkiye UTC+3 olduğu için gece 00:00–03:00 arasında DÜNÜN
 * tarihini döndürür — "bugünün tarihi" isteyen her yerde sessiz bir off-by-one.
 * Kullanıcının takvimde gördüğü gün ile uygulamanın yazdığı gün aynı olmalı.
 *
 * @param now Test edilebilirlik için enjekte edilebilir.
 */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
