import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";
import { Sparkles, X, RefreshCw } from "lucide-react";
import { useAppUpdate } from "@/hooks/useAppUpdate";

/**
 * "Yeni sürüm hazır" şeridi.
 *
 * Neden var: uygulama tembel yüklenen sayfalardan oluşuyor ve her deploy'da
 * dosya adları değişiyor. Açık bir sekme eski paketi çalıştırmaya devam ediyor;
 * yeni bir sayfaya geçmek istediğinde artık var olmayan bir chunk'ı isteyip
 * hata ekranına düşebiliyordu. Bu şerit kullanıcıyı o hataya varmadan önce,
 * kendi zamanlamasıyla yenilemeye davet ediyor.
 *
 * Tasarım: ekranın altında yüzen tek bir kart. Üst şerit yerine kart seçildi —
 * üstü `OfflineBanner` kullanıyor ve çakışmaması gerekiyor; ayrıca alttaki kart
 * içeriği itmiyor, kullanıcı işini bölmeden devam edebiliyor.
 *
 * Kapatılabilir: kullanıcı hazır olmadan zorlanmıyor. Kapatınca bu oturumda
 * tekrar gösterilmiyor; bir sonraki yenilemede zaten yeni sürüm yüklenmiş olur.
 */
export default function UpdateBanner() {
  const { t } = useTranslation();
  const { updateAvailable, reload } = useAppUpdate();
  const [dismissed, setDismissed] = useState(false);
  const reduceMotion = useReducedMotion();

  const show = updateAvailable && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
          transition={reduceMotion ? { duration: 0.15 } : { type: "spring", stiffness: 380, damping: 30 }}
          role="status"
          aria-live="polite"
          /* Mobilde alt navigasyonun üstünde kalsın; masaüstünde kenara yakın. */
          className="fixed left-1/2 z-[95] w-[min(440px,calc(100vw-24px))] -translate-x-1/2 bottom-[88px] lg:bottom-6"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-tyro-border/60 bg-tyro-surface/95 px-3.5 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10">
            {/* Marka vurgusu — altın ton, hafif nabız. Dikkat çeker, bağırmaz. */}
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tyro-gold/12 text-tyro-gold">
              <Sparkles size={17} strokeWidth={2.2} />
              {!reduceMotion && (
                <span className="absolute inset-0 animate-ping rounded-xl bg-tyro-gold/10" aria-hidden />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-tight text-tyro-text-primary">
                {t("update.title")}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-tyro-text-muted">
                {t("update.description")}
              </p>
            </div>

            <Button
              size="sm"
              onPress={reload}
              startContent={<RefreshCw size={13} />}
              className="shrink-0 bg-tyro-navy font-semibold text-white"
            >
              {t("update.action")}
            </Button>

            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => setDismissed(true)}
              aria-label={t("update.dismiss")}
              title={t("update.dismiss")}
              className="shrink-0 text-tyro-text-muted"
            >
              <X size={15} />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
