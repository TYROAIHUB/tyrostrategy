import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { IntroPhase } from "./introPhases";

/**
 * VerseTypewriter — Phase 2b/3/4/5 "TYROVERSE" typewriter reveal.
 *
 * Shows during p2b/p3/p4, fades out during p5. Gold gradient text with
 * blinking cursor. Optional subtitle appears +200ms after typewriter completes.
 */
export default function VerseTypewriter({
  phase,
  text = "TYROVERSE",
  subtitle,
}: {
  phase: IntroPhase;
  text?: string;
  subtitle?: string;
}) {
  const [visible, setVisible] = useState("");
  const [showCursor, setShowCursor] = useState(false);
  const [showSub, setShowSub] = useState(false);

  // Start typing at p2b
  useEffect(() => {
    if (phase !== "p2b") {
      if (phase === "idle" || phase === "p1" || phase === "p2") {
        setVisible("");
        setShowCursor(false);
        setShowSub(false);
      }
      return;
    }
    let i = 0;
    setShowCursor(true);
    const interval = setInterval(() => {
      i++;
      setVisible(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setTimeout(() => setShowSub(true), 220);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [phase, text]);

  // Fade out during p5+
  const show = phase === "p2b" || phase === "p3" || phase === "p4";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.4 }}
          className="pointer-events-none fixed left-1/2 -translate-x-1/2 z-[11] text-center"
          style={{ bottom: "16%" }}
          aria-hidden="true"
        >
          <div
            className="font-extrabold select-none"
            style={{
              fontSize: "clamp(20px, 3.2vw, 36px)",
              letterSpacing: "10px",
              lineHeight: 1,
              background:
                "linear-gradient(90deg, #1e3a5f 0%, #c8922a 35%, #e0ad3e 50%, #c8922a 65%, #1e3a5f 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
              filter: "drop-shadow(0 0 20px rgba(200,146,42,0.45))",
              paddingRight: showCursor ? "4px" : 0,
              borderRight: showCursor ? "2px solid #c8922a" : "none",
              animation: showCursor ? "cursorBlink 0.7s infinite" : undefined,
            }}
          >
            {visible || "\u00A0"}
          </div>
          {subtitle && (
            <motion.div
              className="uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: showSub ? 0.7 : 0 }}
              transition={{ duration: 0.5 }}
              style={{
                fontSize: "11px",
                letterSpacing: "5px",
                marginTop: "14px",
                color: "#c8daec",
                fontWeight: 500,
              }}
            >
              {subtitle}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
