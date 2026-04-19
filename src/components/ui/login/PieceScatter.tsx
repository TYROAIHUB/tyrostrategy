import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PieceRefMap } from "./PolyHavenChessSet";
import type { IntroPhase } from "./introPhases";

/**
 * PieceScatter — on phase "p4" (as the hero king charges to the center),
 * all non-king pieces explode outward with chaotic tumble and gravity,
 * like a strategic shockwave sweeping the board before the ŞAH MAT
 * reveal. The two kings stay put — white advances to the center, black
 * recedes and tilts.
 */

type ScatterState = {
  velocity: THREE.Vector3;
  angularVel: THREE.Vector3;
  active: boolean;
};

type Props = {
  pieces: PieceRefMap;
  phase: IntroPhase;
};

const GRAVITY = -1.8;
const SKIP_KEYS = new Set(["piece_king_white", "piece_king_black"]);

export default function PieceScatter({ pieces, phase }: Props) {
  const scatterRef = useRef<Map<string, ScatterState>>(new Map());

  useEffect(() => {
    if (phase === "p4") {
      Object.entries(pieces).forEach(([key, piece]) => {
        if (SKIP_KEYS.has(key)) return;
        const pos = piece.position;
        // Radial outward direction from board center (origin in local)
        const dir = new THREE.Vector3(pos.x, 0, pos.z);
        if (dir.length() < 0.02) {
          const angle = Math.random() * Math.PI * 2;
          dir.set(Math.cos(angle), 0, Math.sin(angle));
        }
        dir.normalize();
        // Horizontal velocity with slight directional jitter
        const jitter = (Math.random() - 0.5) * 0.4;
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), jitter);
        const horizSpeed = 0.42 + Math.random() * 0.28;
        const velocity = dir.multiplyScalar(horizSpeed);
        velocity.y = 0.55 + Math.random() * 0.45;
        const angularVel = new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
        );
        scatterRef.current.set(key, { velocity, angularVel, active: true });
      });
    } else if (phase === "idle") {
      // Reset when returning to idle (e.g., after a failed login retry)
      scatterRef.current.clear();
    }
  }, [phase, pieces]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05); // clamp for hitches
    scatterRef.current.forEach((state) => {
      if (!state.active) return;
      // Velocity & gravity tracked per-key via piece lookup below
    });
    scatterRef.current.forEach((state, key) => {
      if (!state.active) return;
      const piece = pieces[key];
      if (!piece) return;
      piece.position.addScaledVector(state.velocity, dt);
      state.velocity.y += GRAVITY * dt;
      piece.rotation.x += state.angularVel.x * dt;
      piece.rotation.y += state.angularVel.y * dt;
      piece.rotation.z += state.angularVel.z * dt;
      // Once well below the board, stop updating and hide
      if (piece.position.y < -0.3) {
        piece.visible = false;
        state.active = false;
      }
    });
  });

  return null;
}
