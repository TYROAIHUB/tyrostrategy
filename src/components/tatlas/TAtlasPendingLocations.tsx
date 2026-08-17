import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, MapPinOff, ArrowUpRight } from "lucide-react";
import { statusColor } from "@/lib/colorUtils";
import { getStatusLabel } from "@/lib/constants";
import { assetClassLabel } from "@/config/projectTaxonomy";
import { assetClassIcon } from "@/config/assetClassIcons";
import { resolveLocationLabel } from "@/lib/locations";
import type { LocationDefinition, Proje } from "@/types";

/**
 * "Konumu bekleyen projeler" (doküman §3).
 *
 * Koordinatı çözülemeyen projeler haritada gösterilmiyor ve hiçbir özet
 * hesabına girmiyor — ama sessizce kaybolmamaları gerekiyor. Bu liste onları
 * görünür kılıyor ve İKİ farklı eksik durumu ayırıyor:
 *
 *   • Lokasyon hiç girilmemiş        → proje formundan seçilmeli
 *   • Lokasyon var, koordinat yok    → şehir koordinat sözlüğünde tanımlı
 *                                      değil (geoCoordinates.ts'e eklenmeli)
 *
 * İkinci durum bir geliştirme işi, birinci veri girişi — kullanıcı hangisi
 * olduğunu bilmeden aksiyon alamaz.
 */
interface Props {
  pending: Proje[];
  locations: LocationDefinition[];
  onOpenProje: (proje: Proje) => void;
}

const PREVIEW_COUNT = 6;

export default function TAtlasPendingLocations({ pending, locations, onOpenProje }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const { noLocation, unknownCoords } = useMemo(() => {
    const a: Proje[] = [];
    const b: Proje[] = [];
    for (const p of pending) {
      if (p.locationId) b.push(p);
      else a.push(p);
    }
    return { noLocation: a, unknownCoords: b };
  }, [pending]);

  if (pending.length === 0) return null;

  const visible = showAll ? pending : pending.slice(0, PREVIEW_COUNT);

  return (
    <div className="glass-card rounded-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-3 text-left transition-colors hover:bg-tyro-bg/50"
      >
        {open ? (
          <ChevronDown size={14} className="shrink-0 text-tyro-text-muted" />
        ) : (
          <ChevronRight size={14} className="shrink-0 text-tyro-text-muted" />
        )}
        <MapPinOff size={15} className="shrink-0 text-amber-500" />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold text-tyro-text-primary">
            {t("tatlas.pending.title")}
          </span>
          <span className="block text-[11px] text-tyro-text-muted">
            {t("tatlas.pending.subtitle")}
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold tabular-nums text-amber-600">
          {pending.length}
        </span>
      </button>

      {open && (
        <div className="border-t border-tyro-border/20 px-3.5 py-3">
          {/* Neden bekliyor — iki eksik türü ayrı sayılıyor */}
          <div className="mb-3 flex flex-wrap gap-2">
            {noLocation.length > 0 && (
              <span className="rounded-full bg-tyro-bg px-2.5 py-1 text-[11px] font-semibold text-tyro-text-secondary">
                {t("tatlas.pending.noLocation", { count: noLocation.length })}
              </span>
            )}
            {unknownCoords.length > 0 && (
              <span className="rounded-full bg-tyro-bg px-2.5 py-1 text-[11px] font-semibold text-tyro-text-secondary">
                {t("tatlas.pending.unknownCoords", { count: unknownCoords.length })}
              </span>
            )}
          </div>

          <ul className="flex flex-col gap-1">
            {visible.map((proje) => {
              const Icon = assetClassIcon(proje.assetClass);
              const loc = resolveLocationLabel(proje.locationId, locations);
              return (
                <li key={proje.id}>
                  <button
                    type="button"
                    onClick={() => onOpenProje(proje)}
                    className="group flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-tyro-bg"
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2"
                      style={{
                        borderColor: statusColor(proje.status),
                        color: statusColor(proje.status),
                      }}
                    >
                      <Icon size={12} strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold text-tyro-text-primary">
                        {proje.name}
                      </span>
                      <span className="block truncate text-[11px] text-tyro-text-muted">
                        <span className="tabular-nums">{proje.id}</span>
                        {" · "}
                        {assetClassLabel(proje.assetClass, t) || "—"}
                        {" · "}
                        {getStatusLabel(proje.status, t)}
                        {loc ? ` · ${loc}` : ""}
                      </span>
                    </span>
                    <ArrowUpRight
                      size={13}
                      className="shrink-0 text-tyro-text-muted/40 transition-colors group-hover:text-tyro-navy"
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          {pending.length > PREVIEW_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mt-2 cursor-pointer text-[11px] font-semibold text-tyro-text-secondary hover:text-tyro-navy"
            >
              {showAll
                ? t("common.showLess")
                : t("tatlas.pending.showAll", { count: pending.length - PREVIEW_COUNT })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
