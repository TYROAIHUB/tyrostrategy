import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * AnimatedPiece — a piece that can be moved/rotated by the checkmate
 * choreography during login intro. Reads window._tyroLoginStart +
 * window._tyroLoginAnim to determine current elapsed time.
 *
 * Idle mode: piece sits at `basePosition` (standard chess position).
 * Intro mode: lerps to `targetPosition` according to startTime/duration.
 */

type Props = {
  basePosition: [number, number];              // (x, z) on board
  y?: number;                                    // height offset (default 0.08)
  move?: {
    to: [number, number];
    startTime: number;
    duration: number;
    fall?: boolean;
  };
  children: ReactNode;
};

export default function AnimatedPiece({ basePosition, y = 0.08, move, children }: Props) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;

    const anim = window._tyroLoginAnim;
    const start = window._tyroLoginStart;

    if (!anim || !start) {
      // Idle — reset to base
      groupRef.current.position.x = basePosition[0] + 0.5;
      groupRef.current.position.y = y;
      groupRef.current.position.z = basePosition[1] + 0.5;
      groupRef.current.rotation.x = 0;
      return;
    }

    if (!move) {
      // Non-moving piece during intro — stays put, maybe hide slightly
      groupRef.current.position.x = basePosition[0] + 0.5;
      groupRef.current.position.y = y;
      groupRef.current.position.z = basePosition[1] + 0.5;
      return;
    }

    const elapsed = (performance.now() - start) / 1000;
    const t = elapsed - move.startTime;

    if (t < 0) {
      // Before move starts — stay at base
      groupRef.current.position.x = basePosition[0] + 0.5;
      groupRef.current.position.y = y;
      groupRef.current.position.z = basePosition[1] + 0.5;
      return;
    }

    const p = Math.min(t / move.duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic

    if (move.fall) {
      // Fall animation: rotate 90° backward while staying in place
      groupRef.current.position.x = basePosition[0] + 0.5;
      groupRef.current.position.y = y;
      groupRef.current.position.z = basePosition[1] + 0.5;
      groupRef.current.rotation.x = -eased * Math.PI * 0.5;
      return;
    }

    // Move animation: lerp position
    const fromX = basePosition[0];
    const fromZ = basePosition[1];
    const toX = move.to[0];
    const toZ = move.to[1];
    const x = fromX + (toX - fromX) * eased;
    const z = fromZ + (toZ - fromZ) * eased;

    // Small arc during move (jump effect for last 20%)
    const arc = Math.sin(eased * Math.PI) * 0.1;

    groupRef.current.position.x = x + 0.5;
    groupRef.current.position.y = y + arc;
    groupRef.current.position.z = z + 0.5;
    groupRef.current.rotation.x = 0;
  });

  return <group ref={groupRef}>{children}</group>;
}
