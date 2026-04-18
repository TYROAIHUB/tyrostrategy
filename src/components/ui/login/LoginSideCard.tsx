import { motion } from "framer-motion";
import { TyroLogo } from "@/components/ui/TyroLogo";
import { cn } from "@/lib/cn";
import type { IntroPhase } from "./introPhases";

/**
 * LoginSideCard — TYROWMS-style liquid glass brand panel (simplified).
 *
 * Contains: logo + headline + description + copyright.
 * Feature list removed — features now reveal in the 3D scene via
 * MoveFeatureCard components anchored to each moved piece.
 */

type Props = {
  phase: IntroPhase;
  locale: "tr" | "en";
  onLocaleChange: (l: "tr" | "en") => void;
  appName?: string;
  headline: string;
  platformWord: string;
  description: string;
  copyrightText: string;
};

export default function LoginSideCard({
  phase,
  locale,
  onLocaleChange,
  appName = "strategy",
  headline,
  platformWord,
  description,
  copyrightText,
}: Props) {
  const animating = phase !== "idle" && phase !== "p1";

  return (
    <motion.div
      className="relative w-full max-w-[460px]"
      initial={{ opacity: 0, x: -30, scale: 0.98 }}
      animate={{
        opacity: animating ? 0 : 1,
        x: animating ? -60 : 0,
        scale: 1,
        filter: animating ? "blur(8px)" : "blur(0px)",
      }}
      transition={{
        opacity: { duration: animating ? 0.55 : 0.7, delay: animating ? 0 : 0.2 },
        x: { duration: animating ? 0.55 : 0.7, delay: animating ? 0 : 0.2 },
        scale: { duration: 0.5, delay: 0.2 },
        filter: { duration: 0.5 },
      }}
    >
      <div
        className="relative rounded-[28px] p-8 sm:p-10 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(26,53,88,0.38) 0%, rgba(14,32,60,0.30) 50%, rgba(20,40,66,0.42) 100%)",
          backdropFilter: "blur(36px) saturate(200%)",
          WebkitBackdropFilter: "blur(36px) saturate(200%)",
          border: "1px solid rgba(224, 173, 62, 0.22)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.45), 0 8px 30px rgba(200,146,42,0.08), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.18)",
        }}
      >
        {/* Liquid shimmer sweep */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, transparent 30%, rgba(224,173,62,0.08) 48%, rgba(200,218,240,0.05) 52%, transparent 70%)",
            mixBlendMode: "screen",
          }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          aria-hidden="true"
        />

        {/* Soft highlight orb */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(224,173,62,0.4) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        {/* TR/EN toggle */}
        <div className="absolute top-4 right-4 z-20">
          <div className="inline-flex items-center gap-0.5 p-1 rounded-full backdrop-blur-sm border bg-white/[0.08] border-white/[0.14]">
            <button
              type="button"
              onClick={() => onLocaleChange("tr")}
              className={cn(
                "text-[10.5px] font-bold px-2.5 py-1 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8922a]/60",
                locale === "tr"
                  ? "bg-white/[0.18] text-white shadow-sm"
                  : "text-white/55 hover:text-white",
              )}
            >
              TR
            </button>
            <button
              type="button"
              onClick={() => onLocaleChange("en")}
              className={cn(
                "text-[10.5px] font-bold px-2.5 py-1 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8922a]/60",
                locale === "en"
                  ? "bg-white/[0.18] text-white shadow-sm"
                  : "text-white/55 hover:text-white",
              )}
            >
              EN
            </button>
          </div>
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 mb-6"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <TyroLogo size={40} variant="login" />
            <span className="text-[22px] font-extrabold tracking-tight text-white">
              tyro
              <span
                className="ml-0.5"
                style={{
                  background: "linear-gradient(90deg, #c8922a, #e0ad3e, #c8922a)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {appName}
              </span>
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-[30px] sm:text-[34px] font-extrabold leading-[1.08] tracking-tight mb-4 text-white"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
          >
            {headline}
            <br />
            <span
              style={{
                background:
                  "linear-gradient(90deg, #e0ad3e 0%, #f0c95e 50%, #c8922a 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {platformWord}
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-[14px] leading-relaxed mb-8"
            style={{ color: "#c8daec" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {description}
          </motion.p>

          {/* Copyright footer */}
          <p
            className="text-[10.5px] tracking-wide pt-4 border-t border-white/[0.08]"
            style={{ color: "rgba(151,184,216,0.45)" }}
          >
            {copyrightText}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
