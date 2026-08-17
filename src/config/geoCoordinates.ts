/**
 * Şehir / ülke → koordinat sözlüğü (T-Atlas haritası).
 *
 * NEDEN VAR: `locations` tablosu ülke + şehir tutuyor, enlem/boylam TUTMUYOR
 * ve yeni DB alanı eklemiyoruz. Harita pin'ini yerleştirmek için koordinat
 * uygulama içinde çözülüyor. Aynı desen tyrotrader'ın countryCoordinates.ts
 * dosyasında da kullanılıyor.
 *
 * ÇÖZÜMLEME SIRASI:
 *   1) "ülke|şehir" tam eşleşmesi  → şehir koordinatı (en hassas)
 *   2) sadece şehir adı eşleşmesi   → şehir koordinatı (ülke yazımı farklıysa)
 *   3) ülke eşleşmesi               → ülke merkezi / başkent (kaba pin)
 *   4) hiçbiri                      → null (proje haritada gösterilmez,
 *                                     "konumu bekleyen projeler"e düşer)
 *
 * Eşleme diakritik ve büyük/küçük harf duyarsız: "İstanbul", "Istanbul",
 * "ISTANBUL" aynı anahtara iner. Yeni bir şehir eklemek için CITY_RECORDS'a
 * satır eklemek yeterli — DB değişikliği gerekmez.
 */

export interface GeoPoint {
  lat: number;
  lon: number;
  /** Kaba mı hassas mı — UI "ülke merkezi" pinini ayırt edebilsin */
  precision: "city" | "country";
}

interface CityRecord {
  country: string;
  city: string;
  lat: number;
  lon: number;
  /** Şehir için alternatif yazımlar (İngilizce ad, eski ad, liman adı) */
  aliases?: string[];
}

interface CountryRecord {
  name: string;
  lat: number;
  lon: number;
  /** TR/EN/ISO alternatif yazımlar */
  aliases?: string[];
}

/**
 * Türkçe karakterleri sadeleştirip alfanümerik dışını atar.
 * "İstanbul" → "istanbul", "Umm Qasr" → "ummqasr".
 * (tyrotrader'daki normalisePortKey ile aynı mantık.)
 */
export function normalizeGeoKey(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .replace(/i̇/g, "i")
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[öÖ]/g, "o")
    .replace(/[üÜ]/g, "u")
    .replace(/[çÇ]/g, "c")
    .replace(/[áàâãä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[íìîï]/g, "i")
    .replace(/[óòôõ]/g, "o")
    .replace(/[úùû]/g, "u")
    .replace(/[ñ]/g, "n")
    .replace(/[^a-z0-9]/g, "");
}

// ── Şehirler ────────────────────────────────────────────────────────────
// Tiryaki'nin fiilen tesis/liman/ofis bulundurduğu ya da portföyde geçen
// noktalar önce; sonra Türkiye'nin büyük şehirleri genel kullanım için.
const CITY_RECORDS: CityRecord[] = [
  // ── Türkiye — portföyde geçen noktalar ──
  { country: "Türkiye", city: "İstanbul", lat: 41.0082, lon: 28.9784, aliases: ["istanbul", "harem", "kadikoy"] },
  { country: "Türkiye", city: "Çorum", lat: 40.5506, lon: 34.9556, aliases: ["corum", "sunrise corum"] },
  { country: "Türkiye", city: "Giresun", lat: 40.9128, lon: 38.3895, aliases: ["giresun", "giresunport"] },
  { country: "Türkiye", city: "Bandırma", lat: 40.3521, lon: 27.9769, aliases: ["bandirma"] },
  { country: "Türkiye", city: "Muş", lat: 38.7432, lon: 41.4910, aliases: ["mus"] },
  { country: "Türkiye", city: "Mersin", lat: 36.8121, lon: 34.6415 },
  { country: "Türkiye", city: "İskenderun", lat: 36.5875, lon: 36.1731, aliases: ["iskenderun"] },
  { country: "Türkiye", city: "Derince", lat: 40.7570, lon: 29.8306 },
  { country: "Türkiye", city: "Gebze", lat: 40.8028, lon: 29.4307 },
  { country: "Türkiye", city: "Karasu", lat: 41.0997, lon: 30.6892 },
  { country: "Türkiye", city: "Aliağa", lat: 38.7997, lon: 26.9714, aliases: ["aliaga"] },
  { country: "Türkiye", city: "Samsun", lat: 41.2867, lon: 36.3300 },
  { country: "Türkiye", city: "Trabzon", lat: 41.0027, lon: 39.7168 },
  { country: "Türkiye", city: "Ordu", lat: 40.9839, lon: 37.8764 },
  // ── Türkiye — büyük şehirler ──
  { country: "Türkiye", city: "Ankara", lat: 39.9334, lon: 32.8597 },
  { country: "Türkiye", city: "İzmir", lat: 38.4237, lon: 27.1428, aliases: ["izmir"] },
  { country: "Türkiye", city: "Bursa", lat: 40.1826, lon: 29.0665 },
  { country: "Türkiye", city: "Adana", lat: 37.0000, lon: 35.3213 },
  { country: "Türkiye", city: "Konya", lat: 37.8746, lon: 32.4932 },
  { country: "Türkiye", city: "Gaziantep", lat: 37.0662, lon: 37.3833 },
  { country: "Türkiye", city: "Kayseri", lat: 38.7312, lon: 35.4787 },
  { country: "Türkiye", city: "Balıkesir", lat: 39.6484, lon: 27.8826, aliases: ["balikesir"] },
  { country: "Türkiye", city: "Tekirdağ", lat: 40.9833, lon: 27.5167, aliases: ["tekirdag"] },
  { country: "Türkiye", city: "Şanlıurfa", lat: 37.1591, lon: 38.7969, aliases: ["sanliurfa", "urfa"] },
  { country: "Türkiye", city: "Diyarbakır", lat: 37.9144, lon: 40.2306, aliases: ["diyarbakir"] },
  { country: "Türkiye", city: "Malatya", lat: 38.3552, lon: 38.3095 },
  { country: "Türkiye", city: "Antalya", lat: 36.8969, lon: 30.7133 },
  { country: "Türkiye", city: "Kocaeli", lat: 40.8533, lon: 29.8815, aliases: ["izmit"] },

  // ── Irak ──
  { country: "Irak", city: "Basra", lat: 30.5085, lon: 47.7804, aliases: ["basra", "basrah", "al basrah"] },
  { country: "Irak", city: "Umm Qasr", lat: 30.0350, lon: 47.9297, aliases: ["ummqasr", "umm kasr"] },
  { country: "Irak", city: "Bağdat", lat: 33.3152, lon: 44.3661, aliases: ["bagdat", "baghdad"] },
  { country: "Irak", city: "Erbil", lat: 36.1911, lon: 44.0092, aliases: ["erbil", "hewler"] },

  // ── Kazakistan ──
  { country: "Kazakistan", city: "Almatı", lat: 43.2220, lon: 76.8512, aliases: ["almati", "almaty", "alma ata"] },
  { country: "Kazakistan", city: "Astana", lat: 51.1694, lon: 71.4491, aliases: ["astana", "nur sultan", "nursultan"] },
  { country: "Kazakistan", city: "Şımkent", lat: 42.3417, lon: 69.5901, aliases: ["simkent", "shymkent"] },

  // ── Venezuela ──
  { country: "Venezuela", city: "Caracas", lat: 10.4806, lon: -66.9036 },
  { country: "Venezuela", city: "Puerto Cabello", lat: 10.4731, lon: -68.0125, aliases: ["puertocabello"] },
  { country: "Venezuela", city: "Maracaibo", lat: 10.6427, lon: -71.6125 },

  // ── ABD ──
  { country: "ABD", city: "New Orleans", lat: 29.9511, lon: -90.0715, aliases: ["neworleans", "nola", "alabo"] },
  { country: "ABD", city: "Houston", lat: 29.7604, lon: -95.3698 },

  // ── Diğer ticaret noktaları ──
  { country: "Ukrayna", city: "Odesa", lat: 46.4825, lon: 30.7233, aliases: ["odesa", "odessa"] },
  { country: "Rusya", city: "Novorossiysk", lat: 44.7239, lon: 37.7686, aliases: ["novorossiysk"] },
  { country: "Romanya", city: "Constanta", lat: 44.1598, lon: 28.6348, aliases: ["constanta", "köstence", "kostence"] },
  { country: "Bulgaristan", city: "Varna", lat: 43.2141, lon: 27.9147 },
  { country: "Gürcistan", city: "Poti", lat: 42.1462, lon: 41.6725 },
  { country: "Mısır", city: "İskenderiye", lat: 31.2001, lon: 29.9187, aliases: ["iskenderiye", "alexandria"] },
  { country: "Hollanda", city: "Rotterdam", lat: 51.9244, lon: 4.4777 },
  { country: "BAE", city: "Dubai", lat: 25.2048, lon: 55.2708, aliases: ["dubai", "jebel ali", "cebelali"] },
  { country: "Suudi Arabistan", city: "Cidde", lat: 21.4858, lon: 39.1925, aliases: ["cidde", "jeddah"] },
  { country: "Pakistan", city: "Karaçi", lat: 24.8607, lon: 67.0011, aliases: ["karaci", "karachi"] },
  { country: "Arjantin", city: "Rosario", lat: -32.9587, lon: -60.6930 },
  { country: "Brezilya", city: "Santos", lat: -23.9608, lon: -46.3336 },
];

// ── Ülkeler (kaba fallback) ─────────────────────────────────────────────
const COUNTRY_RECORDS: CountryRecord[] = [
  { name: "Türkiye", lat: 39.93, lon: 32.85, aliases: ["turkey", "turkiye", "tur", "tr"] },
  { name: "Irak", lat: 33.32, lon: 44.37, aliases: ["iraq", "irak", "irq", "iq"] },
  { name: "Kazakistan", lat: 51.17, lon: 71.45, aliases: ["kazakhstan", "kaz", "kz"] },
  { name: "Venezuela", lat: 10.48, lon: -66.90, aliases: ["ven", "ve"] },
  { name: "ABD", lat: 38.90, lon: -77.04, aliases: ["usa", "united states", "amerika", "us", "abd"] },
  { name: "Ukrayna", lat: 50.45, lon: 30.52, aliases: ["ukraine", "ukr", "ua"] },
  { name: "Rusya", lat: 55.75, lon: 37.62, aliases: ["russia", "rus", "ru"] },
  { name: "Romanya", lat: 44.43, lon: 26.10, aliases: ["romania", "rou", "ro"] },
  { name: "Bulgaristan", lat: 42.70, lon: 23.32, aliases: ["bulgaria", "bgr", "bg"] },
  { name: "Gürcistan", lat: 41.72, lon: 44.78, aliases: ["georgia", "geo", "ge"] },
  { name: "Azerbaycan", lat: 40.41, lon: 49.87, aliases: ["azerbaijan", "aze", "az"] },
  { name: "Mısır", lat: 30.04, lon: 31.24, aliases: ["egypt", "egy", "eg", "misir"] },
  { name: "Hollanda", lat: 52.37, lon: 4.90, aliases: ["netherlands", "nld", "nl", "holland"] },
  { name: "Almanya", lat: 52.52, lon: 13.40, aliases: ["germany", "deu", "de"] },
  { name: "İspanya", lat: 40.42, lon: -3.70, aliases: ["spain", "esp", "es", "ispanya"] },
  { name: "İtalya", lat: 41.90, lon: 12.50, aliases: ["italy", "ita", "it", "italya"] },
  { name: "Fransa", lat: 48.86, lon: 2.35, aliases: ["france", "fra", "fr"] },
  { name: "BAE", lat: 24.45, lon: 54.38, aliases: ["uae", "united arab emirates", "are", "ae"] },
  { name: "Suudi Arabistan", lat: 24.71, lon: 46.68, aliases: ["saudi arabia", "sau", "sa"] },
  { name: "Katar", lat: 25.29, lon: 51.53, aliases: ["qatar", "qat", "qa"] },
  { name: "Pakistan", lat: 33.69, lon: 73.05, aliases: ["pak", "pk"] },
  { name: "Hindistan", lat: 28.61, lon: 77.21, aliases: ["india", "ind", "in"] },
  { name: "Çin", lat: 39.90, lon: 116.41, aliases: ["china", "chn", "cn", "cin"] },
  { name: "Endonezya", lat: -6.21, lon: 106.85, aliases: ["indonesia", "idn", "id"] },
  { name: "Vietnam", lat: 21.03, lon: 105.85, aliases: ["vnm", "vn"] },
  { name: "Arjantin", lat: -34.60, lon: -58.38, aliases: ["argentina", "arg", "ar"] },
  { name: "Brezilya", lat: -15.79, lon: -47.88, aliases: ["brazil", "bra", "br"] },
  { name: "Uruguay", lat: -34.90, lon: -56.19, aliases: ["ury", "uy"] },
  { name: "Nijerya", lat: 9.06, lon: 7.49, aliases: ["nigeria", "nga", "ng"] },
  { name: "Kenya", lat: -1.29, lon: 36.82, aliases: ["ken", "ke"] },
  { name: "Güney Afrika", lat: -25.75, lon: 28.19, aliases: ["south africa", "zaf", "za"] },
  { name: "Fas", lat: 34.02, lon: -6.84, aliases: ["morocco", "mar", "ma"] },
  { name: "Tunus", lat: 36.81, lon: 10.18, aliases: ["tunisia", "tun", "tn"] },
  { name: "Cezayir", lat: 36.75, lon: 3.06, aliases: ["algeria", "dza", "dz"] },
  { name: "Libya", lat: 32.89, lon: 13.19, aliases: ["lby", "ly"] },
  { name: "Lübnan", lat: 33.89, lon: 35.50, aliases: ["lebanon", "lbn", "lb", "lubnan"] },
  { name: "Ürdün", lat: 31.95, lon: 35.93, aliases: ["jordan", "jor", "jo", "urdun"] },
  { name: "İsrail", lat: 31.77, lon: 35.21, aliases: ["israel", "isr", "il", "israil"] },
  { name: "Yunanistan", lat: 37.98, lon: 23.73, aliases: ["greece", "grc", "gr"] },
  { name: "Özbekistan", lat: 41.30, lon: 69.24, aliases: ["uzbekistan", "uzb", "uz", "ozbekistan"] },
  { name: "Türkmenistan", lat: 37.96, lon: 58.33, aliases: ["turkmenistan", "tkm", "tm"] },
  { name: "İngiltere", lat: 51.51, lon: -0.13, aliases: ["uk", "united kingdom", "gbr", "gb", "ingiltere"] },
  { name: "Polonya", lat: 52.23, lon: 21.01, aliases: ["poland", "pol", "pl"] },
  { name: "İran", lat: 35.69, lon: 51.39, aliases: ["iran", "irn", "ir"] },
];

// ── Lookup tabloları (modül yüklenirken bir kez kurulur) ────────────────

const cityByCountryCity = new Map<string, GeoPoint>();
const cityByName = new Map<string, GeoPoint>();
const countryByName = new Map<string, GeoPoint>();

for (const r of CITY_RECORDS) {
  const point: GeoPoint = { lat: r.lat, lon: r.lon, precision: "city" };
  const ck = normalizeGeoKey(r.country);
  const names = [r.city, ...(r.aliases ?? [])];
  for (const n of names) {
    const nk = normalizeGeoKey(n);
    if (!nk) continue;
    cityByCountryCity.set(`${ck}|${nk}`, point);
    // Şehir adı tek başına da aranabilsin — ama ilk kayıt kazanır, sonraki
    // ülkelerdeki aynı isimli şehir üzerine yazmasın.
    if (!cityByName.has(nk)) cityByName.set(nk, point);
  }
}

for (const r of COUNTRY_RECORDS) {
  const point: GeoPoint = { lat: r.lat, lon: r.lon, precision: "country" };
  for (const n of [r.name, ...(r.aliases ?? [])]) {
    const nk = normalizeGeoKey(n);
    if (nk) countryByName.set(nk, point);
  }
}

/**
 * Ülke + şehir → koordinat. Bulunamazsa null (çağıran taraf projeyi
 * haritadan çıkarıp "konumu bekleyen projeler"e koyar).
 */
export function resolveCoordinates(
  country: string | undefined | null,
  city: string | undefined | null
): GeoPoint | null {
  const ck = normalizeGeoKey(country);
  const nk = normalizeGeoKey(city);

  if (ck && nk) {
    const exact = cityByCountryCity.get(`${ck}|${nk}`);
    if (exact) return exact;
  }
  if (nk) {
    const byCity = cityByName.get(nk);
    if (byCity) return byCity;
  }
  if (ck) {
    const byCountry = countryByName.get(ck);
    if (byCountry) return byCountry;
  }
  return null;
}

/** Bir ülkenin sözlükte tanımlı olup olmadığını söyler (UI uyarısı için). */
export function isKnownCountry(country: string | undefined | null): boolean {
  return countryByName.has(normalizeGeoKey(country));
}

/** Test / teşhis amaçlı — sözlük boyutları. */
export const GEO_DICTIONARY_SIZE = {
  cities: CITY_RECORDS.length,
  countries: COUNTRY_RECORDS.length,
};
