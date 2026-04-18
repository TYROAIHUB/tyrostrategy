import { useEffect, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointerClick } from "lucide-react";
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

  const [hover, setHover] = useState(false);
  const [scrambleDone, setScrambleDone] = useState(false);

  // Scramble animations for each text segment
  const tyroText = useScrambleText("tyro", show, 700);
  const verseText = useScrambleText("verse", show, 800);
  const baglanText = useScrambleText("Bağlan", show, 900);

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
              {/* Radial glow pulse */}
              <div
                className="absolute rounded-full"
                style={{
                  top: "-150px",
                  left: "-150px",
                  width: "300px",
                  height: "300px",
                  background: hover
                    ? "radial-gradient(circle, rgba(200,146,42,0.40) 0%, transparent 72%)"
                    : "radial-gradient(circle, rgba(200,146,42,0.16) 0%, transparent 72%)",
                  animation: "portalRing 3s ease-in-out infinite",
                  transition: "background 0.4s",
                }}
              />

              {/* Inner orbital ring — encloses button with ~25px breathing room */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  top: "-140px",
                  left: "-140px",
                  width: "280px",
                  height: "280px",
                  border: `1px solid ${hover ? "rgba(224,173,62,0.70)" : "rgba(200,146,42,0.35)"}`,
                  boxShadow: hover ? "inset 0 0 20px rgba(200,146,42,0.28)" : "none",
                  transition: "border-color 0.3s, box-shadow 0.3s",
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: hover ? 10 : 22, repeat: Infinity, ease: "linear" }}
              />

              {/* Outer orbital ring — ~50px further out, dashed */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  top: "-170px",
                  left: "-170px",
                  width: "340px",
                  height: "340px",
                  border: `1.5px dashed ${hover ? "rgba(224,173,62,0.82)" : "rgba(200,146,42,0.40)"}`,
                  boxShadow: hover ? "0 0 44px rgba(200,146,42,0.45)" : "none",
                  transition: "border-color 0.3s, box-shadow 0.3s",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: hover ? 7 : 16, repeat: Infinity, ease: "linear" }}
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
                transition={{ duration: hover ? 7 : 16, repeat: Infinity, ease: "linear" }}
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
            </div>

            {/* Button */}
            <motion.button
              type="button"
              onClick={onClick}
              whileHover={!imploding && phase === "idle" ? { scale: 1.05, y: -1 } : undefined}
              whileTap={!imploding ? { scale: 0.96 } : undefined}
              className="relative z-10 inline-flex items-center gap-3 px-6 py-3 rounded-[18px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8922a]/70"
              style={{
                background:
                  "linear-gradient(135deg, rgba(18,32,56,0.92) 0%, rgba(10,22,40,0.88) 100%)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                border: "1.5px solid rgba(224,173,62,0.55)",
                boxShadow: hover
                  ? "0 14px 38px rgba(0,0,0,0.6), 0 0 48px rgba(200,146,42,0.35), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.3)"
                  : "0 12px 32px rgba(0,0,0,0.55), 0 0 32px rgba(200,146,42,0.22), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.3)",
                transition: "box-shadow 0.3s",
              }}
            >
              {/* Logo */}
              <TyroLogo size={22} variant="login" />

              {/* tyro white + verse gold (scramble reveal) — uniform font across all text */}
              <span className="inline-flex items-center">
                <span
                  style={{
                    fontFamily: "inherit",
                    fontSize: "15px",
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
                    fontSize: "15px",
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
                    fontSize: "15px",
                    fontWeight: 800,
                    letterSpacing: "-0.01em",
                    lineHeight: 1,
                    color: "#ffffff",
                  }}
                >
                  {scrambleDone ? "Bağlan" : baglanText}
                </span>
                <motion.span
                  style={{ display: "inline-flex" }}
                  animate={hover ? { y: [0, 3, 0] } : { y: 0 }}
                  transition={{ duration: 0.8, repeat: hover ? Infinity : 0, ease: "easeInOut" }}
                >
                  <MousePointerClick size={14} style={{ color: "#e0ad3e" }} strokeWidth={2.5} />
                </motion.span>
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </Html>
  );
}
