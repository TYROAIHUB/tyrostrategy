/**
 * Etkileşimli girişte popup mı, yönlendirme mi?
 *
 * Popup akışı `window.open`'ın kullanıcı tıklamasıyla AYNI karede çağrılmasını
 * şart koşuyor. Safari'de araya giren tek bir `await` bile jesti kopardığı için
 * pencere SESSİZCE engelleniyor: ekran "Microsoft pencerenizi kontrol edin"de
 * takılı kalıyor, pencere açılmıyor, hata da görünmüyor. Bizim akışta araya
 * giren `await` `acquireTokenSilent` — ve Safari'nin izleme koruması onun gizli
 * iframe'ini blokladığı için o await Safari'de neredeyse HER ZAMAN gerçekleşiyor.
 * Yani masaüstü Safari'de popup akışı yapısal olarak çalışmıyor.
 *
 * Yönlendirme akışında popup yok: MSAL'ı boot'ta `handleRedirectPromise`
 * karşılıyor (main.tsx) ve AuthGuard oturumu tamamlıyor. Mobil zaten bu yoldan
 * geçtiği için yol denenmiş.
 */

/**
 * @param ua          Tarayıcı kimliği (test edilebilirlik için parametre).
 * @param touchPoints `navigator.maxTouchPoints` — iPad'i masaüstü Mac'ten ayırır.
 *
 * Kapsam notu: iPad, iPadOS 13'ten beri Safari'de VARSAYILAN olarak "Macintosh"
 * kimliği veriyor. Eski `isMobile()` regex'i `iPad` arıyordu, dolayısıyla hem
 * masaüstü Safari'yi hem de iPad'i kaçırıp ikisini de popup akışına sokuyordu.
 */
export function prefersRedirect(
  ua: string = typeof navigator !== "undefined" ? navigator.userAgent : "",
  touchPoints: number = typeof navigator !== "undefined" ? (navigator.maxTouchPoints ?? 0) : 0,
): boolean {
  if (/Android|iPhone|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua)) return true;
  if (/iPad/i.test(ua)) return true;
  // iPadOS masaüstü kimliği: "Macintosh" + çoklu dokunma noktası
  if (/Macintosh/i.test(ua) && touchPoints > 1) return true;
  // Masaüstü Safari: WebKit ama Chrome/Edge/Firefox türevi DEĞİL
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR|SamsungBrowser/i.test(ua);
}

/**
 * MSAL'ın "pencereyi açamadım" hata kodları — bunlarda yönlendirmeye düşüyoruz.
 * `user_cancelled` BİLEREK listede yok: kullanıcı vazgeçtiyse onu zorla
 * Microsoft'a yönlendirmek istemeyiz.
 */
export const POPUP_BLOCKED_CODES: ReadonlySet<string> = new Set([
  "popup_window_error",
  "empty_window_error",
  "block_iframe_reload",
]);
