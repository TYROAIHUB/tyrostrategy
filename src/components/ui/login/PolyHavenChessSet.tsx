import { useGLTF, useTexture } from "@react-three/drei";
import { useMemo, useLayoutEffect } from "react";
import * as THREE from "three";
import type { GroupProps } from "@react-three/fiber";
import { SQUARE_SIZE, FILE_ORIGIN_X, RANK_ORIGIN_Z_WHITE } from "./ChessMatch";

/**
 * PolyHavenChessSet — CC0 Staunton chess set from Poly Haven.
 *
 * - Applies navy/gold material overrides
 * - Preserves board diff texture for square pattern visibility
 * - Exposes piece Object3D map via `onReady` callback so parent
 *   orchestrator can animate individual pieces
 *
 * Source: https://polyhaven.com/a/chess_set (CC0)
 * Assets: /public/models/chess_set/*
 */

// Use Vite BASE_URL so assets resolve correctly on sub-path deployments
// (e.g., GitHub Pages serves from /tyrostrategy/).
const GLTF_URL = `${import.meta.env.BASE_URL}models/chess_set/chess_set.gltf`;
const BOARD_DIFF_URL = `${import.meta.env.BASE_URL}models/chess_set/textures/chess_set_board_diff_1k.jpg`;

export type PieceRefMap = Record<string, THREE.Object3D>;

type Props = GroupProps & {
  onReady?: (pieces: PieceRefMap, board: THREE.Object3D | null) => void;
};

/* ──────────────────────────────────────────────────────────────
 * Shader injection — vertical 3-stop gradient + thin etched rings.
 * Uses onBeforeCompile so the standard PBR pipeline (lighting,
 * clearcoat, metalness) stays intact; only the diffuse color is
 * remapped. `vPieceLocalY` name avoids clashing with three's own
 * varyings.
 * ────────────────────────────────────────────────────────────── */
function applyLuxuryShader(
  material: THREE.MeshPhysicalMaterial,
  opts: {
    baseColor: THREE.Color;
    midColor: THREE.Color;
    topColor: THREE.Color;
    ringColor: THREE.Color;
    ringStrength: number;
    yMin: number;
    yMax: number;
  },
) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBase = { value: opts.baseColor };
    shader.uniforms.uMid = { value: opts.midColor };
    shader.uniforms.uTop = { value: opts.topColor };
    shader.uniforms.uRing = { value: opts.ringColor };
    shader.uniforms.uRingStr = { value: opts.ringStrength };
    shader.uniforms.uYMin = { value: opts.yMin };
    shader.uniforms.uYMax = { value: opts.yMax };

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        varying float vPieceLocalY;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vPieceLocalY = position.y;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying float vPieceLocalY;
        uniform vec3 uBase;
        uniform vec3 uMid;
        uniform vec3 uTop;
        uniform vec3 uRing;
        uniform float uRingStr;
        uniform float uYMin;
        uniform float uYMax;`,
      )
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        `
        float t = clamp((vPieceLocalY - uYMin) / (uYMax - uYMin), 0.0, 1.0);
        vec3 gradCol = t < 0.55
          ? mix(uBase, uMid, smoothstep(0.0, 0.55, t))
          : mix(uMid, uTop, smoothstep(0.55, 1.0, t));

        float r1 = 1.0 - smoothstep(0.0, 0.010, abs(t - 0.16));
        float r2 = 1.0 - smoothstep(0.0, 0.008, abs(t - 0.34));
        float r3 = 1.0 - smoothstep(0.0, 0.007, abs(t - 0.58));
        float ringMask = max(r1, max(r2 * 0.75, r3 * 0.6)) * uRingStr;

        vec3 finalCol = mix(gradCol, uRing, ringMask);
        vec4 diffuseColor = vec4( finalCol, opacity );`,
      );
  };
  material.needsUpdate = true;
}

/* ──────────────────────────────────────────────────────────────
 * applyRippleShader — piece-move reactive ripple.
 * A gold concentric wave emanates from an origin XZ (set when a
 * piece moves) and expands outward with a decaying pulse band.
 * Uniforms are updated from useFrame in the Scene via
 * material.userData.shader.
 * ────────────────────────────────────────────────────────────── */
function applyRippleShader(material: THREE.MeshPhysicalMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRippleOrigin = { value: new THREE.Vector2(0, 0) };
    shader.uniforms.uRippleTime = { value: 1.1 };       // >1 = idle (no ripple)
    shader.uniforms.uRippleMaxR = { value: 0.28 };      // max wave radius
    shader.uniforms.uRippleWidth = { value: 0.022 };    // thinner band for subtlety
    shader.uniforms.uRippleColor = { value: new THREE.Color("#e0ad3e") };
    shader.uniforms.uRippleStrength = { value: 0.32 };  // softer mix with navy

    // Square tone fill uniforms
    const halfSq = SQUARE_SIZE / 2;
    shader.uniforms.uSqMinX = { value: FILE_ORIGIN_X - halfSq };
    shader.uniforms.uSqMinZ = { value: RANK_ORIGIN_Z_WHITE - halfSq };
    shader.uniforms.uSqSize = { value: SQUARE_SIZE };
    shader.uniforms.uSqDark = { value: new THREE.Color("#0e1f3a") };  // deep navy square
    shader.uniforms.uSqLight = { value: new THREE.Color("#1d3d64") }; // steel navy square
    shader.uniforms.uSqOff = { value: new THREE.Color("#162a48") };   // off-board fallback

    // Breathing glow — ambient life without constant attention
    shader.uniforms.uTime = { value: 0 };

    // Rim ornamentation — repeating Seljuk star motifs with faux bas-relief
    shader.uniforms.uRimInner = { value: 0.247 };
    shader.uniforms.uRimOuter = { value: 0.283 };
    shader.uniforms.uRimTile = { value: 26.0 };
    shader.uniforms.uRimGold = { value: new THREE.Color("#c8922a") };
    shader.uniforms.uRimShadow = { value: new THREE.Color("#0a1628") };

    // Expose the shader for per-frame uniform updates
    material.userData.shader = shader;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec2 vRipplePosXZ;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vRipplePosXZ = position.xz;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec2 vRipplePosXZ;
        uniform vec2 uRippleOrigin;
        uniform float uRippleTime;
        uniform float uRippleMaxR;
        uniform float uRippleWidth;
        uniform vec3 uRippleColor;
        uniform float uRippleStrength;
        uniform float uSqMinX;
        uniform float uSqMinZ;
        uniform float uSqSize;
        uniform vec3 uSqDark;
        uniform vec3 uSqLight;
        uniform vec3 uSqOff;
        uniform float uTime;
        uniform float uRimInner;
        uniform float uRimOuter;
        uniform float uRimTile;
        uniform vec3 uRimGold;
        uniform vec3 uRimShadow;

        // Hash + noise + fbm for contour elevation
        float cHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float cNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(cHash(i), cHash(i + vec2(1.0, 0.0)), u.x),
            mix(cHash(i + vec2(0.0, 1.0)), cHash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }
        float cFbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 3; i++) {
            v += a * cNoise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }`,
      )
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        `
        // ── Premium alternating tone fill with per-square chiaroscuro ──
        vec2 boardLocal = vec2(
          (vRipplePosXZ.x - uSqMinX) / uSqSize,
          (vRipplePosXZ.y - uSqMinZ) / uSqSize
        );
        bool onBoard = boardLocal.x >= 0.0 && boardLocal.x < 8.0 &&
                       boardLocal.y >= 0.0 && boardLocal.y < 8.0;

        // zoneAlpha — rim is translucent glass, inner board is opaque
        float zoneAlpha = 1.0;
        vec3 squareColor;
        if (onBoard) {
          vec2 sqIdx = floor(boardLocal);
          bool isDark = mod(sqIdx.x + sqIdx.y, 2.0) < 0.5;
          squareColor = isDark ? uSqDark : uSqLight;

          // Breathing glow — opposing phase between dark/light squares
          // 4s period, amplitude 0.15 (now actually visible on dark tones).
          float phase = isDark ? 0.0 : 3.14159;
          float breath = sin(uTime * 1.5708 + phase) * 0.15;
          squareColor *= 1.0 + breath;

          // Per-square inner vignette — sinks edges for "pressed" depth
          vec2 sqUV = fract(boardLocal);
          vec2 ed = min(sqUV, vec2(1.0) - sqUV);
          float vig = smoothstep(0.0, 0.28, min(ed.x, ed.y));
          squareColor *= 0.82 + vig * 0.18;

          // Diagonal chiaroscuro — simulates ambient key light from upper-left
          float keyLight = sqUV.x * 0.5 + (1.0 - sqUV.y) * 0.5;
          squareColor *= 0.93 + keyLight * 0.10;

          // Strategic zone warm — e4/d4/e5/d5 central squares subtly warmer
          float cDist = length(vRipplePosXZ);
          float centerGlow = 1.0 - smoothstep(0.03, 0.11, cDist);
          squareColor += vec3(0.018, 0.013, 0.004) * centerGlow;

          // Faint micro-noise for surface grit (premium matte feel)
          float grain = fract(sin(dot(vRipplePosXZ * 180.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
          squareColor += grain * 0.012;

          // ─── Single Seljuk 8-point star spanning d4/d5/e4/e5 ───
          // Board origin is the shared corner of these four squares, so
          // each central square renders one quadrant of the motif.
          // Together the four quadrants assemble into one full star.
          vec2 motifUV = vRipplePosXZ / uSqSize;   // ±1 across the 2x2 center region
          if (abs(motifUV.x) < 1.0 && abs(motifUV.y) < 1.0) {
            float sqA = max(abs(motifUV.x), abs(motifUV.y));
            vec2 rotP = vec2(
              (motifUV.x + motifUV.y) * 0.7071,
              (motifUV.y - motifUV.x) * 0.7071
            );
            float sqB = max(abs(rotP.x), abs(rotP.y));
            float starShape = min(sqA, sqB);
            // Thin gold inlay outline ring at the star perimeter
            float edgeDist = abs(starShape - 0.68);
            float outline = 1.0 - smoothstep(0.0, 0.022, edgeDist);
            // Soft fill inside the star
            float fill = 1.0 - smoothstep(0.66, 0.70, starShape);
            vec3 motifGold = vec3(0.784, 0.573, 0.165);   // #c8922a
            vec3 motifBright = vec3(0.94, 0.78, 0.33);    // highlight gold
            squareColor = mix(squareColor, motifGold, fill * 0.14);
            squareColor = mix(squareColor, motifBright, outline * 0.55);
          }

        } else {
          // Off-board: solid navy, no ornament
          squareColor = uSqOff;
        }

        vec4 diffuseColor = vec4(squareColor, zoneAlpha * opacity);

        // ── Ripple overlay on top of squares ──
        if (uRippleTime >= 0.0 && uRippleTime <= 1.0) {
          float rDist = length(vRipplePosXZ - uRippleOrigin);
          float wavefront = uRippleTime * uRippleMaxR;
          float d = (rDist - wavefront) / uRippleWidth;
          float band = exp(-d * d * 2.5);
          float decay = (1.0 - uRippleTime) * (1.0 - uRippleTime);
          float outward = smoothstep(0.0, 0.02, rDist);
          float ripple = band * decay * outward * uRippleStrength;
          diffuseColor.rgb = mix(diffuseColor.rgb, uRippleColor, ripple);
        }`,
      );
  };
  material.needsUpdate = true;
}

export default function PolyHavenChessSet({ onReady, ...groupProps }: Props) {
  const gltf = useGLTF(GLTF_URL);
  const boardDiff = useTexture(BOARD_DIFF_URL);

  /* ── Configure board texture ── */
  useLayoutEffect(() => {
    if (!boardDiff) return;
    boardDiff.colorSpace = THREE.SRGBColorSpace;
    boardDiff.wrapS = THREE.RepeatWrapping;
    boardDiff.wrapT = THREE.RepeatWrapping;
    boardDiff.needsUpdate = true;
  }, [boardDiff]);

  /* ── Gold pieces — champagne bronze, museum-polished ── */
  const goldMaterial = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: "#b88838",
      roughness: 0.22,
      metalness: 1.0,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      emissive: new THREE.Color("#5a3d0f"),
      emissiveIntensity: 0.1,
    });
    applyLuxuryShader(m, {
      baseColor: new THREE.Color("#3d2a0a"),
      midColor:  new THREE.Color("#8a6a2e"),
      topColor:  new THREE.Color("#d4b065"),
      ringColor: new THREE.Color("#0a1a38"),
      ringStrength: 0.8,
      yMin: 0.0,
      yMax: 0.1,
    });
    return m;
  }, []);

  /* ── Navy pieces — deep ink porcelain, lacquered ── */
  const navyMaterial = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: "#132a50",
      roughness: 0.15,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      ior: 1.6,
      reflectivity: 0.6,
      sheen: 0.3,
      sheenRoughness: 0.4,
      sheenColor: new THREE.Color("#3a5a8c"),
      emissive: new THREE.Color("#0a1e38"),
      emissiveIntensity: 0.08,
    });
    applyLuxuryShader(m, {
      baseColor: new THREE.Color("#050e1e"),
      midColor:  new THREE.Color("#11284a"),
      topColor:  new THREE.Color("#2b4f82"),
      ringColor: new THREE.Color("#b88838"),
      ringStrength: 0.85,
      yMin: 0.0,
      yMax: 0.1,
    });
    return m;
  }, []);

  /* ── Board — solid navy marble ── */
  const boardMaterial = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#1c3152"),
      roughness: 0.35,
      metalness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.12,
    });
    applyRippleShader(m);
    return m;
  }, []);

  /* ── Traverse scene, apply materials, collect piece refs ── */
  useLayoutEffect(() => {
    if (!gltf.scene) return;

    const pieces: PieceRefMap = {};
    let board: THREE.Object3D | null = null;

    gltf.scene.traverse((obj) => {
      if (obj.name.startsWith("piece_")) {
        pieces[obj.name] = obj;
      }
      if (obj.name === "board") {
        board = obj;
      }

      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;

        const mat = obj.material as THREE.Material | THREE.Material[];
        const matName = Array.isArray(mat) ? mat[0]?.name : mat?.name;

        if (matName === "chess_set_pieces_white") {
          obj.material = goldMaterial;
        } else if (matName === "chess_set_pieces_black") {
          obj.material = navyMaterial;
        } else if (matName === "chess_set_board") {
          obj.material = boardMaterial;
        }
      }
    });

    onReady?.(pieces, board);
  }, [gltf.scene, goldMaterial, navyMaterial, boardMaterial, onReady]);

  return <primitive object={gltf.scene} {...groupProps} />;
}

useGLTF.preload(GLTF_URL);
useTexture.preload(BOARD_DIFF_URL);
