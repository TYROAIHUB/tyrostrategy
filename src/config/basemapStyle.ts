// GeoJSON namespace tipleri için @types/geojson eklemek yerine maplibre'ın
// kendi source spec tipini kullanıyoruz — yeni bağımlılık gerekmiyor.
import type { StyleSpecification, GeoJSONSourceSpecification } from "maplibre-gl";
import worldGeoJson from "@/assets/world-110m.geojson.json";

/**
 * T-Atlas altlık haritası — TAMAMEN ÇEVRİMDIŞI, harici istek YOK.
 *
 * NEDEN: index.html'deki CSP kasıtlı olarak sıkı —
 *   connect-src 'self' + login.microsoftonline.com + *.supabase.co
 *   img-src     'self' data: blob:
 * Yani hiçbir harici tile/style host'una gidilemez. İlk denemede CARTO vector
 * style'ı `connect-src`, OSM raster tile'ları `img-src` tarafından bloklandı ve
 * harita boş kaldı (pin'ler DOM olduğu için görünüyordu, altlık yoktu).
 *
 * ÇÖZÜM: altlığı dışarıdan çekmek yerine gömülü Natural Earth 110m ülke
 * sınırlarından çiziyoruz. Böylece:
 *   • CSP'yi gevşetmeye gerek yok (güvenlik özelliği korunuyor)
 *   • kurumsal proxy / çevrimdışı ortamda da çalışır
 *   • üçüncü tarafa kullanıcı gezinme verisi sızmaz
 *   • harici servis kesintisi haritayı düşürmez
 *
 * Karşılığında sokak/şehir detayı yok — bu sayfa ülke ve şehir düzeyinde bir
 * portföy görünümü, navigasyon haritası değil; dokümanın kendi mockup'ı da
 * düz bir "harita altlık katmanı" üzerinde pin gösteriyor.
 *
 * Veri: Natural Earth (public domain), 110m ülke sınırları, koordinatlar
 * 2 ondalığa yuvarlandı (~1 km) → 167 KB ham / ~52 KB gzip.
 *
 * NOT — literal hex kullanımı: MapLibre style spesifikasyonu CSS değişkeni
 * okuyamaz, renkleri somut değer olarak ister. Uygulamada aynı durum için
 * kurulmuş desen bu (colorUtils.statusColor, MyProjectsList.SOURCE_COLORS):
 * tek yerde adlandırılmış sabitler. Paleti TYRO tonlarında tuttuk.
 */

const LIGHT = {
  /** Deniz / boşluk */
  water: "#e8eef4",
  /** Kara dolgusu */
  land: "#f7f9fb",
  /** Ülke sınırı */
  border: "#cfd9e4",
} as const;

const DARK = {
  water: "#0d1520",
  land: "#18232f",
  border: "#2b3a4a",
} as const;

/** Altlık stilini üretir. `isDark` uygulamanın aktif temasından gelir. */
export function buildBasemapStyle(isDark: boolean): StyleSpecification {
  const c = isDark ? DARK : LIGHT;

  return {
    version: 8,
    // Glyph / sprite YOK: metin katmanı çizmiyoruz, dolayısıyla harici font
    // veya ikon indirmesi de olmuyor (CSP açısından kritik).
    sources: {
      world: {
        type: "geojson",
        data: worldGeoJson as GeoJSONSourceSpecification["data"],
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": c.water },
      },
      {
        id: "land-fill",
        type: "fill",
        source: "world",
        paint: { "fill-color": c.land },
      },
      {
        id: "land-border",
        type: "line",
        source: "world",
        paint: {
          "line-color": c.border,
          // Uzaklaştıkça daha ince: dünya görünümünde sınırlar gürültü olmasın
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.4, 4, 0.8, 8, 1.2],
        },
      },
    ],
    // Veri gömülü olduğu için atıf zorunlu değil ama Natural Earth'e künye
    // vermek doğru; AttributionControl bunu okuyor.
    metadata: { "tyro:attribution": "Natural Earth" },
  };
}

/** AttributionControl'de gösterilecek künye. */
export const BASEMAP_ATTRIBUTION = "Natural Earth";
