import type { EntityStatus } from "@/types";

/**
 * Statü ve ilerleme türetme kuralları — TEK KAYNAK.
 *
 * Bu dosya bilerek SAF: React yok, store yok, tarayıcı API'si yok, çalışma
 * zamanı importu yok. Böylece aynı kural iki yerden çalıştırılabiliyor:
 *   • uygulama içinde  → src/stores/dataStore.ts (optimistik UI + "Verileri yenile")
 *   • zamanlanmış iş   → scripts/refresh-statuses.ts (haftalık GitHub Actions)
 *
 * Kuralı SQL'e kopyalamak yerine bu yolun seçilmesinin sebebi: iş kuralının iki
 * ayrı uygulaması olsaydı biri değişip diğeri unutulduğunda zamanlanmış iş
 * uygulamayla kavga ederdi. Burada tek tanım var; her iki taraf da onu çağırıyor.
 *
 * Eşikler ve `now` DIŞARIDAN veriliyor — global okuma yok. Eşikler
 * `app_settings` tablosundan gelir (behind_threshold / atrisk_threshold);
 * `now` enjekte edilebildiği için kural zaman bağımsız test edilebiliyor.
 */

/** Risk eşikleri — beklenen ilerlemenin kaç puan gerisi hangi statüyü tetikler. */
export interface StatusThresholds {
  /** Bu farkın üstü "High Risk" (varsayılan 15) */
  behindThreshold: number;
  /** Bu farkın üstü "At Risk" (varsayılan 5) */
  atRiskThreshold: number;
}

/** Statüsü otomatik türetilmeyen, kullanıcının manuel kararı olan durumlar. */
export const LIFECYCLE_STATUSES: readonly EntityStatus[] = ["On Hold", "Cancelled", "Achieved"];

/** Projede otomatik roll-up'ın ezmediği durumlar (Achieved roll-up'tan gelebilir). */
export const PROJE_LIFECYCLE_STATUSES: readonly EntityStatus[] = ["On Hold", "Cancelled"];

/**
 * Bir aksiyonun statüsünü ilerleme + takvim konumundan türetir.
 *
 * Beklenen ilerleme = geçen süre / toplam süre. Gerçekleşen bunun ne kadar
 * gerisindeyse statü ona göre düşer. %100 her zaman "Achieved"; tarih yoksa
 * ya da bitiş başlangıçtan önceyse takvim kıyası yapılamaz, ilerlemeye bakılır.
 */
export function suggestStatusFromProgress(
  progress: number,
  startDate: string,
  endDate: string,
  thresholds: StatusThresholds,
  now: number = Date.now(),
): EntityStatus {
  if (progress >= 100) return "Achieved";
  if (!startDate || !endDate) {
    return progress === 0 ? "Not Started" : "On Track";
  }
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const totalDuration = endMs - startMs;
  if (totalDuration <= 0) return progress === 0 ? "Not Started" : "On Track";

  const elapsed = now - startMs;
  const expectedProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  const diff = expectedProgress - progress;
  if (diff > thresholds.behindThreshold) return "High Risk";
  if (diff > thresholds.atRiskThreshold) return "At Risk";
  return progress === 0 ? "Not Started" : "On Track";
}

// ===== Roll-up: projenin ilerlemesi ve statüsü aksiyonlarından =====

/** Roll-up'ın ihtiyaç duyduğu asgari aksiyon şekli. */
export interface AksiyonShape {
  id: string;
  projeId: string;
  name: string;
  status: EntityStatus;
  progress: number;
  startDate: string;
  endDate: string;
  completedAt?: string;
}

/** Roll-up'ın ihtiyaç duyduğu asgari proje şekli. */
export interface ProjeShape {
  id: string;
  name: string;
  status: EntityStatus;
  progress: number;
  completedAt?: string;
}

/** Roll-up sonucu. `completedAt` üç değerli: string = yaz, null = temizle, undefined = dokunma. */
export interface ProjeRollup {
  progress: number;
  status: EntityStatus;
  completedAt: string | null | undefined;
}

/**
 * Projenin ilerlemesi = aksiyonlarının ortalaması (yuvarlanmış).
 * Statü ESKALASYONLA gelir: bir aksiyon High Risk ise proje High Risk; yoksa
 * At Risk varsa At Risk; yoksa hepsi Achieved ise Achieved; aksi halde On Track.
 * On Hold / Cancelled kullanıcının manuel kararı, roll-up onları ezmez —
 * yalnızca ilerleme güncellenir.
 */
export function rollUpProje(
  proje: ProjeShape,
  related: AksiyonShape[],
  now: () => string = () => new Date().toISOString(),
): ProjeRollup | null {
  if (related.length === 0) return null;

  const progress = Math.round(related.reduce((sum, a) => sum + a.progress, 0) / related.length);
  if (PROJE_LIFECYCLE_STATUSES.includes(proje.status)) {
    return { progress, status: proje.status, completedAt: undefined };
  }

  const hasHighRisk = related.some((a) => a.status === "High Risk");
  const hasAtRisk = related.some((a) => a.status === "At Risk");
  const allAchieved = related.every((a) => a.status === "Achieved");

  if (hasHighRisk) return { progress, status: "High Risk", completedAt: null };
  if (hasAtRisk) return { progress, status: "At Risk", completedAt: null };
  if (allAchieved) {
    // Tarih UYDURMUYORUZ: zaten Achieved'sa mevcut tarihe dokunulmuyor.
    return { progress, status: "Achieved", completedAt: proje.status !== "Achieved" ? now() : undefined };
  }
  return { progress, status: "On Track", completedAt: null };
}

// ===== Toplu tazeleme planı =====

export interface AksiyonChange {
  id: string;
  name: string;
  status: EntityStatus;
  /** string = yaz, null = NULL yap, undefined = dokunma */
  completedAt: string | null | undefined;
}
export interface ProjeChange {
  id: string;
  name: string;
  progress: number;
  status: EntityStatus;
  completedAt: string | null | undefined;
}

export interface RefreshPlan<A extends AksiyonShape = AksiyonShape> {
  /** Yazılması gereken aksiyon değişiklikleri */
  aksiyonlar: AksiyonChange[];
  /** Yazılması gereken proje değişiklikleri */
  projeler: ProjeChange[];
  /** Aksiyon geçişi uygulanmış liste — proje roll-up'ı bunun üzerinden hesaplandı */
  nextAksiyonlar: A[];
}

/**
 * "Verileri yenile" ve haftalık zamanlanmış işin ORTAK beyni.
 *
 * İki geçiş:
 *   1. Aksiyonlar — yaşam döngüsü statüleri atlanır; kalanların statüsü
 *      takvimden türetilir. Tamamlanma tarihi hedef statüyle tutarlı tutulur:
 *      Achieved ise tarih olmalı (yoksa damgalanır), değilse olmamalı
 *      (varsa temizlenir).
 *   2. Projeler — GÜNCELLENMİŞ aksiyon statüleri üzerinden roll-up.
 *
 * Yalnızca GERÇEKTEN değişenler döner; hiçbir şey değişmiyorsa listeler boştur.
 * Bu, işin idempotent olmasını sağlar: ikinci koşuş sıfır değişiklik üretir.
 */
export function planStatusRefresh<P extends ProjeShape, A extends AksiyonShape>(
  projeler: P[],
  aksiyonlar: A[],
  thresholds: StatusThresholds,
  nowMs: number = Date.now(),
): RefreshPlan<A> {
  const nowIso = () => new Date(nowMs).toISOString();
  const aksiyonChanges: AksiyonChange[] = [];

  const nextAksiyonlar = aksiyonlar.map((a) => {
    if (LIFECYCLE_STATUSES.includes(a.status)) return a;

    const suggested = suggestStatusFromProgress(a.progress ?? 0, a.startDate, a.endDate, thresholds, nowMs);
    const hasDate = a.completedAt != null;
    const nextDate: string | null | undefined =
      suggested === "Achieved"
        ? hasDate ? undefined : nowIso()
        : hasDate ? null : undefined;

    if (suggested === a.status && nextDate === undefined) return a;
    aksiyonChanges.push({ id: a.id, name: a.name, status: suggested, completedAt: nextDate });
    return {
      ...a,
      status: suggested,
      ...(nextDate !== undefined ? { completedAt: nextDate ?? undefined } : {}),
    };
  });

  const byProje = new Map<string, A[]>();
  for (const a of nextAksiyonlar) {
    const list = byProje.get(a.projeId);
    if (list) list.push(a);
    else byProje.set(a.projeId, [a]);
  }

  const projeChanges: ProjeChange[] = [];
  for (const proje of projeler) {
    const related = byProje.get(proje.id);
    if (!related) continue;
    const rolled = rollUpProje(proje, related, nowIso);
    if (!rolled) continue;

    const progressChanged = proje.progress !== rolled.progress;
    const statusChanged = proje.status !== rolled.status;
    const dateChanged =
      rolled.completedAt !== undefined && (proje.completedAt ?? null) !== rolled.completedAt;

    if (progressChanged || statusChanged || dateChanged) {
      projeChanges.push({
        id: proje.id,
        name: proje.name,
        progress: rolled.progress,
        status: rolled.status,
        completedAt: rolled.completedAt,
      });
    }
  }

  return { aksiyonlar: aksiyonChanges, projeler: projeChanges, nextAksiyonlar };
}
