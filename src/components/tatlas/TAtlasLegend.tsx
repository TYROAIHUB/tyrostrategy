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
 * Düzen: TEK GRID içinde İKİ SATIR — üstte varlık sınıfı, altında durum.
 * Kolonlar `max-content` olduğu için her kolon o kolondaki en geniş hücreye
 * göre boyutlanıyor; sonuç olarak üstteki her varlık sınıfı çipi ile altındaki
 * durum öğesi DİKEYDE HİZALI. İki ayrı flex satırıyla bu mümkün değildi,
 * öğe genişlikleri farklı olduğu için kaymalar birikiyordu.
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

  // Kolon sayısı = en uzun grubun öğe sayısı. Grid'in kolon şablonu buna göre
  // kuruluyor; kısa satır (varlık sınıfı) sonundaki kolonları boş bırakıyor.
  const columnCount = Math.max(ASSET_CLASS_CODES.length, LEGEND_STATUSES.length);

  return (
    /* TEK GRID, İKİ SATIR.
       Kullanıcı isteği: varlık sınıfı ikonlarının HEPSİ alttaki durum
       ikonlarıyla aynı hizada olsun. Bunu iki ayrı flex satırıyla yapmak
       mümkün değil — öğe genişlikleri farklı olduğu için kaymalar birikiyor.
       Çözüm: iki satırı aynı grid'e koymak ve kolonları `max-content` yapmak.
       Böylece her kolon, o kolondaki EN GENİŞ hücreye göre boyutlanıyor ve
       üstteki çip ile alttaki durum öğesi aynı x'ten başlıyor. */
    <div className="min-w-0 overflow-x-auto">
      <div
        className="grid items-center gap-x-1.5 gap-y-1"
        style={{
          gridTemplateColumns: `74px repeat(${columnCount}, max-content)`,
        }}
      >
        {/* ── Satır 1: ikon = varlık sınıfı ── */}
        <span className="text-[11px] font-semibold text-tyro-text-muted">
          {t("common.assetClass")}
        </span>
        {ASSET_CLASS_CODES.map((code) => {
          const Icon = ASSET_CLASS_ICON[code];
          return (
            <Tooltip key={code} content={assetClassLabel(code, t)} size="sm" closeDelay={0}>
              <span className="inline-flex cursor-default items-center gap-1 whitespace-nowrap rounded bg-tyro-bg px-1.5 py-0.5">
                <Icon size={11} strokeWidth={2.2} className="text-tyro-text-secondary" />
                <span className="text-[11px] font-bold tabular-nums text-tyro-text-secondary">
                  {code.replace("AST-", "")}
                </span>
              </span>
            </Tooltip>
          );
        })}
        {/* Varlık sınıfı 6, durum 7 öğe — kalan kolonları boş bırak */}
        {Array.from({ length: columnCount - ASSET_CLASS_CODES.length }).map((_, i) => (
          <span key={`pad-${i}`} aria-hidden />
        ))}

        {/* Gruplar arası ayraç — tüm kolonları kat ediyor */}
        <span
          aria-hidden
          className="col-span-full h-px w-full rounded-full bg-tyro-border/40"
        />

        {/* ── Satır 2: çerçeve rengi = statü ── */}
        <span className="text-[11px] font-semibold text-tyro-text-muted">
          {t("common.status")}
        </span>
        {LEGEND_STATUSES.map((status) => (
          <span
            key={status}
            className="inline-flex items-center gap-1 whitespace-nowrap px-1.5 py-0.5"
          >
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
