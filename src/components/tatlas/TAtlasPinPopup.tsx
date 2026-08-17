import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, ArrowLeft, ArrowUpRight, MapPin, AlertTriangle } from "lucide-react";
import { statusColor } from "@/lib/colorUtils";
import { getStatusLabel } from "@/lib/constants";
import { formatDate } from "@/lib/dateUtils";
import { formatCapex } from "@/lib/money";
import { assetClassLabel, actionTypeLabel } from "@/config/projectTaxonomy";
import { assetClassIcon } from "@/config/assetClassIcons";
import { formatLocationLabel } from "@/lib/locations";
import type { AtlasPoint } from "@/lib/investmentPortfolio";
import type { Proje } from "@/types";

/**
 * Pin popup kartı (doküman §6).
 *
 * Kartın TÜM içeriği proje kaydından okunur — harita tarafında hiçbir alan
 * yeniden girilmez. Proje adı ve "detay sayfasına git" bağlantısı YENİ
 * SEKMEDE açılır: kullanıcı haritada bir kümeyi filtreleyip birkaç projeyi
 * sırayla inceliyor, aynı sekmede yönlendirme yapılsa her dönüşte filtreleri
 * ve zoom'u yeniden kurması gerekirdi.
 *
 * Bir koordinatta birden fazla proje varsa önce liste, sonra kart gösterilir.
 */
interface Props {
  points: AtlasPoint[];
  /** Koordinat ülke merkezinden türetildiyse kullanıcıya söylüyoruz */
  approximate: boolean;
  onClose: () => void;
  onOpenProje: (proje: Proje) => void;
}

export default function TAtlasPinPopup({ points, approximate, onClose, onOpenProje }: Props) {
  const { t, i18n } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(
    points.length === 1 ? points[0].proje.id : null
  );

  const active = selectedId ? points.find((p) => p.proje.id === selectedId) : undefined;
  const isList = !active;

  return (
    <div className="absolute inset-x-3 bottom-3 z-20 sm:inset-x-auto sm:right-3 sm:top-3 sm:bottom-auto sm:w-[300px]">
      <div className="max-h-[300px] overflow-hidden rounded-card border border-tyro-border/40 bg-tyro-surface/97 shadow-xl backdrop-blur-md sm:max-h-[440px]">
        {isList ? (
          <>
            {/* ── Küme listesi ── */}
            <div className="flex items-center justify-between border-b border-tyro-border/25 px-3 py-2">
              <span className="flex items-center gap-1.5 text-[12px] font-bold text-tyro-text-primary">
                <MapPin size={13} className="text-tyro-gold" />
                {formatLocationLabel(points[0].location)}
              </span>
              <CloseButton onClose={onClose} label={t("common.close")} />
            </div>
            <p className="px-3 pt-2 text-[11px] text-tyro-text-muted">
              {t("tatlas.popup.groupCount", { count: points.length })}
            </p>
            <ul className="max-h-[220px] divide-y divide-tyro-border/15 overflow-y-auto px-1 py-1 sm:max-h-[340px]">
              {points.map(({ proje }) => {
                const Icon = assetClassIcon(proje.assetClass);
                return (
                  <li key={proje.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(proje.id)}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-tyro-bg"
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2"
                        style={{ borderColor: statusColor(proje.status), color: statusColor(proje.status) }}
                      >
                        <Icon size={12} strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-semibold text-tyro-text-primary">
                          {proje.name}
                        </span>
                        <span className="block text-[11px] text-tyro-text-muted tabular-nums">
                          {proje.id} · %{proje.progress}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <>
            {/* ── Başlık şeridi: statü rengiyle aynı (doküman §6/1) ── */}
            <div className="h-1.5 w-full" style={{ backgroundColor: statusColor(active.proje.status) }} />
            <div className="flex items-start justify-between gap-2 px-3 pt-2.5">
              <div className="min-w-0">
                {/* Kategori satırı: varlık sınıfı · yatırım tipi */}
                <p className="truncate text-[11px] font-semibold text-tyro-text-muted">
                  {[
                    assetClassLabel(active.proje.assetClass, t),
                    actionTypeLabel(active.proje.actionType, t),
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
                <button
                  type="button"
                  onClick={() => onOpenProje(active.proje)}
                  className="mt-0.5 cursor-pointer text-left text-[13px] font-bold leading-snug text-tyro-text-primary hover:text-tyro-navy hover:underline"
                >
                  {active.proje.name}
                </button>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {points.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    aria-label={t("common.goBack")}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-tyro-text-muted hover:bg-tyro-bg hover:text-tyro-text-primary"
                  >
                    <ArrowLeft size={13} />
                  </button>
                )}
                <CloseButton onClose={onClose} label={t("common.close")} />
              </div>
            </div>

            {/* ── Alan listesi — tamamı proje kaydından okunur ── */}
            <dl className="mt-2 divide-y divide-tyro-border/15 border-t border-tyro-border/15">
              <Row label={t("common.location")} value={formatLocationLabel(active.location)} />
              <Row label={t("common.source")} value={active.proje.source} />
              <Row label={t("common.status")} value={getStatusLabel(active.proje.status, t)} />
              <Row label={t("common.owner")} value={active.proje.owner || "—"} />
              <Row
                label={t("common.capex")}
                value={formatCapex(active.proje.capexUsd, i18n.language) || "—"}
                numeric
              />
              <Row label={t("common.endDate")} value={formatDate(active.proje.endDate)} numeric />
            </dl>

            {/* ── İlerleme ── */}
            <div className="px-3 py-2.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium text-tyro-text-muted">
                  {t("common.progress")}
                </span>
                <span
                  className="text-[11px] font-bold tabular-nums"
                  style={{ color: statusColor(active.proje.status) }}
                >
                  %{active.proje.progress}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-tyro-bg">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${active.proje.progress}%`,
                    backgroundColor: statusColor(active.proje.status),
                  }}
                />
              </div>
            </div>

            {approximate && (
              <p className="flex items-start gap-1.5 border-t border-tyro-border/15 px-3 py-2 text-[11px] text-amber-600">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                {t("tatlas.popup.approximate")}
              </p>
            )}

            {/* ── Detay bağlantısı — yeni sekmede ── */}
            <button
              type="button"
              onClick={() => onOpenProje(active.proje)}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-tyro-border/20 px-3 py-2.5 text-[12px] font-semibold text-tyro-text-secondary transition-colors hover:bg-tyro-bg hover:text-tyro-navy"
            >
              <ArrowUpRight size={13} />
              {t("tatlas.popup.openDetail")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CloseButton({ onClose, label }: { onClose: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={label}
      className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-tyro-text-muted hover:bg-tyro-bg hover:text-tyro-text-primary"
    >
      <X size={13} />
    </button>
  );
}

function Row({ label, value, numeric }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-3 py-1.5">
      <dt className="shrink-0 text-[11px] text-tyro-text-muted">{label}</dt>
      <dd
        className={`min-w-0 truncate text-right text-[12px] font-medium text-tyro-text-primary ${
          numeric ? "tabular-nums" : ""
        }`}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
