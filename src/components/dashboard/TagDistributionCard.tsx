import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import GlassCard from "@/components/ui/GlassCard";
import { useDataStore } from "@/stores/dataStore";
import type { Proje } from "@/types";

interface Props {
  projeler: Proje[];
}

/**
 * Right-side companion to BreakdownMatrixCard. Lists every tag that
 * actually appears on a project, sorted by count desc, rendered as a
 * horizontal bar with the tag's own color and a trailing circular
 * "N proje" badge. Unused tag_definitions entries are skipped so the
 * list stays relevant.
 */
export default function TagDistributionCard({ projeler }: Props) {
  const { t } = useTranslation();
  const tagDefinitions = useDataStore((s) => s.tagDefinitions);

  // Build { tagName → count } in one pass — reuses the pattern from
  // MyProjectsList for consistency.
  const rows = useMemo(() => {
    const tagCount = new Map<string, number>();
    for (const h of projeler) {
      for (const tag of h.tags ?? []) {
        tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
      }
    }
    const colorFor = (name: string) =>
      tagDefinitions.find((td) => td.name === name)?.color ?? "#94a3b8";

    return Array.from(tagCount.entries())
      .filter(([, count]) => count > 0)
      .map(([name, count]) => ({ name, count, color: colorFor(name) }))
      .sort((a, b) => b.count - a.count);
  }, [projeler, tagDefinitions]);

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
        <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto">
          {rows.map(({ name, count, color }) => {
            // Bar width scaled to the biggest bucket so the heaviest
            // tag fills the row and the rest are relative to it.
            const pct = max > 0 ? Math.round((count / max) * 100) : 0;
            const label = `${count} ${t("dashboard.project").toLowerCase()}`;
            return (
              <div key={name} className="flex items-center gap-3">
                {/* Left: tag pill (name + dot) */}
                <div className="flex items-center gap-1.5 shrink-0 min-w-[110px]">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[12px] font-medium text-tyro-text-primary truncate">
                    {name}
                  </span>
                </div>
                {/* Bar with the count label painted inside the filled
                    portion. Narrow bars fall back to placing the label
                    just after the fill so it never gets clipped. */}
                <div
                  className="flex-1 h-6 rounded-lg overflow-hidden relative"
                  style={{ backgroundColor: `${color}14` }}
                >
                  <div
                    className="h-full rounded-lg transition-all flex items-center justify-center"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  >
                    {pct >= 25 && (
                      <span className="text-[11px] font-bold text-white/95 tabular-nums drop-shadow-sm px-1 truncate">
                        {label}
                      </span>
                    )}
                  </div>
                  {pct < 25 && (
                    <span
                      className="absolute inset-y-0 flex items-center text-[11px] font-bold tabular-nums"
                      style={{ left: `calc(${pct}% + 8px)`, color }}
                    >
                      {label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
