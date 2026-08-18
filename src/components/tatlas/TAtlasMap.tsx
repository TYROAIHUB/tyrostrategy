import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
// `Map` olarak import etmek global Map yapıcısını gölgeliyor (groupByCoordinate
// içinde new Map() kullanıyoruz) — MapGL takma adıyla alıyoruz.
import { Map as MapGL, Marker, AttributionControl, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Plus, Minus, Crosshair, Maximize2, Minimize2, AlertTriangle } from "lucide-react";
import { Tooltip } from "@heroui/react";
import { statusColor } from "@/lib/colorUtils";
import { cartoStyleUrl, buildBasemapStyle, FALLBACK_ATTRIBUTION } from "@/config/basemapStyle";
import { assetClassIcon } from "@/config/assetClassIcons";
import type { AtlasPoint } from "@/lib/investmentPortfolio";
import type { Proje, EntityStatus } from "@/types";
import TAtlasLegend from "./TAtlasLegend";
import TAtlasPinPopup from "./TAtlasPinPopup";

/**
 * T-Atlas haritası.
 *
 * ALTLIK: birincil olarak CARTO vector style (şehirler, sınırlar, denizler,
 * etiketler — tyrofreight/tyrotrader haritalarındaki görünüm). Erişilemezse
 * gömülü Natural Earth altlığına düşer, harita boş kalmaz.
 *
 * Yedeğe geçiş kararı TEK ve KESİN bir sinyale dayanır: style.json'a gerçek
 * bir fetch atıyoruz. Başarılıysa CARTO kalır, başarısızsa yedeğe geçilir.
 *
 * Neden böyle: önceki iki sürüm MapLibre'ın `error` olaylarının mesajına
 * regex uyguluyordu. MapLibre pek çok İYİ HUYLU durum için de error yayıyor —
 * eksik bir glyph aralığı, bulunamayan tek bir sprite ikonu, iptal edilen
 * tile isteği. Mesajda "glyph"/"style" geçtiği için harita düzgün çalışırken
 * bile yedeğe düşüyordu (kullanıcı raporu: "hâlâ sade altlık diyor" —
 * kardeş uygulamada aynı altlık aynı tarayıcıda sorunsuz açılıyordu).
 * Fetch probe'u gerçek koşulu ölçer: altlığa erişebiliyor muyuz?
 *
 * Probe TEK BAŞINA yetmiyor: style.json erişilebilir olup asıl vector tile'lar
 * bloklanabiliyor (yaşandı — CARTO tile'ları tiles-a…tiles-d subdomain'lerine
 * bölünmüş, CSP'de yalnızca style host'u açıktı). O durumda probe başarılı
 * dönüyor ama harita BOŞ kalıyordu. Bu yüzden tile yükleme hatalarını da
 * sayıyoruz: eşiği aşarsa yedeğe geçiyoruz. Böylece "boş harita" durumu
 * yapısal olarak imkânsız.
 */
const TILE_ERROR_THRESHOLD = 4;
const WORLD_CENTER = { longitude: 32, latitude: 39, zoom: 2.4 };
const FIT_PADDING = 72;
const FIT_MAX_ZOOM = 6.5;
const ZOOM_STEP_MS = 250;

/** Aynı koordinattaki projeler tek pin altında toplanır.
 *  Lokasyonlar şehir düzeyinde olduğu için aynı şehirdeki projeler birebir
 *  aynı koordinata düşer — kümeleme ihtiyacının gerçek kaynağı bu. */
interface PinGroup {
  key: string;
  lat: number;
  lon: number;
  points: AtlasPoint[];
  /** Kaba (ülke merkezi) koordinat mı — popup'ta belirtiyoruz */
  approximate: boolean;
}

function groupByCoordinate(points: AtlasPoint[]): PinGroup[] {
  const map = new Map<string, PinGroup>();
  for (const p of points) {
    const key = `${p.geo.lat.toFixed(4)},${p.geo.lon.toFixed(4)}`;
    const existing = map.get(key);
    if (existing) {
      existing.points.push(p);
      if (p.geo.precision === "country") existing.approximate = true;
    } else {
      map.set(key, {
        key,
        lat: p.geo.lat,
        lon: p.geo.lon,
        points: [p],
        approximate: p.geo.precision === "country",
      });
    }
  }
  return Array.from(map.values());
}

/** Bir gruptaki en kritik statü pin çerçevesini boyar — bir kümede riskli
 *  proje varsa kullanıcı zoom yapmadan görmeli. */
const STATUS_SEVERITY: Record<EntityStatus, number> = {
  "High Risk": 5,
  "At Risk": 4,
  "On Hold": 3,
  "Not Started": 2,
  "On Track": 1,
  "Achieved": 0,
  "Cancelled": 0,
};

function dominantStatus(points: AtlasPoint[]): EntityStatus {
  let best: EntityStatus = points[0]?.proje.status ?? "Not Started";
  let bestScore = STATUS_SEVERITY[best] ?? 0;
  for (const p of points) {
    const score = STATUS_SEVERITY[p.proje.status] ?? 0;
    if (score > bestScore) {
      best = p.proje.status;
      bestScore = score;
    }
  }
  return best;
}

interface Props {
  points: AtlasPoint[];
  /** Detay linki — yeni sekmede açılır (doküman §6) */
  onOpenProje: (proje: Proje) => void;
}

export default function TAtlasMap({ points, onOpenProje }: Props) {
  const { t } = useTranslation();
  const mapRef = useRef<MapRef | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  /** Art arda gelen tile yükleme hatası sayısı — eşiği aşınca yedeğe geçilir */
  const tileErrorCount = useRef(0);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PinGroup | null>(null);

  const groups = useMemo(() => groupByCoordinate(points), [points]);

  // Altlık: CARTO birincil, gömülü Natural Earth yedek.
  const [useOfflineBasemap, setUseOfflineBasemap] = useState(false);
  // Harita hiç ayağa kalkmazsa (WebGL yok, worker bloklandı vb.) sessiz boş
  // kutu bırakmayalım — kullanıcıya söyleyelim.
  const [mapError, setMapError] = useState<string | null>(null);

  // Altlık her zaman AÇIK tema — sidebar teması koyu/renkli olsa da harita
  // beyaz kalır (kullanıcı isteği). Ayrıntı: config/basemapStyle.ts
  const mapStyle = useMemo(
    () => (useOfflineBasemap ? buildBasemapStyle() : cartoStyleUrl()),
    [useOfflineBasemap]
  );

  // Uzak altlığa gerçekten erişilebiliyor mu? Tek karar noktası bu.
  // CSP bloğu / proxy / DNS / servis kesintisi → fetch reject veya !ok.
  // İyi huylu MapLibre hataları buraya hiç dokunmuyor.
  useEffect(() => {
    let cancelled = false;
    const url = cartoStyleUrl();
    fetch(url, { cache: "force-cache" })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          console.warn(`[T-Atlas] altlık stili ${res.status} döndü, yedeğe geçiliyor`);
          setUseOfflineBasemap(true);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("[T-Atlas] altlık stiline erişilemedi, yedeğe geçiliyor:", err);
        setUseOfflineBasemap(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Açılış görünümü: koordinatı olan tüm projeleri kapsa (doküman §5) ──
  const fitToPoints = useCallback(() => {
    const map = mapRef.current;
    if (!map || groups.length === 0) return;
    if (groups.length === 1) {
      map.easeTo({ center: [groups[0].lon, groups[0].lat], zoom: 5, duration: 400 });
      return;
    }
    let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
    for (const g of groups) {
      minLon = Math.min(minLon, g.lon); maxLon = Math.max(maxLon, g.lon);
      minLat = Math.min(minLat, g.lat); maxLat = Math.max(maxLat, g.lat);
    }
    map.fitBounds([[minLon, minLat], [maxLon, maxLat]], {
      padding: FIT_PADDING,
      maxZoom: FIT_MAX_ZOOM,
      duration: 500,
    });
  }, [groups]);

  // Filtre değişince görünümü yeniden çerçevele — kullanıcı seçtiği kümeyi
  // ekranda arayıp bulmak zorunda kalmasın.
  useEffect(() => {
    const id = window.setTimeout(fitToPoints, 60);
    return () => window.clearTimeout(id);
  }, [fitToPoints]);

  // Seçili grup filtre sonrası kümede yoksa popup'ı kapat
  useEffect(() => {
    if (!selectedGroup) return;
    if (!groups.some((g) => g.key === selectedGroup.key)) setSelectedGroup(null);
  }, [groups, selectedGroup]);

  // ── Tam ekran (doküman §5: sunum kullanımı için) ──
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      // Tarayıcı reddedebilir (izin / iframe) — sessiz kalmayalım
      el.requestFullscreen?.().catch(() => setIsFullscreen(false));
    }
  }, []);

  /**
   * Harita künyesini KAPALI başlat.
   *
   * MapLibre `compact` attribution'ı kurulumda `maplibregl-compact-show`
   * sınıfını ekliyor, yani künye metni açık geliyor ve kullanıcı ⓘ'ya basıp
   * kapatmak zorunda kalıyor. Sınıfı kaldırmak metni gizliyor; ⓘ butonunun
   * kendi toggle mantığı bu sınıfın varlığına baktığı için buton normal
   * çalışmaya devam ediyor (kaldırılmışsa geri ekliyor).
   *
   * Sadece BU haritanın kabı içinde arıyoruz — sayfadaki başka bir MapLibre
   * örneğine dokunmuyoruz.
   */
  const collapseAttribution = useCallback(() => {
    containerRef.current
      ?.querySelectorAll(".maplibregl-ctrl-attrib.maplibregl-compact-show")
      .forEach((el) => el.classList.remove("maplibregl-compact-show"));
  }, []);

  // Tam ekrana girip çıkınca canvas boyutu değişiyor; MapLibre'ın yeniden
  // ölçmesi gerekiyor yoksa harita kırpılmış kalıyor.
  useEffect(() => {
    const id = window.setTimeout(() => {
      mapRef.current?.resize();
      // resize, MapLibre'ın _updateCompact'ini yeniden tetikleyip künyeyi
      // açıyor — tam ekrandan çıkınca tekrar kapatıyoruz.
      collapseAttribution();
    }, 120);
    return () => window.clearTimeout(id);
  }, [isFullscreen, collapseAttribution]);

  const handleMarkerClick = useCallback((group: PinGroup) => {
    setSelectedGroup((cur) => (cur?.key === group.key ? null : group));
    mapRef.current?.easeTo({ center: [group.lon, group.lat], duration: 350 });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-card border border-tyro-border/30 bg-tyro-bg ${
        isFullscreen ? "h-screen rounded-none" : "h-[380px] sm:h-[460px] lg:h-[520px]"
      }`}
    >
      <MapGL
        ref={mapRef}
        mapStyle={mapStyle}
        initialViewState={WORLD_CENTER}
        attributionControl={false}
        dragRotate={false}
        touchPitch={false}
        maxZoom={14}
        minZoom={1.2}
        onLoad={collapseAttribution}
        onError={(e) => {
          const msg = String((e as unknown as { error?: { message?: string } })?.error?.message ?? "");

          // Haritayı tamamen çalışmaz kılan hatalar → kullanıcıya göster
          if (/webgl|context lost/i.test(msg)) {
            setMapError(msg);
            return;
          }

          // Asıl tile'lar gelmiyorsa altlık boş kalır — eşiği aşınca yedeğe
          // geç. Yalnızca vector tile isteklerini sayıyoruz; eksik sprite
          // ikonu ya da glyph aralığı gibi iyi huylu hatalar buraya girmiyor.
          if (/vectortiles|\.mvt/i.test(msg)) {
            tileErrorCount.current += 1;
            if (!useOfflineBasemap && tileErrorCount.current >= TILE_ERROR_THRESHOLD) {
              console.warn(
                `[T-Atlas] ${tileErrorCount.current} tile isteği başarısız, yedek altlığa geçiliyor`
              );
              setUseOfflineBasemap(true);
            }
            return;
          }

          console.warn("[T-Atlas] map error (yok sayıldı):", msg);
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <AttributionControl
          compact
          position="bottom-right"
          customAttribution={useOfflineBasemap ? FALLBACK_ATTRIBUTION : undefined}
        />

        {groups.map((group) => {
          const status = dominantStatus(group.points);
          const color = statusColor(status);
          const first = group.points[0];
          const Icon = assetClassIcon(
            group.points.length === 1 ? first.proje.assetClass : undefined
          );
          const isActive = selectedGroup?.key === group.key;
          const label =
            group.points.length === 1
              ? first.proje.name
              : t("tatlas.map.groupTooltip", {
                  count: group.points.length,
                  city: first.location.city,
                });

          return (
            <Marker
              key={group.key}
              longitude={group.lon}
              latitude={group.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(group);
              }}
            >
              <Tooltip content={label} size="sm" placement="top" closeDelay={0}>
                <button
                  type="button"
                  aria-label={label}
                  className="relative block cursor-pointer transition-transform duration-200 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  style={{ transform: isActive ? "scale(1.12)" : undefined }}
                >
                  {/* Pin gövdesi — çerçeve rengi statüden, ikon varlık sınıfından.
                      Boyut sabit: doküman CAPEX'e göre ölçeklemeyi açıkça yasaklıyor. */}
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full border-[2.5px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.28)] dark:bg-tyro-surface"
                    style={{ borderColor: color, color }}
                  >
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  {/* Pin ucu */}
                  <span
                    className="absolute left-1/2 top-[34px] h-2 w-2 -translate-x-1/2 rotate-45 border-b-[2.5px] border-r-[2.5px] bg-white dark:bg-tyro-surface"
                    style={{ borderColor: color }}
                  />
                  {/* Kümedeki proje sayısı rozeti */}
                  {group.points.length > 1 && (
                    <span
                      className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-bold tabular-nums text-white shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {group.points.length}
                    </span>
                  )}
                </button>
              </Tooltip>
            </Marker>
          );
        })}
      </MapGL>

      {/* ── Sağ üst: zoom + tam ekran ── */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        <MapButton
          label={t("tatlas.map.fullscreen")}
          onClick={toggleFullscreen}
          icon={isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        />
        <MapButton
          label={t("tatlas.map.zoomIn")}
          onClick={() => mapRef.current?.zoomIn({ duration: ZOOM_STEP_MS })}
          icon={<Plus size={15} />}
        />
        <MapButton
          label={t("tatlas.map.zoomOut")}
          onClick={() => mapRef.current?.zoomOut({ duration: ZOOM_STEP_MS })}
          icon={<Minus size={15} />}
        />
        <MapButton
          label={t("tatlas.map.resetView")}
          onClick={fitToPoints}
          icon={<Crosshair size={15} />}
        />
      </div>

      {/* ── Sol alt: lejant (varsayılan katlanmış — doküman §5) ── */}
      <div className="absolute bottom-3 left-3 z-10">
        <TAtlasLegend />
      </div>

      {/* ── Yedek altlık devrede: harita sade görünüyorsa nedeni belli olsun ── */}
      {useOfflineBasemap && !mapError && (
        <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tyro-surface/90 px-3 py-1 text-[11px] font-semibold text-tyro-text-muted shadow-sm backdrop-blur-md">
            <AlertTriangle size={12} />
            {t("tatlas.map.basemapFallback")}
          </span>
        </div>
      )}

      {/* ── Harita hiç çizilemediyse ── */}
      {mapError && (
        <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 shadow-sm">
            <AlertTriangle size={12} />
            {t("tatlas.map.renderFailed")}
          </span>
        </div>
      )}

      {/* ── Boş durum ── */}
      {groups.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="pointer-events-auto max-w-[280px] rounded-card bg-tyro-surface/90 px-4 py-3 text-center shadow-lg backdrop-blur-sm">
            <p className="text-[13px] font-semibold text-tyro-text-primary">
              {t("tatlas.map.emptyTitle")}
            </p>
            <p className="mt-1 text-[11px] text-tyro-text-muted">
              {t("tatlas.map.emptyDesc")}
            </p>
          </div>
        </div>
      )}

      {/* ── Pin popup kartı ── */}
      {selectedGroup && (
        <TAtlasPinPopup
          points={selectedGroup.points}
          approximate={selectedGroup.approximate}
          onClose={() => setSelectedGroup(null)}
          onOpenProje={onOpenProje}
        />
      )}
    </div>
  );
}

function MapButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Tooltip content={label} size="sm" placement="left" closeDelay={0}>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-tyro-border/40 bg-tyro-surface/90 text-tyro-text-secondary shadow-sm backdrop-blur-md transition-colors hover:bg-tyro-surface hover:text-tyro-text-primary"
      >
        {icon}
      </button>
    </Tooltip>
  );
}
