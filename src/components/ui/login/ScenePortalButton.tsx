import { useEffect, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointerClick } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TyroLogo } from "@/components/ui/TyroLogo";
import type { IntroPhase } from "./introPhases";

/**
 * ScenePortalButton — 3D-anchored portal button at board center.
 *
 * Layout:  [Logo]  tyro  verse  │  Bağlan  [click icon ↓]
 *
 * Reveal animation: When `visible` flips true, the button first appears
 * with ASCII-glyph scramble text, then characters crystallize from left
 * to right over ~0.8s to the real label ("tyroverse" + "Bağlan").
 */

const SCRAMBLE_GLYPHS = "!@#$%^&*<>{}[]|~+=/\\?¢§∆¿⊗◈◊Δ╬╔╩┼";

type Props = {
  visible: boolean;
  phase: IntroPhase;
  onClick: () => void;
  worldPosition?: [number, number, number];
};

/* ── Hook: text scramble reveal ── */
function useScrambleText(target: string, active: boolean, duration = 800) {
  const [display, setDisplay] = useState("");
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setDisplay("");
      startRef.current = null;
      return;
    }
    startRef.current = performance.now();
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      if (startRef.current === null) return;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Reveal chars left-to-right, scramble the rest
      const revealedCount = Math.floor(progress * target.length);
      const out = target
        .split("")
        .map((c, i) => {
          if (i < revealedCount) return c;
          // Keep spaces natural so layout doesn't jump
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

export default function ScenePortalButton({
  visible,
  phase,
  onClick,
  worldPosition = [0, 0.065, 0],
}: Props) {
  const imploding =
    phase === "p3" || phase === "p4" || phase === "p5" || phase === "p6" || phase === "auth";
  const show = visible && !imploding;
  const { t } = useTranslation();
  const connectLabel = t("login.connect");

  const [hover, setHover] = useState(false);
  const [scrambleDone, setScrambleDone] = useState(false);

  // Attention state — show idle'da 5sn tıklanmadıysa orbital halka + glow %50
  // daha yoğun pulse atar. PortalButton (mobile) ile birebir aynı kural.
  const [attention, setAttention] = useState(false);
  useEffect(() => {
    if (!show || phase !== "idle") {
      setAttention(false);
      return;
    }
    const timer = setTimeout(() => setAttention(true), 5000);
    return () => clearTimeout(timer);
  }, [show, phase]);
  useEffect(() => {
    if (hover) setAttention(false);
  }, [hover]);

  // Scramble animations for each text segment
  const tyroText = useScrambleText("tyro", show, 700);
  const verseText = useScrambleText("verse", show, 800);
  const baglanText = useScrambleText(connectLabel, show, 900);

  // Mark scramble done after total ~1s so full styling kicks in
  useEffect(() => {
    if (!show) {
      setScrambleDone(false);
      return;
    }
    const timer = setTimeout(() => setScrambleDone(true), 1000);
    return () => clearTimeout(timer);
  }, [show]);

  return (
    <Html
      position={worldPosition}
      center
      zIndexRange={[30, 20]}
      style={{ pointerEvents: show ? "auto" : "none" }}
    >
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotateY: -60 }}
            animate={{
              scale: phase === "p1" ? 1.06 : phase === "p2" || phase === "p2b" ? 1.04 : 1,
              opacity: 1,
              rotateY: 0,
            }}
            exit={{ scale: 0.4, opacity: 0, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 200, damping: 22, mass: 0.8 }}
            className="relative inline-flex items-center justify-center"
            style={{ isolation: "isolate" }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            {/* Centering wrapper — handles translate(-50%,-50%) so rings stay anchored on button */}
            <div
              className="pointer-events-none absolute"
              style={{
                top: "50%",
                left: "50%",
                width: 0,
                height: 0,
              }}
              aria-hidden="true"
            >
              {/* Outer radial bloom — attention'da %50 daha yoğun + hızlı pulse */}
              <div
                className="absolute rounded-full"
                style={{
                  top: "-220px",
                  left: "-220px",
                  width: "440px",
                  height: "440px",
                  background: hover
                    ? "radial-gradient(circle, rgba(224,173,62,0.32) 0%, rgba(200,146,42,0.18) 45%, transparent 78%)"
                    : attention
                      ? "radial-gradient(circle, rgba(224,173,62,0.20) 0%, rgba(200,146,42,0.10) 45%, transparent 78%)"
                      : "radial-gradient(circle, rgba(224,173,62,0.12) 0%, rgba(200,146,42,0.05) 45%, transparent 78%)",
                  animation: `portalRing ${attention ? "2s" : "3s"} ease-in-out infinite`,
                  transition: "background 0.35s",
                }}
              />

              {/* Inner radial glow pulse */}
              <div
                className="absolute rounded-full"
                style={{
                  top: "-150px",
                  left: "-150px",
                  width: "300px",
                  height: "300px",
                  background: hover
                    ? "radial-gradient(circle, rgba(200,146,42,0.45) 0%, transparent 72%)"
                    : attention
                      ? "radial-gradient(circle, rgba(200,146,42,0.30) 0%, transparent 72%)"
                      : "radial-gradient(circle, rgba(200,146,42,0.18) 0%, transparent 72%)",
                  animation: `portalRing ${attention ? "2s" : "3s"} ease-in-out infinite`,
                  transition: "background 0.4s",
                }}
              />

              {/* Inner orbital ring */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  top: "-140px",
                  left: "-140px",
                  width: "280px",
                  height: "280px",
                  border: `1px solid ${phase === "p1" ? "rgba(240,201,94,0.95)" : hover ? "rgba(224,173,62,0.70)" : attention ? "rgba(224,173,62,0.55)" : "rgba(200,146,42,0.35)"}`,
                  boxShadow: phase === "p1"
                    ? "inset 0 0 35px rgba(240,201,94,0.55), 0 0 28px rgba(240,201,94,0.6)"
                    : hover ? "inset 0 0 20px rgba(200,146,42,0.28)"
                    : attention ? "inset 0 0 16px rgba(200,146,42,0.22), 0 0 20px rgba(200,146,42,0.28)"
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

              {/* Outer orbital ring */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  top: "-170px",
                  left: "-170px",
                  width: "340px",
                  height: "340px",
                  border: `1.5px dashed ${phase === "p1" ? "rgba(240,201,94,1)" : hover ? "rgba(224,173,62,0.82)" : attention ? "rgba(224,173,62,0.65)" : "rgba(200,146,42,0.40)"}`,
                  boxShadow: phase === "p1"
                    ? "0 0 70px rgba(240,201,94,0.75)"
                    : hover ? "0 0 44px rgba(200,146,42,0.45)"
                    : attention ? "0 0 32px rgba(200,146,42,0.36)"
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
                style={{
                  top: "-170px",
                  left: "-170px",
                  width: "340px",
                  height: "340px",
                }}
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
                      width: "6px",
                      height: "6px",
                      background: "#e0ad3e",
                      boxShadow: "0 0 12px rgba(224,173,62,0.95)",
                      transform: `translate(-50%, -50%) rotate(${deg}deg) translate(170px)`,
                      opacity: hover ? 1 : 0.55,
                      transition: "opacity 0.3s",
                    }}
                  />
                ))}
              </motion.div>

              {/* ─── Dr. Strange portal burst — only during phase p1 ─── */}
              <AnimatePresence>
                {phase === "p1" && (
                  <>
                    {/* Expanding burst ring #1 — inner quick flash */}
                    <motion.div
                      key="burst-1"
                      className="absolute rounded-full"
                      style={{
                        top: "-170px",
                        left: "-170px",
                        width: "340px",
                        height: "340px",
                        border: "2px solid rgba(240,201,94,0.9)",
                        boxShadow:
                          "0 0 50px rgba(240,201,94,0.7), inset 0 0 40px rgba(240,201,94,0.45)",
                      }}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1.8, opacity: [0, 1, 0], rotate: 180 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                    {/* Expanding burst ring #2 — delayed, wider */}
                    <motion.div
                      key="burst-2"
                      className="absolute rounded-full"
                      style={{
                        top: "-200px",
                        left: "-200px",
                        width: "400px",
                        height: "400px",
                        border: "1.5px dashed rgba(240,201,94,0.8)",
                        boxShadow: "0 0 70px rgba(240,201,94,0.55)",
                      }}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 2.0, opacity: [0, 0.9, 0], rotate: -240 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.0, delay: 0.1, ease: "easeOut" }}
                    />
                    {/* Expanding burst ring #3 — outer, fastest fade */}
                    <motion.div
                      key="burst-3"
                      className="absolute rounded-full"
                      style={{
                        top: "-230px",
                        left: "-230px",
                        width: "460px",
                        height: "460px",
                        border: "1px solid rgba(255,230,170,0.7)",
                        boxShadow: "0 0 90px rgba(255,230,170,0.4)",
                      }}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 2.2, opacity: [0, 0.8, 0], rotate: 300 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.1, delay: 0.2, ease: "easeOut" }}
                    />
                    {/* Radiating spark particles — 12 outward streaks */}
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
                            height: "22px",
                            background:
                              "linear-gradient(180deg, rgba(255,235,180,1) 0%, rgba(240,201,94,0.8) 50%, transparent 100%)",
                            transformOrigin: "50% 0%",
                            borderRadius: "2px",
                            boxShadow: "0 0 10px rgba(240,201,94,0.9)",
                          }}
                          initial={{
                            opacity: 0,
                            rotate: angle,
                            x: -1.5,
                            y: 0,
                            scale: 0.3,
                          }}
                          animate={{
                            opacity: [0, 1, 0],
                            y: [0, 180, 220],
                            scale: [0.3, 1.2, 0.6],
                          }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 0.9,
                            delay: i * 0.025,
                            ease: "easeOut",
                          }}
                        />
                      );
                    })}
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Button — cool teal-cyan gradient (chess board sıcak ahşap +
                altın paletinden ayrılır, dikkat çeker). Gold border
                marka bağını koruyor. Attention'da hafif scale-pulse
                tıklamayı davet eder. */}
            <motion.button
              type="button"
              onClick={onClick}
              whileHover={!imploding && phase === "idle" ? { scale: 1.05, y: -1 } : undefined}
              whileTap={!imploding ? { scale: 0.96 } : undefined}
              animate={attention ? { scale: [1, 1.035, 1] } : { scale: 1 }}
              transition={
                attention
                  ? { scale: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } }
                  : { duration: 0.2 }
              }
              className="relative z-10 inline-flex flex-col items-center gap-1.5 px-6 py-2.5 rounded-[18px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8922a]/70"
              style={{
                // Navy ↔ cyan ortasının ortası — koyu (#182a48) ile açık
                // (#1d4264) iterasyonlar arası uzlaşma. Marka navy ailesi,
                // hafif cyan undertone, gold border + glow.
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
                transition: "box-shadow 0.3s, background 0.3s",
              }}
            >
              {/* Üst satır — yatay (logo + tyroverse + divider + Bağlan) */}
              <div className="inline-flex items-center gap-3">
                {/* Logo "verse" text gradient'iyle aynı altın paleti —
                    tutarlı marka dokunuşu. */}
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

                {/* tyro white + verse gold (scramble reveal) — uniform font across all text */}
                <span className="inline-flex items-center">
                  <span
                    style={{
                      fontFamily: "inherit",
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
                      fontFamily: "inherit",
                      fontSize: "17px",
                      fontWeight: 800,
                      letterSpacing: "-0.01em",
                      lineHeight: 1,
                      background:
                        "linear-gradient(90deg, #c8922a 0%, #f0c95e 45%, #e0ad3e 55%, #c8922a 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      color: scrambleDone ? "transparent" : "#e0ad3e",
                    }}
                  >
                    {scrambleDone ? "verse" : verseText}
                  </span>
                </span>

                {/* Divider */}
                <span
                  className="inline-block w-px h-4 rounded-full"
                  style={{ background: "rgba(255,255,255,0.3)" }}
                  aria-hidden="true"
                />

                {/* "Bağlan" — exact same font styling as tyro/verse */}
                <span className="inline-flex items-center gap-1.5">
                  <span
                    style={{
                      fontFamily: "inherit",
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

              {/* Alt satır — kurumsal SSO bilgilendirmesi */}
              <span
                style={{
                  fontFamily: "inherit",
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
          </motion.div>
        )}
      </AnimatePresence>
    </Html>
  );
}
