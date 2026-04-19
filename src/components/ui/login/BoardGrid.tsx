import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { SQUARE_SIZE, FILE_ORIGIN_X, RANK_ORIGIN_Z_WHITE } from "./ChessMatch";

/**
 * BoardGrid — 9 horizontal + 9 vertical gold glow lines on the board.
 *
 * Upgrades over the plain LineBasicMaterial version:
 *   B — Per-line hierarchy (border / center-cross / interior) via
 *       a `lineType` vertex attribute. Three materials conceptually,
 *       one shader.
 *   D — Ripple-reactive: when a piece move fires a ripple, grid lines
 *       within the wavefront band briefly flash to the piece's color.
 *       The Scene feeds the ripple uniforms every frame via `onReady`.
 *   F — Breathing sync — grid pulses opposite to the dark squares'
 *       breath so the whole board feels like one organism.
 */

const VERT = `
  attribute float lineType;
  varying float vLineType;
  varying vec2 vLocalXZ;
  void main() {
    vLineType = lineType;
    vLocalXZ = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = `
  uniform float uTime;
  uniform vec2 uRippleOrigin;
  uniform float uRippleTime;
  uniform float uRippleMaxR;
  uniform float uRippleWidth;
  uniform vec3 uRippleColor;
  uniform vec3 uInteriorColor;
  uniform vec3 uCenterColor;
  uniform vec3 uBorderColor;
  varying float vLineType;
  varying vec2 vLocalXZ;

  void main() {
    // ─── B. Per-line hierarchy ───
    vec3 col;
    float baseOpacity;
    if (vLineType > 1.5) {            // border
      col = uBorderColor;
      baseOpacity = 1.0;
    } else if (vLineType > 0.5) {     // center cross (file e, rank 4-5 boundary)
      col = uCenterColor;
      baseOpacity = 0.92;
    } else {                          // interior
      col = uInteriorColor;
      baseOpacity = 0.72;
    }

    // ─── F. Breathing sync — opposite phase to dark squares ───
    float breath = sin(uTime * 1.5708 + 3.14159) * 0.15;
    col *= 1.0 + breath * 0.6;
    float opacity = clamp(baseOpacity * (1.0 + breath * 0.35), 0.0, 1.0);

    // ─── D. Crystal shimmer on piece move ───
    if (uRippleTime >= 0.0 && uRippleTime <= 1.0) {
      float rDist = length(vLocalXZ - uRippleOrigin);
      float wavefront = uRippleTime * uRippleMaxR;
      float d = (rDist - wavefront) / uRippleWidth;
      float band = exp(-d * d * 2.2);                 // slightly broader bell
      float decay = (1.0 - uRippleTime) * (1.0 - uRippleTime);
      float flash = band * decay;
      // High-frequency sparkle flicker along lines within the band
      float sparkle = sin(vLocalXZ.x * 180.0 + vLocalXZ.y * 220.0 + uTime * 22.0) * 0.5 + 0.5;
      float shimmer = flash * (0.85 + sparkle * 0.45);
      // Punchy mix + opacity boost so the shimmer is clearly visible
      col = mix(col, uRippleColor, clamp(shimmer * 2.6, 0.0, 0.92));
      opacity = clamp(opacity + shimmer * 0.55, 0.0, 1.0);
    }

    gl_FragColor = vec4(col, opacity);
  }
`;

function createGridMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uRippleOrigin: { value: new THREE.Vector2(0, 0) },
      uRippleTime: { value: 1.1 },
      uRippleMaxR: { value: 0.30 },
      uRippleWidth: { value: 0.055 },
      uRippleColor: { value: new THREE.Color("#d6ecff") }, // crystal sparkle, not team color
      uInteriorColor: { value: new THREE.Color("#c8922a") },
      uCenterColor: { value: new THREE.Color("#e8bf52") },
      uBorderColor: { value: new THREE.Color("#f0c95e") },
    },
    transparent: true,
    toneMapped: false,
    fog: false,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}

type Props = {
  position?: [number, number, number];
  onReady?: (material: THREE.ShaderMaterial) => void;
};

export default function BoardGrid({ position = [0, 0, 0], onReady }: Props) {
  const { geometry, material } = useMemo(() => {
    const half = SQUARE_SIZE / 2;
    const min = FILE_ORIGIN_X - half;
    const max = FILE_ORIGIN_X + 7 * SQUARE_SIZE + half;
    const zMin = RANK_ORIGIN_Z_WHITE - half;
    const zMax = RANK_ORIGIN_Z_WHITE + 7 * SQUARE_SIZE + half;

    const verts: number[] = [];
    const types: number[] = [];

    for (let i = 0; i <= 8; i++) {
      const t = min + i * SQUARE_SIZE;
      const isBorder = i === 0 || i === 8;
      const isCenter = i === 4;
      const type = isBorder ? 2.0 : isCenter ? 1.0 : 0.0;

      // Horizontal (along X)
      verts.push(min, 0, t, max, 0, t);
      types.push(type, type);

      // Vertical (along Z)
      verts.push(t, 0, zMin, t, 0, zMax);
      types.push(type, type);
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute("lineType", new THREE.Float32BufferAttribute(types, 1));
    return { geometry: g, material: createGridMaterial() };
  }, []);

  useEffect(() => {
    onReady?.(material);
  }, [material, onReady]);

  return (
    // @ts-expect-error three primitive
    <lineSegments geometry={geometry} position={position}>
      <primitive object={material} attach="material" />
    </lineSegments>
  );
}
