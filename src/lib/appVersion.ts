/**
 * Sürüm karşılaştırma — "yayındaki build, bu sekmede çalışandan farklı mı?"
 *
 * Çalışan sekmenin hash'i derleme zamanında gömülüyor (`__BUILD_HASH__` =
 * kısa git SHA). Yayındaki hash build çıktısındaki `version.json`'dan okunuyor
 * (bkz. vite.config.ts `emitVersionJson`). İkisi farklıysa yeni bir deploy
 * yapılmış demektir ve açık sekme eski paketi çalıştırıyordur.
 *
 * Bu modül BİLEREK saf: ağ çağrısı tek bir fonksiyonda, karar mantığı ondan
 * ayrı — karar kısmı ağa çıkmadan test edilebiliyor.
 */

declare const __BUILD_HASH__: string;

/** Bu sekmede çalışan paketin parmak izi. */
export const RUNNING_BUILD_HASH: string =
  typeof __BUILD_HASH__ === "string" ? __BUILD_HASH__ : "dev";

export interface DeployedVersion {
  hash: string;
  builtAt?: string;
}

/**
 * Yayındaki sürümü oku. Başarısızlıkta `null` döner — ağ hatası, çevrimdışılık
 * ya da henüz yayınlanmamış `version.json` yüzünden kullanıcıya YANLIŞLIKLA
 * "yeni sürüm var" dememek için sessizce pas geçiyoruz.
 */
export async function fetchDeployedVersion(signal?: AbortSignal): Promise<DeployedVersion | null> {
  try {
    // `no-store`: aradaki CDN/tarayıcı önbelleği eski hash'i döndürmesin.
    // Sorgu parametresi ek sigorta (bazı vekiller no-store'u yok sayıyor).
    const url = `${import.meta.env.BASE_URL}version.json?t=${Date.now()}`;
    const res = await fetch(url, { cache: "no-store", signal });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (typeof data === "object" && data !== null && typeof (data as DeployedVersion).hash === "string") {
      return data as DeployedVersion;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Güncelleme var mı? Saf karşılaştırma.
 *
 * `deployed` okunamadıysa (null) HAYIR deriz — belirsizlikte kullanıcıyı
 * rahatsız etmemek, kaçırmaktan iyidir; bir sonraki etkileşimde yine bakılır.
 * Geliştirme ortamında (`dev`) hiç uyarmıyoruz, hash anlamlı değil.
 */
export function isUpdateAvailable(
  running: string,
  deployed: DeployedVersion | null,
): boolean {
  if (!deployed || !deployed.hash) return false;
  if (running === "dev") return false;
  return deployed.hash !== running;
}
