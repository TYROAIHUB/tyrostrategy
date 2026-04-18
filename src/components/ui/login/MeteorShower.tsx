import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * MeteorShower — cinematic shooting stars streaking diagonally through
 * the DEEP BACKGROUND (z << -1). Uses BufferGeometry LineSegments with
 * additive blending for a bright gold-white head + warm trail.
 *
 * Meteors never cross the camera's foreground — strictly behind the board.
 */

const METEOR_COUNT = 8;

type Meteor = {
  headPos: THREE.Vector3;
  dir: THREE.Vector3;
  speed: number;
  trailLen: number;
  lifetime: number;
  age: number;
};

function makeMeteor(): Meteor {
  // All meteors start deep in the background (z < -1.2)
  const startX = 0.8 + Math.random() * 1.2;     // enter from upper-right
  const startY = 0.7 + Math.random() * 0.7;     // upper sky
  const startZ = -1.4 - Math.random() * 0.8;    // -1.4 to -2.2

  const dir = new THREE.Vector3(
    -0.6 - Math.random() * 0.3,
    -0.7 - Math.random() * 0.2,
    (Math.random() - 0.5) * 0.12,
  ).normalize();

  return {
    headPos: new THREE.Vector3(startX, startY, startZ),
    dir,
    speed: 0.35 + Math.random() * 0.45,
    trailLen: 0.22 + Math.random() * 0.22,
    lifetime: 2.0 + Math.random() * 1.5,
    age: -Math.random() * 4.0,
  };
}

export default function MeteorShower() {
  const meshRef = useRef<THREE.LineSegments>(null);
  const meteorsRef = useRef<Meteor[]>([]);

  const { geometry, positions, colors } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(METEOR_COUNT * 2 * 3);
    const col = new Float32Array(METEOR_COUNT * 2 * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.computeBoundingSphere = () => {
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -1.8), 10);
    };
    geo.computeBoundingSphere();
    return { geometry: geo, positions: pos, colors: col };
  }, []);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false, // meteors ignore scene fog
      }),
    [],
  );

  useEffect(() => {
    meteorsRef.current = Array.from({ length: METEOR_COUNT }, makeMeteor);
  }, []);

  useFrame((_, delta) => {
    const meteors = meteorsRef.current;
    for (let i = 0; i < meteors.length; i++) {
      const m = meteors[i];
      m.age += delta;

      if (m.age >= m.lifetime) {
        meteors[i] = makeMeteor();
        continue;
      }

      const prog = Math.max(m.age, 0) / m.lifetime;
      const fade = prog < 0.18 ? prog / 0.18 : prog > 0.82 ? (1 - prog) / 0.18 : 1;
      const effFade = m.age < 0 ? 0 : fade;

      m.headPos.addScaledVector(m.dir, m.speed * delta);

      const base = i * 6;
      // Head (bright)
      positions[base + 0] = m.headPos.x;
      positions[base + 1] = m.headPos.y;
      positions[base + 2] = m.headPos.z;
      // Tail (back along reverse direction)
      positions[base + 3] = m.headPos.x - m.dir.x * m.trailLen;
      positions[base + 4] = m.headPos.y - m.dir.y * m.trailLen;
      positions[base + 5] = m.headPos.z - m.dir.z * m.trailLen;

      // Head color: bright warm white-gold
      colors[base + 0] = 1.0 * effFade;
      colors[base + 1] = 0.95 * effFade;
      colors[base + 2] = 0.78 * effFade;
      // Tail color: warm gold fading
      colors[base + 3] = 0.7 * effFade;
      colors[base + 4] = 0.45 * effFade;
      colors[base + 5] = 0.15 * effFade;
    }

    (geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    // @ts-expect-error three.js primitive
    <lineSegments
      ref={meshRef}
      frustumCulled={false}
      geometry={geometry}
      material={material}
      renderOrder={-1}
    />
  );
}
