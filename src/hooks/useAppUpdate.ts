import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { RUNNING_BUILD_HASH, fetchDeployedVersion, isUpdateAvailable } from "@/lib/appVersion";

/**
 * Yayına yeni bir sürüm çıktığında açık sekmeyi haberdar eder.
 *
 * TASARIM KARARI — periyodik yoklama YOK. Kullanıcı isteği: kontrol "bir yere
 * tıkladığında ya da sayfa geçişinde" tetiklensin. Böylece boşta duran sekme
 * ağa çıkmıyor, buna karşılık kullanıcı uygulamayı kullandığı sürece
 * güncellemeyi en geç bir sonraki etkileşimde görüyor.
 *
 * Tetikleyiciler:
 *   • sayfa geçişi (route değişimi)
 *   • sekmeye geri dönme (visibilitychange / focus)
 *   • herhangi bir tıklama
 *   • `vite:preloadError` — tembel bir chunk yüklenemediğinde Vite bunu atar.
 *     Yeni deploy'un EN KESİN işareti: eski sekme artık var olmayan bir dosya
 *     istiyor demektir. Burada ağ kontrolüne bile gerek yok.
 *
 * Yoklama {@link MIN_CHECK_INTERVAL_MS} ile kısılıyor — tıklama başına istek
 * atmıyoruz. Güncelleme bir kez bulunduktan sonra kontrol tamamen duruyor.
 */
const MIN_CHECK_INTERVAL_MS = 60_000;

export function useAppUpdate(): { updateAvailable: boolean; reload: () => void } {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const lastCheckedAt = useRef(0);
  const location = useLocation();

  const reload = useCallback(() => {
    // `reload()` bazı tarayıcılarda önbellekten servis edebiliyor; hash
    // yenilemesi yeni index.html'i garantiliyor.
    window.location.reload();
  }, []);

  useEffect(() => {
    if (updateAvailable) return; // bulunduktan sonra ağa hiç çıkma
    let cancelled = false;
    const controller = new AbortController();

    const check = async () => {
      const now = Date.now();
      if (now - lastCheckedAt.current < MIN_CHECK_INTERVAL_MS) return;
      lastCheckedAt.current = now;
      const deployed = await fetchDeployedVersion(controller.signal);
      if (!cancelled && isUpdateAvailable(RUNNING_BUILD_HASH, deployed)) {
        setUpdateAvailable(true);
      }
    };

    void check(); // route değiştiğinde (ilk mount dahil)

    const onInteraction = () => void check();
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    // Vite'ın tembel chunk yükleme hatası — ağ kontrolü beklemeden kesin sonuç.
    const onPreloadError = () => setUpdateAvailable(true);

    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("click", onInteraction, { capture: true, passive: true });
    window.addEventListener("focus", onVisible);
    window.addEventListener("vite:preloadError", onPreloadError);
    return () => {
      cancelled = true;
      controller.abort();
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("click", onInteraction, { capture: true });
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("vite:preloadError", onPreloadError);
    };
  }, [location.pathname, updateAvailable]);

  return { updateAvailable, reload };
}
