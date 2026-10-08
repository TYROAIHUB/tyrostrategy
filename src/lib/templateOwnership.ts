/**
 * Rapor şablonu sahiplik kuralları — TEK KAYNAK.
 *
 * Kullanıcı kuralı (2026-10-08): "ben diğer adminin oluşturduğu şablonu
 * görebilmeliyim ama silmemeliyim."
 *
 * Yani GÖRÜNÜRLÜK ile YAZMA yetkisi ayrı iki karar:
 *   • Görünürlük → rol (Admin hepsini görür, diğerleri kendilerininkini)
 *   • Yazma (sil / üzerine yaz) → yalnızca sahibi, rolden bağımsız
 *
 * Aynı karşılaştırma üç katmanda tekrarlanıyor (arayüz butonu, adaptör
 * bariyeri, RLS politikası); üçünün de aynı sonucu vermesi için e-posta
 * karşılaştırması burada tek yerde tanımlı. RLS tarafı da lower() kullanır.
 */

/** İki e-postayı büyük/küçük harf ve boşluk duyarsız karşılaştırır. */
export function sameEmail(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Şablon bu kullanıcıya mı ait?
 *
 * `ownerEmail` yoksa şablon yereldir (mock mod / localStorage) — orada tek
 * kullanıcı vardır, dolayısıyla sahibi kullanıcının kendisidir.
 */
export function isOwnReportTemplate(
  ownerEmail: string | null | undefined,
  currentEmail: string | null | undefined
): boolean {
  if (!ownerEmail) return true;
  return sameEmail(ownerEmail, currentEmail);
}
