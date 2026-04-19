import { useGLTF } from "@react-three/drei";
import { useMemo, useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PieceRefMap } from "./PolyHavenChessSet";
import type { IntroPhase } from "./introPhases";

/**
 * KingHero — premium Sketchfab king (Csaba Baity, CC-BY-4.0) overlaid
 * on the PH king pieces. One instance per team (gold / navy).
 *
 * Modes driven by `phase`:
 *   - idle/p1/p2/p2b  → Match mode: follows the PH team's king piece
 *   - p3/p4           → Checkmate move (WHITE only): glides toward the
 *                        center of the board as the "final blow"
 *   - p5/p6/auth      → Hero mode (WHITE only): lerps to board center,
 *                        scales up, slow Y-rotation, emissive pulse
 *
 * Navy king stays in its square and gently recedes during p5+ so the
 * gold king takes the hero spotlight.
 */

const HERO_URL = `${import.meta.env.BASE_URL}models/king_hero/scene.gltf`;

// Post Sketchfab internal matrix, model is ~0.3 tall (upright). These
// scales are the multiplier ON TOP of the internal 0.000757 scale.
const MATCH_SCALE = 0.22;    // ~66mm tall  (noticeably bigger than PH king)
const HERO_SCALE  = 0.85;    // dramatic ~4× for finale

// Attack target during the checkmate move (white king charges toward here)
const CHECKMATE_TARGET = new THREE.Vector3(0.14, 0.017, 0);  // board center (world)

type Team = "white" | "black";

type Props = {
  team: Team;
  pieces: PieceRefMap;
  phase: IntroPhase;
};

function makeGoldMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: "#b88838",
    metalness: 1.0,
    roughness: 0.28,
    clearcoat: 0.7,
    clearcoatRoughness: 0.14,
    emissive: new THREE.Color("#5a3d0f"),
    emissiveIntensity: 0.12,
  });
}

function makeNavyMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: "#132a50",
    metalness: 0.08,
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    emissive: new THREE.Color("#0a1e38"),
    emissiveIntensity: 0.1,
  });
}

export default function KingHero({ team, pieces, phase }: Props) {
  const gltf = useGLTF(HERO_URL);
  const outerRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const currentScaleRef = useRef(MATCH_SCALE);
  const heroSpinRef = useRef(0);

  // One material instance per team (don't share — each is unique)
  const material = useMemo(
    () => (team === "white" ? makeGoldMaterial() : makeNavyMaterial()),
    [team],
  );

  // Clone the scene per-instance so two <KingHero> share geometry but
  // not per-instance transforms / materials.
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useLayoutEffect(() => {
    clonedScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.material = material;
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [clonedScene, material]);

  const pieceKey = team === "white" ? "piece_king_white" : "piece_king_black";
  const isWhite = team === "white";
  // Each king faces toward its opponent across the board.
  // White (rank 1, -Z) faces +Z → rotation 0.
  // Black (rank 8, +Z) faces -Z → rotation π.
  const teamFacing = isWhite ? 0 : Math.PI;

  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const lerpTarget = useMemo(() => new THREE.Vector3(), []);

  // Apply the team-facing rotation once to the outer group
  useLayoutEffect(() => {
    if (outerRef.current) outerRef.current.rotation.y = teamFacing;
  }, [teamFacing]);

  useFrame((s) => {
    if (!outerRef.current || !innerRef.current) return;
    const t = s.clock.elapsedTime;

    const phk = pieces[pieceKey];
    if (phk) phk.visible = false;

    const isCheckmateMoving = isWhite && (phase === "p3" || phase === "p4");
    const isHeroMode = isWhite && (phase === "p5" || phase === "p6" || phase === "auth");
    const isNavyRecede = !isWhite && (phase === "p5" || phase === "p6" || phase === "auth");

    if (isHeroMode) {
      // ── HERO: gold king takes stage ──
      lerpTarget.set(0.14, 0.02, 0);  // board center world, slightly elevated
      outerRef.current.position.lerp(lerpTarget, 0.06);
      // outer rotation stays at teamFacing so spin is on inner only
      currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, HERO_SCALE, 0.06);
      outerRef.current.scale.setScalar(currentScaleRef.current);
      heroSpinRef.current = t * 0.25;
      innerRef.current.rotation.set(0, heroSpinRef.current, 0);
      material.emissiveIntensity = 0.35 + Math.sin(t * 2.8) * 0.45;
    } else if (isCheckmateMoving) {
      // ── CHECKMATE CHARGE: white king advances to board center ──
      outerRef.current.position.lerp(CHECKMATE_TARGET, 0.08);
      currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, MATCH_SCALE * 1.15, 0.1);
      outerRef.current.scale.setScalar(currentScaleRef.current);
      heroSpinRef.current = THREE.MathUtils.lerp(heroSpinRef.current, 0, 0.12);
      innerRef.current.rotation.set(0, heroSpinRef.current, 0);
      // Glowing intent — king is charging
      material.emissiveIntensity = 0.28 + Math.sin(t * 4.0) * 0.18;
    } else if (isNavyRecede) {
      // ── NAVY KING falls back during gold hero shot ──
      if (phk) {
        phk.getWorldPosition(worldPos);
        outerRef.current.position.lerp(worldPos, 0.2);
      }
      currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, MATCH_SCALE * 0.85, 0.08);
      outerRef.current.scale.setScalar(currentScaleRef.current);
      // Tilt navy king slightly forward as if falling
      innerRef.current.rotation.x = THREE.MathUtils.lerp(
        innerRef.current.rotation.x,
        -0.35,
        0.05,
      );
      material.emissiveIntensity = 0.05;
    } else {
      // ── MATCH MODE: track the PH king (world coords only — keep team facing) ──
      if (phk) {
        phk.getWorldPosition(worldPos);
        outerRef.current.position.lerp(worldPos, 0.35);
      }
      currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, MATCH_SCALE, 0.1);
      outerRef.current.scale.setScalar(currentScaleRef.current);
      heroSpinRef.current = THREE.MathUtils.lerp(heroSpinRef.current, 0, 0.12);
      innerRef.current.rotation.set(0, heroSpinRef.current, 0);
      material.emissiveIntensity = isWhite ? 0.12 : 0.1;
    }
  });

  // Plinth size (in the inner model's post-Sketchfab-matrix scale, where
  // 1 unit ≈ 1.32m). The king base sits at y=0 there.
  const plinthColor = isWhite ? "#8a6518" : "#0a1628";
  const plinthTop = isWhite ? "#c8922a" : "#132a50";

  // Throne-style plinth — slim vertical column with a wider base flange
  // and a polished capital. All dimensions in inner coord space; the
  // outer scale multiplies these down to scene units.
  const PLINTH_LIFT = 0.003;
  const PLINTH_FOOT = 0.010;           // wide base flange (throne foot)
  const PLINTH_COLUMN = 0.055;         // slim column body (throne shaft)
  const PLINTH_BELT = 0.006;           // accent belt ring
  const PLINTH_CAP = 0.010;            // polished top cap
  const PLINTH_TOP =
    PLINTH_LIFT + PLINTH_FOOT + PLINTH_COLUMN + PLINTH_BELT + PLINTH_CAP;

  // Colors pulled from applyLuxuryShader stops on the matching piece team
  const bodyColor = isWhite ? "#6a4e20" : "#0d1f3d";
  const beltColor = isWhite ? "#3d2a0a" : "#050e1e";
  const capColor  = isWhite ? "#c4a060" : "#2a4972";

  // Y offsets (each layer sits atop the previous)
  const footY   = PLINTH_LIFT + PLINTH_FOOT / 2;
  const colY    = PLINTH_LIFT + PLINTH_FOOT + PLINTH_COLUMN / 2;
  const beltY   = PLINTH_LIFT + PLINTH_FOOT + PLINTH_COLUMN + PLINTH_BELT / 2;
  const capY    = PLINTH_LIFT + PLINTH_FOOT + PLINTH_COLUMN + PLINTH_BELT + PLINTH_CAP / 2;

  return (
    <group ref={outerRef}>
      <group ref={innerRef}>
        {/* 1. Base foot — widest flange, throne foot */}
        <mesh position={[0, footY, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.105, 0.112, PLINTH_FOOT, 48]} />
          <meshPhysicalMaterial
            color={bodyColor}
            metalness={isWhite ? 0.85 : 0.08}
            roughness={0.36}
            clearcoat={isWhite ? 0.45 : 0.9}
            clearcoatRoughness={0.2}
            emissive={new THREE.Color(isWhite ? "#4a3510" : "#061226")}
            emissiveIntensity={0.08}
          />
        </mesh>

        {/* 2. Slim column — main vertical shaft (throne style) */}
        <mesh position={[0, colY, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.072, 0.082, PLINTH_COLUMN, 48]} />
          <meshPhysicalMaterial
            color={bodyColor}
            metalness={isWhite ? 0.88 : 0.08}
            roughness={0.3}
            clearcoat={isWhite ? 0.6 : 0.95}
            clearcoatRoughness={isWhite ? 0.18 : 0.08}
            emissive={new THREE.Color(isWhite ? "#4a3510" : "#061226")}
            emissiveIntensity={0.1}
          />
        </mesh>

        {/* 3. Accent belt ring — recessed etched-ring echo */}
        <mesh position={[0, beltY, 0]} castShadow>
          <cylinderGeometry args={[0.070, 0.072, PLINTH_BELT, 48]} />
          <meshPhysicalMaterial
            color={beltColor}
            metalness={isWhite ? 0.6 : 0.1}
            roughness={0.45}
            clearcoat={0.3}
          />
        </mesh>

        {/* 4. Polished capital — king base sits on this */}
        <mesh position={[0, capY, 0]} castShadow>
          <cylinderGeometry args={[0.086, 0.076, PLINTH_CAP, 48]} />
          <meshPhysicalMaterial
            color={capColor}
            metalness={isWhite ? 1.0 : 0.22}
            roughness={0.2}
            clearcoat={0.85}
            clearcoatRoughness={0.08}
            emissive={new THREE.Color(isWhite ? "#7a5420" : "#11284a")}
            emissiveIntensity={isWhite ? 0.28 : 0.2}
          />
        </mesh>

        {/* King perched on the throne capital */}
        <group position={[0, PLINTH_TOP, 0]}>
          <primitive object={clonedScene} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(HERO_URL);
