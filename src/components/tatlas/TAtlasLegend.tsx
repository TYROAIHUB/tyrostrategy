import { useTranslation } from "react-i18next";
import { Button, Popover, PopoverTrigger, PopoverContent, Divider } from "@heroui/react";
import { Info, ChevronUp } from "lucide-react";
import { ASSET_CLASS_CODES, assetClassLabel } from "@/config/projectTaxonomy";
import { ASSET_CLASS_ICON } from "@/config/assetClassIcons";
import { statusColor } from "@/lib/colorUtils";
import { getStatusLabel } from "@/lib/constants";
import type { EntityStatus } from "@/types";

/**
 * Harita lejantı — sol altta, varsayılan KATLANMIŞ (doküman §5).
 *
 * Uygulamanın popover desenini kullanıyor: HeroUI `Popover` + flat `Button`
 * trigger — Ayarlar'daki renk seçici ve Projeler'deki filtre popover'larıyla
 * aynı dil. İlk sürüm elle yazılmış bir açılır kutuydu ve uygulamanın
 * görünümüne yabancı duruyordu.
 *
 * İki görsel değişkeni açıklar: ikon = varlık sınıfı, çerçeve = proje statüsü.
 * Varlık sınıfı satırlarında kod rozeti de var — kodlar raporlarda birincil
 * anahtar, kullanıcı ikon ile kodu birlikte öğrensin.
 */

/** Lejantta DB'deki 7 statünün tamamı yer alır. Doküman 5 renk tanımlıyordu,
 *  `Cancelled` ve `Not Started` karşılıksız kalıyordu; uygulamanın StatusBadge
 *  paletini kullanarak hepsini kapsıyoruz. */
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
    <Popover placement="top-start" offset={8} backdrop="transparent">
      <PopoverTrigger>
        <Button
          size="sm"
          variant="flat"
          startContent={<Info size={13} />}
          endContent={<ChevronUp size={13} />}
          className="h-8 border border-tyro-border/40 bg-tyro-surface/90 font-semibold text-tyro-text-secondary shadow-sm backdrop-blur-md"
        >
          {t("tatlas.legend.title")}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[268px] rounded-card border border-tyro-border/40 bg-tyro-surface/95 p-0 shadow-xl backdrop-blur-xl">
        {/* Başlık */}
        <div className="flex w-full items-center gap-2 px-3.5 pb-2 pt-3">
          <Info size={13} className="text-tyro-gold" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-tyro-text-secondary">
            {t("tatlas.legend.title")}
          </span>
        </div>

        <Divider className="bg-tyro-border/30" />

        {/* İkon = varlık sınıfı */}
        <div className="w-full px-3.5 py-2.5">
          <p className="mb-2 text-[11px] font-semibold text-tyro-text-muted">
            {t("tatlas.legend.iconMeaning")}
          </p>
          <ul className="flex flex-col gap-1">
            {ASSET_CLASS_CODES.map((code) => {
              const Icon = ASSET_CLASS_ICON[code];
              const label = assetClassLabel(code, t);
              return (
                <li key={code} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-tyro-bg text-tyro-text-secondary">
                    <Icon size={12} strokeWidth={2.2} />
                  </span>
                  <span className="shrink-0 rounded bg-tyro-bg px-1 py-px text-[10px] font-bold tabular-nums text-tyro-text-muted">
                    {code.replace("AST-", "")}
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate text-[11px] text-tyro-text-secondary"
                    title={label}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <Divider className="bg-tyro-border/30" />

        {/* Çerçeve rengi = statü */}
        <div className="w-full px-3.5 pb-3 pt-2.5">
          <p className="mb-2 text-[11px] font-semibold text-tyro-text-muted">
            {t("tatlas.legend.frameMeaning")}
          </p>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {LEGEND_STATUSES.map((status) => (
              <li key={status} className="flex items-center gap-1.5">
                {/* Pin çerçevesini taklit eden halka — dolu daire değil */}
                <span
                  className="h-3 w-3 shrink-0 rounded-full border-2 bg-tyro-surface"
                  style={{ borderColor: statusColor(status) }}
                />
                <span className="min-w-0 truncate text-[11px] text-tyro-text-secondary">
                  {getStatusLabel(status, t)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
