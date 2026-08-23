import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import type { Proje } from "@/types";

interface Props {
  projeler: Proje[];
}

// Olgunlaşma Seviyesi Dağılımı kartına özel mavi gradyenti — en yoğun
// olgunlaşma seviyesi deep navy, en düşük turkuaz. Sadece BU kart için
// kullanılır (user request 2026-04-22): tag'lerin kendi rengi yerine
// tutarlı mavi tonlamasıyla hiyerarşi hissi verilsin. Diğer yerlerde
// (MyProjectsList, BreakdownMatrix vb.) tag'ler hâlâ kendi renkleriyle.
const BLUE_GRADIENT = [
  "#0B2545", // deep navy
  "#1E3A8A", // navy
  "#1D4ED8", // royal
  "#2563EB", // blue
  "#3B82F6", // bright blue
  "#0EA5E9", // sky
  "#06B6D4", // cyan
  "#14B8A6", // teal
  "#2DD4BF", // turquoise
  "#67E8F9", // light cyan
];

/** Seviye kutusunun asla altına inmeyeceği yükseklik — çok sayıda etiket
 *  olduğunda kutular ezilmesin, kart kaydırmaya geçsin. */
const MIN_TILE_HEIGHT = 72;

/**
 * Rec. 601 luma ile metin rengi seçimi.
 *
 * Palet turkuaz/açık camgöbeği uçlarına gidebiliyor; oralarda beyaz yazı
 * okunmuyordu. Açık zeminlerde koyu lacivert metne düşüyoruz — aynı
 * yaklaşım MasterDetailView'daki marker luminance kontrolünde de var.
 */
function readableTextColor(hex: string): { text: string; softText: string; track: string } {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const isLight = 0.299 * r + 0.587 * g + 0.114 * b > 168;
  return isLight
    ? { text: "#0B2545", softText: "rgba(11,37,69,0.72)", track: "rgba(11,37,69,0.18)" }
    : { text: "#ffffff", softText: "rgba(255,255,255,0.78)", track: "rgba(255,255,255,0.22)" };
}

/**
 * BreakdownMatrixCard'ın sağ yanındaki eş kart. Projelerde fiilen kullanılan
 * her olgunlaşma etiketini adede göre azalan sırada listeler.
 *
 * YERLEŞİM (kullanıcı isteği): kutular kartın TAMAMINI kaplar ve mevcut
 * yüksekliği EŞ PAYLA bölüşür — iki seviye varsa her biri yarısını alır.
 * Önceki sürümde kutular sabit h-12'ydi, altta büyük bir boşluk kalıyordu.
 *
 * Kutu içi, açılan dikey alanı bilgiyle dolduruyor: sıra rozeti, seviye adı,
 * proje adedi, portföy payı yüzdesi ve payı gösteren ince çubuk. Böylece
 * büyüyen kutu boş görünmüyor, ek bilgi taşıyor.
 */
export default function TagDistributionCard({ projeler }: Props) {
  const { t } = useTranslation();

  const { rows, total } = useMemo(() => {
    const tagCount = new Map<string, number>();
    for (const h of projeler) {
      for (const tag of h.tags ?? []) {
        tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
      }
    }

    const list = Array.from(tagCount.entries())
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        name,
        count,
        color: BLUE_GRADIENT[i % BLUE_GRADIENT.length],
      }));

    // Pay hesabı etiketlenmiş proje toplamına göre — bir proje birden fazla
    // etiket taşıyabildiği için projeler.length ile hesaplamak yanıltıcı olur.
    const sum = list.reduce((acc, r) => acc + r.count, 0);
    return { rows: list, total: sum };
  }, [projeler]);

  return (
    <GlassCard className="flex w-full flex-1 flex-col p-5">
      <h3 className="mb-1 text-[13px] font-bold text-tyro-text-primary">
        {t("dashboard.tagDistribution")}
      </h3>
      <p className="mb-4 text-[11px] text-tyro-text-secondary">
        {t("dashboard.tagDistributionDesc")}
      </p>

      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-[12px] text-tyro-text-muted">
          {t("common.noResults")}
        </div>
      ) : (
        /* min-h-0: flex çocuklarının taşmadan küçülebilmesi için gerekli,
           yoksa kutular kartı aşağı doğru şişiriyor. */
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto">
          {rows.map(({ name, count, color }, i) => {
            const pct = total ? Math.round((count / total) * 100) : 0;
            const { text, softText, track } = readableTextColor(color);
            return (
              <motion.div
                key={name}
                // flex-1 + eşit basis → kutular kalan yüksekliği eş bölüşür
                className="relative flex flex-1 basis-0 flex-col justify-between overflow-hidden rounded-xl px-4 py-3"
                style={{
                  minHeight: MIN_TILE_HEIGHT,
                  // Düz renk yerine hafif gradyan: büyüyen kutuda yüzey ölü
                  // görünmesin, üstten alta doğru hafif derinlik olsun.
                  background: `linear-gradient(135deg, ${color} 0%, ${color}e6 55%, ${color}cc 100%)`,
                }}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                {/* Üst satır: sıra rozeti + portföy payı */}
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                    style={{ backgroundColor: track, color: text }}
                  >
                    #{i + 1}
                  </span>
                  <span
                    className="shrink-0 text-[15px] font-extrabold leading-none tabular-nums"
                    style={{ color: text }}
                  >
                    %{pct}
                  </span>
                </div>

                {/* Alt satır: seviye adı + adet */}
                <div className="mt-2 flex items-end justify-between gap-3">
                  <span
                    className="min-w-0 flex-1 truncate text-[13px] font-bold"
                    style={{ color: text }}
                    title={name}
                  >
                    {name}
                  </span>
                  <span
                    className="shrink-0 text-[11.5px] font-semibold tabular-nums"
                    style={{ color: softText }}
                  >
                    {count} {t("dashboard.project").toLowerCase()}
                  </span>
                </div>

                {/* Payı gösteren ince çubuk — yüzdenin görsel karşılığı */}
                <div
                  className="mt-2 h-1 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: track }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: text, opacity: 0.85 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
