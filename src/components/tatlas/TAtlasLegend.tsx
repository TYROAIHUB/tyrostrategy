import { useTranslation } from "react-i18next";
import { Tooltip } from "@heroui/react";
import { ASSET_CLASS_CODES, assetClassLabel } from "@/config/projectTaxonomy";
import { ASSET_CLASS_ICON } from "@/config/assetClassIcons";
import { statusColor } from "@/lib/colorUtils";
import { getStatusLabel } from "@/lib/constants";
import type { EntityStatus } from "@/types";

/**
 * Harita lejantı — filtre barının İÇİNDE, satır içi.
 *
 * Önce haritanın sol altında katlanır bir popover'dı; kullanıcı değerleri
 * tıklamadan doğrudan görmek istedi, bu yüzden filtre barına (Sıfırla
 * butonunun yanına) taşındı.
 *
 * Düzen: İKİ SATIR — üstte varlık sınıfı, altında durum. Yan yana tek satırda
 * 13 öğe filtre barına sığmıyordu; dikey yerleşim hem sığıyor hem okunur.
 * Etiket kolonu sabit genişlikte, böylece iki satırın öğeleri aynı x'ten
 * başlıyor.
 *   • varlık sınıfı → ikon + KISA KOD (PROC, PORT…), tooltip'te tam ad
 *   • statü → pin çerçevesini taklit eden halka + etiket
 *
 * İki görsel değişkeni açıklıyor: ikon = varlık sınıfı, çerçeve = statü.
 */

/** DB'deki 7 statünün tamamı — doküman 5 renk tanımlıyordu, `Cancelled` ve
 *  `Not Started` karşılıksız kalıyordu; uygulamanın StatusBadge paletiyle
 *  hepsini kapsıyoruz. */
const LEGEND_STATUSES: EntityStatus[] = [
  "On Track",
  "At Risk",
  "High Risk",
  "On Hold",
  "Not Started",
  "Achieved",
  "Cancelled",
];

export default function TAtlasLegend() {
  const { t } = useTranslation();

  return (
    /* İKİ SATIR: üstte varlık sınıfı, altında durum (kullanıcı isteği).
       Etiket kolonu sabit genişlikte → iki satırın öğeleri aynı x'ten
       başlıyor. Satırlar yer yetmezse kendi içinde yatay kayıyor, filtre
       barında asla sarmıyor. */
    <div className="flex min-w-0 flex-col gap-1">
      {/* ── İkon = varlık sınıfı ── */}
      <div className="flex min-w-0 items-center gap-2">
        <span className="w-[74px] shrink-0 text-[11px] font-semibold text-tyro-text-muted">
          {t("common.assetClass")}
        </span>
        <div className="flex min-w-0 items-center gap-x-1.5 overflow-x-auto whitespace-nowrap">
          {ASSET_CLASS_CODES.map((code) => {
            const Icon = ASSET_CLASS_ICON[code];
            return (
              <Tooltip key={code} content={assetClassLabel(code, t)} size="sm" closeDelay={0}>
                <span className="inline-flex shrink-0 cursor-default items-center gap-1 rounded bg-tyro-bg px-1.5 py-0.5">
                  <Icon size={11} strokeWidth={2.2} className="text-tyro-text-secondary" />
                  <span className="text-[11px] font-bold tabular-nums text-tyro-text-secondary">
                    {code.replace("AST-", "")}
                  </span>
                </span>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Gruplar arası ayraç — dikey düzende yatay çizgi oldu */}
      <span aria-hidden className="h-px w-full rounded-full bg-tyro-border/40" />

      {/* ── Çerçeve rengi = statü ── */}
      <div className="flex min-w-0 items-center gap-2">
        <span className="w-[74px] shrink-0 text-[11px] font-semibold text-tyro-text-muted">
          {t("common.status")}
        </span>
        <div className="flex min-w-0 items-center gap-x-2.5 overflow-x-auto whitespace-nowrap">
          {LEGEND_STATUSES.map((status) => (
            <span key={status} className="inline-flex shrink-0 items-center gap-1">
              {/* Pin çerçevesini taklit eden halka — dolu daire değil */}
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full border-2 bg-tyro-surface"
                style={{ borderColor: statusColor(status) }}
              />
              <span className="text-[11px] text-tyro-text-secondary">
                {getStatusLabel(status, t)}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
