/**
 * Rapor şablonu yapılandırmasının geriye dönük uyumluluk kuralları.
 *
 * Şablonlar Supabase'de JSONB `config` olarak saklanır; yeni bir alan
 * eklendiğinde ESKİ satırlarda o alan yoktur. "Yok" ile "kapalı" farklı
 * şeylerdir ve `?? true` / `|| true` gibi kısayollar bu ikisini karıştırır
 * (örn. `false ?? true` doğru çalışır ama `false || true` sessizce true
 * döner). Kural burada tek yerde tanımlı ve testli.
 */

/**
 * "Kontrol tarihi" satırı görünsün mü?
 *
 * Kullanıcı isteği 2026-10-08: "raporda görünmeli ancak gizlenebilir
 * durumda olmalı" → alan hiç kaydedilmemişse varsayılan AÇIK; yalnızca
 * kullanıcı bilerek kapattıysa (false) gizlenir.
 */
export function resolveShowReviewDate(raw: unknown): boolean {
  if (raw === undefined || raw === null) return true;
  return Boolean(raw);
}
