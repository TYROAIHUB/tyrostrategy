import { useMemo } from "react";
import { useTranslation } from "react-i18next";
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

/**
 * Right-side companion to BreakdownMatrixCard. Lists every tag that
 * actually appears on a project, sorted by count desc, rendered as a
 * horizontal bar with a blue-family color (navy → turquoise gradient)
 * indexed by position in the sorted list.
 */
export default function TagDistributionCard({ projeler }: Props) {
  const { t } = useTranslation();

  // Build { tagName → count } in one pass — reuses the pattern from
  // MyProjectsList for consistency.
  const rows = useMemo(() => {
    const tagCount = new Map<string, number>();
    for (const h of projeler) {
      for (const tag of h.tags ?? []) {
        tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
      }
    }

    // Rank by count desc; darkest blue for #1, lightest/turquoise for last.
    // Wrap around modulo if tag count exceeds palette length.
    return Array.from(tagCount.entries())
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        name,
        count,
        color: BLUE_GRADIENT[i % BLUE_GRADIENT.length],
      }));
  }, [projeler]);

  const max = rows[0]?.count ?? 0;

  return (
    <GlassCard className="p-5 flex-1 flex flex-col w-full">
      <h3 className="text-[13px] font-bold text-tyro-text-primary mb-1">
        {t("dashboard.tagDistribution")}
      </h3>
      <p className="text-[11px] text-tyro-text-secondary mb-4">
        {t("dashboard.tagDistributionDesc")}
      </p>

      {rows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[12px] text-tyro-text-muted">
          {t("common.noResults")}
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {rows.map(({ name, count, color }) => {
            // Fill width scaled to the biggest bucket so the heaviest tag
            // fills the row and the rest are relative to it. Tag name +
            // count both render INSIDE the pill (user request 2026-05-08):
            // a single full-width pill per tag instead of a separate
            // left-side label + bar. Two layers handle text contrast —
            // colored text under, white text clipped to the filled width.
            const pct = max > 0 ? Math.round((count / max) * 100) : 0;
            const label = `${count} ${t("dashboard.project").toLowerCase()}`;
            return (
              <div
                key={name}
                className="relative h-12 rounded-xl overflow-hidden"
                style={{ backgroundColor: `${color}14` }}
              >
                {/* Filled portion (colored) */}
                <div
                  className="absolute inset-y-0 left-0 transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
                {/* Color text layer — visible on the light unfilled side */}
                <div className="absolute inset-0 flex items-center justify-between gap-2 px-4 pointer-events-none">
                  <span
                    className="text-[12.5px] font-semibold truncate"
                    style={{ color }}
                  >
                    {name}
                  </span>
                  <span
                    className="text-[11.5px] font-bold tabular-nums shrink-0"
                    style={{ color }}
                  >
                    {label}
                  </span>
                </div>
                {/* White text layer — clipped to the filled width so it
                    only shows on top of the colored fill, giving proper
                    contrast on both halves of the pill. */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}
                >
                  <div className="absolute inset-0 flex items-center justify-between gap-2 px-4">
                    <span className="text-[12.5px] font-semibold truncate text-white drop-shadow-sm">
                      {name}
                    </span>
                    <span className="text-[11.5px] font-bold tabular-nums shrink-0 text-white drop-shadow-sm">
                      {label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
