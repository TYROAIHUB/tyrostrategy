// GeoJSON namespace tipleri için @types/geojson eklemek yerine maplibre'ın
// kendi source spec tipini kullanıyoruz — yeni bağımlılık gerekmiyor.
import type { StyleSpecification, GeoJSONSourceSpecification } from "maplibre-gl";
import worldGeoJson from "@/assets/world-110m.geojson.json";

/**
 * T-Atlas altlık haritası — iki katmanlı strateji.
 *
 * BİRİNCİL: CARTO'nun ücretsiz (atıf-yeterli) vector style'ları. Şehirler,
 * ülke sınırları, denizler ve etiketler net görünür — tyrofreight / tyrotrader
 * haritalarındaki görünümün aynısı, onlar da bu altlığı kullanıyor.
 * CSP'de yalnızca iki CARTO host'u açıldı (bkz. index.html), wildcard yok.
 *
 * YEDEK: gömülü Natural Earth 110m ülke sınırları. CARTO'ya erişilemezse
 * (kurumsal proxy, TLS kesici, servis kesintisi) harita boş kalmaz — sade ama
 * çalışan bir altlığa düşer. Harici istek gerektirmez.
 *
 * Yedek verisi: Natural Earth (public domain), koordinatlar 2 ondalığa
 * yuvarlandı (~1 km) → 167 KB ham / ~52 KB gzip.
 *
 * NOT — literal hex kullanımı: MapLibre style spesifikasyonu CSS değişkeni
 * okuyamaz, renkleri somut değer olarak ister. Uygulamada aynı durum için
 * kurulmuş desen bu (colorUtils.statusColor, MyProjectsList.SOURCE_COLORS):
 * tek yerde adlandırılmış sabitler. Paleti TYRO tonlarında tuttuk.
 */

/**
 * CARTO vector style'ları. Voyager açık temada daha okunur bir tipografi ve
 * renk dengesi veriyor (tyrotrader'ın da varsayılanı); koyu temada
 * dark-matter kullanıyoruz.
 *
 * Bu iki style yalnızca şu host'lara gidiyor:
 *   basemaps.cartocdn.com        → style.json
 *   tiles.basemaps.cartocdn.com  → tile / glyph / sprite
 */
export const CARTO_STYLE_LIGHT = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
export const CARTO_STYLE_DARK = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** Aktif temaya göre birincil (uzak) altlık stili. */
export function cartoStyleUrl(isDark: boolean): string {
  return isDark ? CARTO_STYLE_DARK : CARTO_STYLE_LIGHT;
}

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

/** YEDEK altlık stili — gömülü veriden, harici istek yok. */
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

/** Yedek altlık kullanıldığında gösterilecek künye. CARTO kendi künyesini
 *  style.json içinde taşıyor, onu MapLibre otomatik basıyor. */
export const FALLBACK_ATTRIBUTION = "Natural Earth";
