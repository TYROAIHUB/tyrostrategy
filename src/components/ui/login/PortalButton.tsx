import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointerClick } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TyroLogo } from "@/components/ui/TyroLogo";
import type { IntroPhase } from "./introPhases";

/**
 * PortalButton — mobile / fallback portal button. Same visual language
 * as the scene-anchored desktop version:
 *   [Logo]  tyro  verse  │  Bağlan  [click icon]
 * Orbital rings + gold radial glow react on hover and phase p1.
 */

const SCRAMBLE_GLYPHS = "!@#$%^&*<>{}[]|~+=/\\?¢§∆¿⊗◈◊Δ╬╔╩┼";

function useScrambleText(target: string, active: boolean, duration = 800) {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (!active) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const revealed = Math.floor(progress * target.length);
      const out = target
        .split("")
        .map((c, i) => {
          if (i < revealed) return c;
          if (c === " ") return " ";
          return SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
        })
        .join("");
      setDisplay(out);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else setDisplay(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);

  return display;
}

export default function PortalButton({
  phase,
  onActivate,
  loading,
}: {
  phase: IntroPhase;
  onActivate: () => void;
  label?: string;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const connectLabel = t("login.connect");

  const isImploding =
    phase === "p3" ||
    phase === "p4" ||
    phase === "p5" ||
    phase === "p6" ||
    phase === "auth";
  const show = !isImploding;

  const [hover, setHover] = useState(false);
  const [scrambleDone, setScrambleDone] = useState(false);

  // Attention state: phase idle'da kalıp 5sn tıklanmadıysa orbital halkalar
  // ve glow %50 daha yoğun pulse atar — kullanıcının dikkatini buraya çeker.
  // hover veya intro başlayınca otomatik kapanır (effect cleanup).
  const [attention, setAttention] = useState(false);
  useEffect(() => {
    if (phase !== "idle") {
      setAttention(false);
      return;
    }
    const timer = setTimeout(() => setAttention(true), 5000);
    return () => clearTimeout(timer);
  }, [phase]);
  // Hover anında attention'ı sıfırla — kullanıcı butonu fark etti, animasyon
  // gürültüsünü azalt.
  useEffect(() => {
    if (hover) setAttention(false);
  }, [hover]);

  const tyroText = useScrambleText("tyro", show, 700);
  const verseText = useScrambleText("verse", show, 800);
  const baglanText = useScrambleText(connectLabel, show, 900);

  useEffect(() => {
    if (!show) {
      setScrambleDone(false);
      return;
    }
    const timer = setTimeout(() => setScrambleDone(true), 1000);
    return () => clearTimeout(timer);
  }, [show]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ isolation: "isolate" }}>
      {/* Ring + glow container — anchored at button center (0×0 wrapper) */}
      <div
        className="pointer-events-none absolute"
        style={{ top: "50%", left: "50%", width: 0, height: 0 }}
        aria-hidden="true"
      >
        {/* Outer radial bloom — attention'da %50 daha yoğun */}
        <div
          className="absolute rounded-full"
          style={{
            top: "-210px",
            left: "-210px",
            width: "420px",
            height: "420px",
            background: hover
              ? "radial-gradient(circle, rgba(224,173,62,0.28) 0%, rgba(200,146,42,0.14) 45%, transparent 78%)"
              : attention
                ? "radial-gradient(circle, rgba(224,173,62,0.18) 0%, rgba(200,146,42,0.08) 45%, transparent 78%)"
                : "radial-gradient(circle, rgba(224,173,62,0.10) 0%, rgba(200,146,42,0.04) 45%, transparent 78%)",
            animation: `portalRing ${attention ? "2s" : "3s"} ease-in-out infinite`,
            transition: "background 0.35s",
          }}
        />
        {/* Inner radial glow pulse */}
        <div
          className="absolute rounded-full"
          style={{
            top: "-145px",
            left: "-145px",
            width: "290px",
            height: "290px",
            background: hover
              ? "radial-gradient(circle, rgba(200,146,42,0.4) 0%, transparent 72%)"
              : attention
                ? "radial-gradient(circle, rgba(200,146,42,0.28) 0%, transparent 72%)"
                : "radial-gradient(circle, rgba(200,146,42,0.16) 0%, transparent 72%)",
            animation: `portalRing ${attention ? "2s" : "3s"} ease-in-out infinite`,
            transition: "background 0.4s",
          }}
        />

        {/* Inner orbital ring — encloses button with breathing room */}
        <motion.div
          className="absolute rounded-full"
          style={{
            top: "-150px",
            left: "-150px",
            width: "300px",
            height: "300px",
            border: `1px solid ${phase === "p1" ? "rgba(240,201,94,0.95)" : hover ? "rgba(224,173,62,0.70)" : attention ? "rgba(224,173,62,0.55)" : "rgba(200,146,42,0.35)"}`,
            boxShadow: phase === "p1"
              ? "inset 0 0 30px rgba(240,201,94,0.5), 0 0 24px rgba(240,201,94,0.55)"
              : hover ? "inset 0 0 18px rgba(200,146,42,0.26)"
              : attention ? "inset 0 0 14px rgba(200,146,42,0.20), 0 0 18px rgba(200,146,42,0.25)"
              : "none",
            transition: "border-color 0.25s, box-shadow 0.25s",
          }}
          animate={{ rotate: -360 }}
          transition={{
            duration: phase === "p1" ? 0.5 : hover ? 10 : attention ? 14 : 22,
            repeat: Infinity,
            ease: phase === "p1" ? "easeIn" : "linear",
          }}
        />

        {/* Outer orbital ring — dashed */}
        <motion.div
          className="absolute rounded-full"
          style={{
            top: "-180px",
            left: "-180px",
            width: "360px",
            height: "360px",
            border: `1.5px dashed ${phase === "p1" ? "rgba(240,201,94,1)" : hover ? "rgba(224,173,62,0.82)" : attention ? "rgba(224,173,62,0.65)" : "rgba(200,146,42,0.40)"}`,
            boxShadow: phase === "p1"
              ? "0 0 60px rgba(240,201,94,0.7)"
              : hover ? "0 0 38px rgba(200,146,42,0.4)"
              : attention ? "0 0 30px rgba(200,146,42,0.32)"
              : "none",
            transition: "border-color 0.25s, box-shadow 0.25s",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: phase === "p1" ? 0.4 : hover ? 7 : attention ? 10 : 16,
            repeat: Infinity,
            ease: phase === "p1" ? "easeIn" : "linear",
          }}
        />

        {/* Orbital dots on outer ring */}
        <motion.div
          className="absolute"
          style={{ top: "-180px", left: "-180px", width: "360px", height: "360px" }}
          animate={{ rotate: 360 }}
          transition={{
            duration: phase === "p1" ? 0.4 : hover ? 7 : 16,
            repeat: Infinity,
            ease: phase === "p1" ? "easeIn" : "linear",
          }}
        >
          {[0, 90, 180, 270].map((deg) => (
            <div
              key={deg}
              className="absolute rounded-full"
              style={{
                top: "50%",
                left: "50%",
                width: "5px",
                height: "5px",
                background: "#e0ad3e",
                boxShadow: "0 0 10px rgba(224,173,62,0.95)",
                transform: `translate(-50%, -50%) rotate(${deg}deg) translate(180px)`,
                opacity: hover ? 1 : 0.55,
                transition: "opacity 0.3s",
              }}
            />
          ))}
        </motion.div>

        {/* Dr Strange burst (phase p1) */}
        <AnimatePresence>
          {phase === "p1" && (
            <>
              <motion.div
                key="burst-1"
                className="absolute rounded-full"
                style={{
                  top: "-150px",
                  left: "-150px",
                  width: "300px",
                  height: "300px",
                  border: "2px solid rgba(240,201,94,0.9)",
                  boxShadow: "0 0 50px rgba(240,201,94,0.7), inset 0 0 35px rgba(240,201,94,0.4)",
                }}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1.8, opacity: [0, 1, 0], rotate: 180 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * 360;
                return (
                  <motion.div
                    key={`spark-${i}`}
                    className="absolute"
                    style={{
                      top: "50%",
                      left: "50%",
                      width: "3px",
                      height: "20px",
                      background:
                        "linear-gradient(180deg, rgba(255,235,180,1) 0%, rgba(240,201,94,0.8) 50%, transparent 100%)",
                      transformOrigin: "50% 0%",
                      borderRadius: "2px",
                      boxShadow: "0 0 10px rgba(240,201,94,0.9)",
                    }}
                    initial={{ opacity: 0, rotate: angle, x: -1.5, y: 0, scale: 0.3 }}
                    animate={{ opacity: [0, 1, 0], y: [0, 160, 200], scale: [0.3, 1.2, 0.6] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, delay: i * 0.025, ease: "easeOut" }}
                  />
                );
              })}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Button — cool teal-cyan gradient (chess board'un sıcak ahşap +
          altın paletinden ayrılır → dikkat çeker). Gold border marka
          bağını koruyor. Attention durumunda hafif scale-pulse animasyonu
          tıklamayı davet eder. */}
      <motion.button
        type="button"
        onClick={onActivate}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        disabled={loading || isImploding}
        whileHover={!isImploding && phase === "idle" ? { scale: 1.04, y: -1 } : undefined}
        whileTap={!isImploding ? { scale: 0.96 } : undefined}
        animate={
          isImploding
            ? { scale: 0.4, opacity: 0, filter: "blur(20px)" }
            : attention
              ? { scale: [1, 1.035, 1], opacity: 1, filter: "blur(0px)" }
              : { scale: 1, opacity: 1, filter: "blur(0px)" }
        }
        transition={
          isImploding
            ? { duration: 0.3, ease: "easeOut" }
            : attention
              ? { scale: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } }
              : { duration: 0.3, ease: "easeOut" }
        }
        className="relative z-10 inline-flex flex-col items-center gap-1.5 px-6 py-2.5 rounded-[18px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8922a]/70"
        style={{
          // Navy ↔ cyan ortasının ortası — çok koyu (#182a48) ve çok açık
          // (#1d4264) iterasyonlar arası uzlaşma noktası. Marka navy
          // ailesinde, hafif cyan undertone, gold border + glow.
          background: hover
            ? "linear-gradient(135deg, #264a6e 0%, #2e5a82 50%, #264a6e 100%)"
            : "linear-gradient(135deg, #1b3656 0%, #23476b 50%, #1b3656 100%)",
          backdropFilter: "blur(21px) saturate(150%)",
          WebkitBackdropFilter: "blur(21px) saturate(150%)",
          border: "1.85px solid rgba(224,173,62,0.82)",
          boxShadow: hover
            ? "0 14px 42px rgba(0,0,0,0.63), 0 0 44px rgba(46,90,130,0.45), 0 0 24px rgba(224,173,62,0.34), inset 0 1.5px 0 rgba(240,201,94,0.36), inset 0 -1px 0 rgba(0,0,0,0.36)"
            : attention
              ? "0 12px 36px rgba(0,0,0,0.59), 0 0 36px rgba(46,90,130,0.36), 0 0 18px rgba(224,173,62,0.26), inset 0 1.5px 0 rgba(240,201,94,0.30), inset 0 -1px 0 rgba(0,0,0,0.36)"
              : "0 12px 32px rgba(0,0,0,0.59), 0 0 26px rgba(46,90,130,0.27), 0 0 12px rgba(224,173,62,0.20), inset 0 1.5px 0 rgba(240,201,94,0.26), inset 0 -1px 0 rgba(0,0,0,0.36)",
        }}
      >
        {/* Üst satır — yatay (logo + tyroverse + divider + Bağlan) */}
        <div className="inline-flex items-center gap-3">
          {/* Logo "verse" text gradient'iyle aynı altın paleti — tutarlı
              marka dokunuşu (kullanıcı isteği 2026-05-06). variant="login"
              mavi fill'ler kullanıyordu, burada tamamı gold gradient. */}
          <TyroLogo
            size={22}
            themeColors={{
              gradStart: "#f0c95e",
              gradEnd: "#c8922a",
              fillA: "#c8922a",
              fillB: "#e0ad3e",
              fillC: "#a07828",
            }}
          />

          <span className="inline-flex items-center">
            <span
              style={{
                fontSize: "17px",
                fontWeight: 800,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                color: "#ffffff",
              }}
            >
              {scrambleDone ? "tyro" : tyroText}
            </span>
            <span
              style={{
                fontSize: "17px",
                fontWeight: 800,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                background: "linear-gradient(90deg, #c8922a 0%, #f0c95e 45%, #e0ad3e 55%, #c8922a 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: scrambleDone ? "transparent" : "#e0ad3e",
              }}
            >
              {scrambleDone ? "verse" : verseText}
            </span>
          </span>

          <span
            className="inline-block w-px h-4 rounded-full"
            style={{ background: "rgba(255,255,255,0.3)" }}
            aria-hidden="true"
          />

          <span className="inline-flex items-center gap-1.5">
            <span
              style={{
                fontSize: "17px",
                fontWeight: 800,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                color: "#ffffff",
              }}
            >
              {scrambleDone ? connectLabel : baglanText}
            </span>
            <motion.span
              style={{ display: "inline-flex" }}
              animate={hover ? { y: [0, 3, 0] } : { y: 0 }}
              transition={{ duration: 0.8, repeat: hover ? Infinity : 0, ease: "easeInOut" }}
            >
              <MousePointerClick size={14} style={{ color: "#e0ad3e" }} strokeWidth={2.5} />
            </motion.span>
          </span>
        </div>

        {/* Alt satır — kurumsal bilgilendirme (login.ssoSubtitle i18n key)
            "Kurumsal Microsoft hesabınızla giriş yapın" */}
        <span
          style={{
            fontSize: "10.5px",
            fontWeight: 500,
            letterSpacing: "0.01em",
            color: "rgba(255,255,255,0.62)",
            lineHeight: 1.1,
          }}
        >
          {t("login.ssoSubtitle")}
        </span>
      </motion.button>
    </div>
  );
}
