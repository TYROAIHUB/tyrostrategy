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
