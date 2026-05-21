/**
 * Kontrol bekleyen proje tespiti — kullanıcı isteği 2026-05-10.
 *
 * Tanım: mevcut TAKVİM ayında (now.year + now.month) kontrol edilmemiş
 * projeler pending sayılır. "Kontrol edilmiş" = reviewDate o ay+yıla
 * düşüyor. Hariç tutulan statüler:
 *   - Achieved (Tamamlandı) — kapanmış, kontrol gerektirmiyor
 *   - Cancelled (İptal)     — iptal edilmiş, kontrol gerektirmiyor
 *   - On Hold (Askıda)      — beklemede tutulan, periyodik kontrol kapsamı dışı
 *
 * Eski (rolling 30-gün) mantık değiştirildi; takvim ayı bazlı kıyaslama
 * yöneticinin "bu ay neleri kontrol ettim" perspektifiyle daha tutarlı.
 *
 * Tek kaynak: BentoKPI overdueCount, WorkspacePage summaryItems ve
 * KokpitPage reviewOverdue URL filtresi bu helper'ı çağırır. 3 yerde
 * mantık sapması olmaz, sayı ile filtrelenmiş liste daima eşleşir.
 */
export function isReviewPending(
  proje: { reviewDate?: string | null; status: string },
  now: Date = new Date(),
): boolean {
  if (proje.status === "Achieved" || proje.status === "Cancelled" || proje.status === "On Hold") {
    return false;
  }
  if (!proje.reviewDate) return true; // hiç kontrol set edilmemiş
  const r = new Date(proje.reviewDate);
  if (Number.isNaN(r.getTime())) return true; // bozuk tarih → pending (güvenli taraf)
  return r.getFullYear() !== now.getFullYear() || r.getMonth() !== now.getMonth();
}
