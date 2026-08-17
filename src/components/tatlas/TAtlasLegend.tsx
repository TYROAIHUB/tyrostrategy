import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronUp, ChevronDown, Info } from "lucide-react";
import { ASSET_CLASS_CODES, assetClassLabel } from "@/config/projectTaxonomy";
import { ASSET_CLASS_ICON } from "@/config/assetClassIcons";
import { statusColor } from "@/lib/colorUtils";
import { getStatusLabel } from "@/lib/constants";
import type { EntityStatus } from "@/types";

/**
 * Harita lejantı — sol altta, VARSAYILAN KATLANMIŞ (doküman §5).
 *
 * Dokümanın §2 tablosu "sol üstte lejant" derken §5 metni "sol alt köşede
 * katlanmış şerit" diyor. §5 daha spesifik olduğu için onu esas aldık; ayrıca
 * sağ üst köşe zoom + tam ekran düğmelerine ayrıldığı için çakışma olmuyor.
 *
 * İki görsel değişken açıklanıyor: ikon = varlık sınıfı, çerçeve = statü.
 */

// Lejantta gösterilen statüler — DB'deki 7 statünün tamamı. Doküman 5 renk
// tanımlıyordu, `Cancelled` ve `Not Started` karşılıksız kalıyordu; uygulamanın
// StatusBadge paletini kullanarak hepsini kapsıyoruz (UI kuralı: statü
// renkleri her yerde aynı palet).
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
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-tyro-border/40 bg-tyro-surface/90 px-2.5 text-[11px] font-semibold text-tyro-text-secondary shadow-sm backdrop-blur-md transition-colors hover:bg-tyro-surface hover:text-tyro-text-primary"
      >
        <Info size={13} />
        {t("tatlas.legend.title")}
        <ChevronUp size={13} />
      </button>
    );
  }

  return (
    <div className="w-[228px] rounded-card border border-tyro-border/40 bg-tyro-surface/95 p-3 shadow-lg backdrop-blur-md">
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-expanded
        className="mb-2 flex w-full cursor-pointer items-center justify-between text-[11px] font-bold uppercase tracking-wider text-tyro-text-secondary"
      >
        {t("tatlas.legend.title")}
        <ChevronDown size={13} />
      </button>

      {/* İkon = varlık sınıfı */}
      <p className="mb-1.5 text-[11px] font-semibold text-tyro-text-muted">
        {t("tatlas.legend.iconMeaning")}
      </p>
      <ul className="mb-3 flex flex-col gap-1">
        {ASSET_CLASS_CODES.map((code) => {
          const Icon = ASSET_CLASS_ICON[code];
          return (
            <li key={code} className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-tyro-bg text-tyro-text-secondary">
                <Icon size={12} strokeWidth={2} />
              </span>
              <span className="truncate text-[11px] text-tyro-text-secondary" title={assetClassLabel(code, t)}>
                {assetClassLabel(code, t)}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Çerçeve rengi = statü */}
      <p className="mb-1.5 text-[11px] font-semibold text-tyro-text-muted">
        {t("tatlas.legend.frameMeaning")}
      </p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {LEGEND_STATUSES.map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full border-2"
              style={{ borderColor: statusColor(status) }}
            />
            <span className="text-[11px] text-tyro-text-secondary">
              {getStatusLabel(status, t)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
