/**
 * Yatırım Haritası'nda CAPEX gösterilsin mi?
 *
 * Kullanıcı isteği (2026-08-27): kapatıldı. Gerekçe veriye dayanıyor —
 * projelerin HİÇBİRİNDE `capex_usd` dolu değil, dolayısıyla "Toplam CAPEX
 * 0 USD" kartı ve boş CAPEX kırılımları sayfada yalnızca gürültü yapıyordu.
 *
 * Kapattığı yüzeyler:
 *   • "Toplam CAPEX" özet kartı                        → TAtlasSummary
 *   • Ülke / yatırım tipi / varlık sınıfı CAPEX panelleri → TAtlasSummary
 *   • Pin balonundaki CAPEX satırı                     → TAtlasPinPopup
 *
 * Kart ve panel ızgaraları da bu bayrağa göre kolon sayısını ayarlıyor;
 * gizlenen kart yerine boşluk kalmıyor.
 *
 * GERİ AÇMAK: yalnızca burayı `true` yapmak yeterli. Hesaplama katmanına
 * (src/lib/investmentPortfolio.ts) dokunulmadı — `totalCapex`,
 * `capexEnteredCount` ve kırılımlardaki `capex` alanları üretilmeye devam
 * ediyor, sadece gösterilmiyor. Böylece CAPEX girilmeye başlandığında tek
 * satırla eski hâline dönülür.
 *
 * Tip `boolean` olarak yazıldı (literal `false` değil): bayrak kapalıyken
 * korumalı JSX dalları "hiç çalışmaz" diye işaretlenmesin.
 */
export const SHOW_CAPEX_ON_ATLAS: boolean = false;
