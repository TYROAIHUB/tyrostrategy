import { useMemo } from "react";
import * as THREE from "three";

/**
 * StarField — ambient tiny stars scattered in the deep background.
 * Static (no animation), additive blending for bright pinpoint effect.
 * ~50 stars, all placed at z < -1.3 (behind the chessboard).
 */

const STAR_COUNT = 55;

export default function StarField() {
  const positions = useMemo(() => {
    const arr = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 4.0;        // wide X spread
      arr[i * 3 + 1] = Math.random() * 2.0 + 0.05;     // upper hemisphere
      arr[i * 3 + 2] = -1.5 - Math.random() * 1.8;     // deep background
    }
    return arr;
  }, []);

  return (
    <points frustumCulled={false} renderOrder={-1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={STAR_COUNT} />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#fff5dd"
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </points>
  );
}
