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
 * Yer kısıtı gerçek: altı varlık sınıfı adı tam hâliyle bir satıra sığmıyor
 * ("Yardımcı Tesisler, HSE ve Teknik Sistemler"). Bu yüzden:
 *   • varlık sınıfı → ikon + KISA KOD (PROC, PORT…), tooltip'te tam ad
 *   • statü → pin çerçevesini taklit eden halka + etiket (etiketler kısa,
 *     tam hâliyle sığıyor)
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
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {/* ── İkon = varlık sınıfı ── */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[11px] font-semibold text-tyro-text-muted">
          {t("common.assetClass")}
        </span>
        {ASSET_CLASS_CODES.map((code) => {
          const Icon = ASSET_CLASS_ICON[code];
          return (
            <Tooltip key={code} content={assetClassLabel(code, t)} size="sm" closeDelay={0}>
              <span className="inline-flex cursor-default items-center gap-1 rounded bg-tyro-bg px-1.5 py-0.5">
                <Icon size={11} strokeWidth={2.2} className="text-tyro-text-secondary" />
                <span className="text-[10px] font-bold tabular-nums text-tyro-text-secondary">
                  {code.replace("AST-", "")}
                </span>
              </span>
            </Tooltip>
          );
        })}
      </div>

      <span aria-hidden className="hidden h-4 w-px rounded-full bg-tyro-border/50 sm:block" />

      {/* ── Çerçeve rengi = statü ── */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="text-[11px] font-semibold text-tyro-text-muted">
          {t("common.status")}
        </span>
        {LEGEND_STATUSES.map((status) => (
          <span key={status} className="inline-flex items-center gap-1">
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
  );
}
