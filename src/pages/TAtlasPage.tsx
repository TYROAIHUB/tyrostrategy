import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";
import { Settings2, Crosshair } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import SlidingPanel from "@/components/shared/SlidingPanel";
import ProjeDetail from "@/components/projeler/ProjeDetail";
import { useDataStore } from "@/stores/dataStore";
import { useDbRefresh } from "@/hooks/useDbRefresh";
import { usePermissions } from "@/hooks/usePermissions";
import TAtlasMap from "@/components/tatlas/TAtlasMap";
import TAtlasFilters from "@/components/tatlas/TAtlasFilters";
import TAtlasSummary from "@/components/tatlas/TAtlasSummary";
import {
  selectInvestmentProjects,
  applyAtlasFilters,
  resolveAtlasPoints,
  computePortfolioMetrics,
  computeBreakdowns,
  computeFilterOptions,
  buildLocationMap,
  EMPTY_ATLAS_FILTERS,
  type AtlasFilters,
} from "@/lib/investmentPortfolio";
import type { Proje } from "@/types";

/**
 * T-Atlas — yatırım portföyünün coğrafi ve metrik görünümü.
 *
 * SALT GÖRÜNTÜLEME sayfası: kendi veri setini tutmaz, hiçbir kayıt oluşturup
 * güncellemez. İhtiyaç duyduğu her şeyi mevcut proje kaydından okur, dolayısıyla
 * bir projenin statüsü / lideri / CAPEX'i Projeler ekranından güncellendiğinde
 * harita da kendiliğinden güncel olur.
 *
 * Türetme zinciri (tek kaynak — harita ile özet asla ayrışmaz):
 *   projeler → yatırım portföyü → filtreler → koordinat çözümleme
 *            → 6 kart + kırılım panelleri  /  konumu bekleyenler
 */
export default function TAtlasPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Sayfaya her girişte DB'den tazele — kullanıcı localStorage snapshot'ı
  // değil o an veritabanında olanı görsün (diğer liste sayfalarıyla aynı).
  useDbRefresh();

  const projeler = useDataStore((s) => s.projeler);
  const locations = useDataStore((s) => s.locations);
  const { filterProjeler } = usePermissions();

  const [filters, setFilters] = useState<AtlasFilters>(EMPTY_ATLAS_FILTERS);
  // Detay sağ panelde açılır — harita ve filtreler ekranda kalır
  const [detailProje, setDetailProje] = useState<Proje | null>(null);
  const [detailTitle, setDetailTitle] = useState("");

  const locationById = useMemo(() => buildLocationMap(locations), [locations]);

  // Yetki filtresi EN BAŞTA: viewOnlyOwn rolü kendi projelerinin dışını
  // haritada da görmemeli.
  const investmentProjects = useMemo(
    () => selectInvestmentProjects(filterProjeler(projeler)),
    [projeler, filterProjeler]
  );

  const filterOptions = useMemo(
    () => computeFilterOptions(investmentProjects, locationById),
    [investmentProjects, locationById]
  );

  const filteredProjects = useMemo(
    () => applyAtlasFilters(investmentProjects, filters, locationById),
    [investmentProjects, filters, locationById]
  );

  // Yalnızca `points` kullanılıyor: koordinatı çözülemeyen projeler
  // (resolveAtlasPoints'in `pending` dizisi) haritadan ve özet hesaplarından
  // zaten dışlanıyor; ayrı bir "konumu bekleyen projeler" kartı gösterilmiyor
  // (kullanıcı isteği — sayfa salt harita + metrik görünümü).
  const { points } = useMemo(
    () => resolveAtlasPoints(filteredProjects, locationById),
    [filteredProjects, locationById]
  );

  const metrics = useMemo(() => computePortfolioMetrics(points), [points]);
  const breakdowns = useMemo(() => computeBreakdowns(points), [points]);

  /** Detay SAĞ PANELDE açılır (kullanıcı isteği).
   *
   *  Doküman §6 "yeni sekmede açılsın" diyordu; gerekçesi haritanın kapanmaması
   *  ve filtre/zoom kaybının önlenmesiydi. Sağ panel aynı gerekçeyi daha iyi
   *  karşılıyor: sayfa hiç terk edilmiyor, panel kapanınca kullanıcı bıraktığı
   *  görünümde kalıyor — ve sekme kalabalığı olmuyor.
   *  Projeler sayfasındaki detay paneliyle aynı bileşen ve aynı genişlik. */
  const openProje = useCallback(
    (proje: Proje) => {
      setDetailProje(proje);
      setDetailTitle(t("detail.objectiveDetail"));
    },
    [t]
  );

  const closeDetail = useCallback(() => setDetailProje(null), []);

  // Hiç yatırım projesi yok → sayfayı boş kartlarla doldurmak yerine ne
  // yapılması gerektiğini söyle.
  if (investmentProjects.length === 0) {
    return (
      <div>
        <PageHeader title={t("pages.tatlas.title")} subtitle={t("pages.tatlas.subtitle")} />
        <div className="glass-card rounded-card px-4 py-10">
          <EmptyState
            title={t("tatlas.empty.noPortfolioTitle")}
            description={t("tatlas.empty.noPortfolioDesc")}
          />
          <div className="mt-4 flex justify-center">
            <Button
              size="sm"
              variant="flat"
              startContent={<Settings2 size={14} />}
              onPress={() => navigate("/projeler")}
              className="font-semibold"
            >
              {t("tatlas.empty.goToProjects")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("pages.tatlas.title")} subtitle={t("pages.tatlas.subtitle")} />

      {/* B — Filtre satırı: hem haritayı hem özeti aynı anda etkiler */}
      <TAtlasFilters
        filters={filters}
        options={filterOptions}
        onChange={setFilters}
        resultCount={points.length}
      />

      {/* C — Harita: tam genişlik, sabit yükseklik */}
      <TAtlasMap points={points} onOpenProje={openProje} />

      {/* Lokasyon hiç tanımlanmamışsa kullanıcıyı Ayarlar'a yönlendir */}
      {locations.length === 0 && (
        <div className="glass-card rounded-card flex flex-wrap items-center gap-3 px-3.5 py-3">
          <p className="min-w-0 flex-1 text-[12px] text-tyro-text-secondary">
            {t("tatlas.empty.noLocationsDefined")}
          </p>
          <Button
            size="sm"
            variant="flat"
            startContent={<Settings2 size={14} />}
            onPress={() => navigate("/ayarlar")}
            className="shrink-0 font-semibold"
          >
            {t("tatlas.empty.goToSettings")}
          </Button>
        </div>
      )}

      {/* D — Portföy özeti: haritadan ayrılmadan görülebilecek şekilde altında */}
      <TAtlasSummary metrics={metrics} breakdowns={breakdowns} />


      {/* Proje detayı — sağdan açılan panel (Projeler sayfasıyla aynı desen) */}
      <SlidingPanel
        isOpen={detailProje !== null}
        onClose={closeDetail}
        title={detailTitle}
        icon={<Crosshair size={18} />}
        maxWidth={640}
        hideHeader
      >
        {detailProje && (
          <ProjeDetail
            proje={detailProje}
            onEdit={() => undefined}
            onClose={closeDetail}
            onModeChange={(m) => {
              if (m === "editing") setDetailTitle(t("detail.editObjective"));
              else if (m === "addAksiyon") setDetailTitle(t("detail.addAction"));
              else if (m === "aksiyonDetail") setDetailTitle(t("detail.actionDetail"));
              else setDetailTitle(t("detail.objectiveDetail"));
            }}
          />
        )}
      </SlidingPanel>
    </div>
  );
}
