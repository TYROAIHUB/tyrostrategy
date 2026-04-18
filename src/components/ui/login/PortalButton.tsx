import { motion } from "framer-motion";
import { TyroLogo } from "@/components/ui/TyroLogo";
import type { IntroPhase } from "./introPhases";

/**
 * PortalButton — TYROVERSE entry button with gold concentric rings.
 * Click triggers cinematic intro sequence via onActivate.
 */
export default function PortalButton({
  phase,
  onActivate,
  label,
  loading,
}: {
  phase: IntroPhase;
  onActivate: () => void;
  label: string;
  loading?: boolean;
}) {
  const isGlow = phase === "p1";
  const isScaledUp = phase === "p2" || phase === "p2b";
  const isImploding =
    phase === "p3" ||
    phase === "p4" ||
    phase === "p5" ||
    phase === "p6" ||
    phase === "auth";

  return (
    <div className="relative flex items-center justify-center">
      {/* Concentric gold rings */}
      {!isImploding && (
        <>
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 w-[240px] h-[240px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(200,146,42,0.12) 0%, transparent 70%)",
              animation: "portalRing 3s ease-in-out infinite",
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full"
            style={{
              border: "1px dashed rgba(200,146,42,0.20)",
              animation: "portalRing 4s ease-in-out 0.8s infinite",
            }}
            aria-hidden="true"
          />
        </>
      )}

      {/* Portal button */}
      <motion.button
        type="button"
        onClick={onActivate}
        disabled={loading || isImploding}
        className="relative z-10 flex items-center gap-3 px-6 py-3.5 rounded-[22px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8922a]/60"
        initial={false}
        animate={{
          scale: isImploding ? 0.4 : isScaledUp ? 1.08 : 1,
          opacity: isImploding ? 0 : 1,
          filter: isImploding ? "blur(20px)" : "blur(0px)",
          boxShadow: isGlow
            ? "0 0 50px rgba(200,146,42,0.6), 0 0 100px rgba(30,58,95,0.4), inset 0 1px 0 rgba(255,255,255,0.25)"
            : "0 16px 48px rgba(0,0,0,0.35), 0 0 40px rgba(200,146,42,0.18), inset 0 1px 0 rgba(255,255,255,0.22)",
        }}
        whileHover={!isImploding && !isGlow ? { scale: 1.03 } : undefined}
        whileTap={!isImploding ? { scale: 0.97 } : undefined}
        transition={{
          scale: { duration: isImploding ? 0.4 : 0.25, ease: "easeOut" },
          opacity: { duration: 0.35 },
          filter: { duration: 0.35 },
          boxShadow: { duration: 0.25 },
        }}
        style={{
          background:
            "linear-gradient(135deg, rgba(26,51,88,0.6), rgba(26,51,88,0.45))",
          backdropFilter: "blur(28px) saturate(150%)",
          WebkitBackdropFilter: "blur(28px) saturate(150%)",
          border: "1.5px solid rgba(224,173,62,0.35)",
        }}
      >
        <TyroLogo size={22} variant="login" />
        <span
          className="text-[13px] font-bold tracking-[0.1em] whitespace-nowrap"
          style={{ color: "#f1f5f9" }}
        >
          {label}
        </span>
      </motion.button>
    </div>
  );
}
