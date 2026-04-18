import { useRef, useMemo, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

/**
 * PieceShowcase — a 3D piece wrapper that performs a rise/glow animation
 * and displays an HTML feature label above it when active.
 *
 * Controlled by `active` prop (driven by parent cycle state machine).
 * Works alongside the 7-phase login intro (pieces drop when animating).
 */

type Props = {
  position: [number, number, number];
  active: boolean;
  paused: boolean;              // true during login intro → freeze feature showcase
  baseEmissive?: number;
  peakEmissive?: number;
  baseLift?: number;
  peakLift?: number;
  featureLabel?: {
    icon: ReactNode;
    title: string;
    description: string;
  };
  checkmateMove?: {
    to: [number, number];       // (x, z) target board coords
    startTime: number;          // seconds after intro start
    duration: number;           // seconds
    fall?: boolean;             // rotate 90° on impact (captured/checkmated)
  };
  children: ReactNode;
};

export default function PieceShowcase({
  position,
  active,
  paused,
  baseEmissive = 0.22,
  peakEmissive = 0.65,
  baseLift = 0,
  peakLift = 0.18,
  featureLabel,
  checkmateMove,
  children,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const baseY = position[1];
  const baseX = position[0];
  const baseZ = position[2];
  const progressRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // ── Checkmate move during intro ──
    if (paused && checkmateMove && window._tyroLoginAnim && window._tyroLoginStart) {
      const elapsed = (performance.now() - window._tyroLoginStart) / 1000;
      const t = elapsed - checkmateMove.startTime;

      if (t < 0) {
        // Before move starts → hold base
        groupRef.current.position.set(baseX, baseY, baseZ);
        groupRef.current.rotation.x = 0;
      } else {
        const p = Math.min(t / checkmateMove.duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);

        if (checkmateMove.fall) {
          // Fall in place: rotate 90° backward
          groupRef.current.position.set(baseX, baseY, baseZ);
          groupRef.current.rotation.x = -eased * Math.PI * 0.5;
        } else {
          // Move to target with small arc
          const toBoardX = checkmateMove.to[0] + 0.5;
          const toBoardZ = checkmateMove.to[1] + 0.5;
          const x = baseX + (toBoardX - baseX) * eased;
          const z = baseZ + (toBoardZ - baseZ) * eased;
          const arc = Math.sin(eased * Math.PI) * 0.25;
          groupRef.current.position.set(x, baseY + arc, z);
          groupRef.current.rotation.x = 0;
        }
      }

      // Damp spotlight during intro
      if (spotRef.current) {
        spotRef.current.intensity = 0;
      }
      return;
    }

    // ── Paused without checkmate move: stay at base ──
    if (paused) {
      groupRef.current.position.set(baseX, baseY, baseZ);
      groupRef.current.rotation.x = 0;
      progressRef.current = THREE.MathUtils.lerp(progressRef.current, 0, 1 - Math.exp(-delta * 5));
      if (spotRef.current) spotRef.current.intensity = 0;
      return;
    }

    // ── Idle: feature showcase rise/breathing ──
    const target = active ? 1 : 0;
    progressRef.current = THREE.MathUtils.lerp(progressRef.current, target, 1 - Math.exp(-delta * 5));
    const p = progressRef.current;
    const hoverBounce = active ? Math.sin(state.clock.elapsedTime * 1.4) * 0.015 : 0;

    groupRef.current.position.x = baseX;
    groupRef.current.position.z = baseZ;
    groupRef.current.position.y = baseY + baseLift + (peakLift - baseLift) * p + hoverBounce * p;
    groupRef.current.rotation.x = 0;

    if (spotRef.current) {
      spotRef.current.intensity = 1.6 * p;
    }
  });

  // Stable position accessors for Html overlay
  const labelPos = useMemo<[number, number, number]>(
    () => [0, 1.25, 0],
    []
  );

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Spotlight above piece — fades in when active */}
      <spotLight
        ref={spotRef}
        position={[0, 3.5, 0]}
        angle={0.35}
        penumbra={0.6}
        intensity={0}
        color="#e0ad3e"
        distance={6}
        decay={1.2}
        castShadow={false}
      />

      <group ref={groupRef} position={[0, baseY, 0]}>
        {children}
      </group>

      {/* Feature label — HTML overlay, only renders when active */}
      {featureLabel && (
        <Html
          position={labelPos}
          center
          transform
          sprite
          scale={0.18}
          zIndexRange={[5, 0]}
          pointerEvents="none"
          style={{ pointerEvents: "none" }}
        >
          <AnimatePresence>
            {active && !paused && (
              <motion.div
                initial={{ scale: 0.75, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: -4 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 22,
                  mass: 0.8,
                }}
                className="pointer-events-none"
                role="status"
                aria-live="polite"
                style={{ width: "240px" }}
              >
                <div
                  className="px-4 py-3 rounded-2xl text-center"
                  style={{
                    background: "rgba(26, 53, 88, 0.72)",
                    backdropFilter: "blur(18px) saturate(150%)",
                    WebkitBackdropFilter: "blur(18px) saturate(150%)",
                    border: "1px solid rgba(200, 146, 42, 0.35)",
                    boxShadow:
                      "0 14px 36px rgba(0,0,0,0.5), 0 0 24px rgba(200,146,42,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="flex items-center justify-center gap-2 mb-1.5">
                    <span style={{ color: "#e0ad3e", display: "inline-flex" }}>
                      {featureLabel.icon}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 800,
                        color: "#ffffff",
                        letterSpacing: "0.3px",
                      }}
                    >
                      {featureLabel.title}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "11px",
                      lineHeight: 1.55,
                      color: "#c8daec",
                      margin: 0,
                    }}
                  >
                    {featureLabel.description}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Html>
      )}
    </group>
  );
}

/** Helper: compute emissive intensity for a piece based on activation progress */
export function computeEmissive(baseValue: number, peakValue: number, progress: number) {
  return baseValue + (peakValue - baseValue) * progress;
}
