import * as THREE from "three";

/**
 * Chess piece lathe profiles — hand-tuned Staunton-inspired silhouettes.
 *
 * Each profile is an array of [x, y] points that will be revolved around the Y-axis.
 * x = radius at that height, y = height from base.
 * Points must be ordered bottom-to-top with ascending y.
 *
 * Unit scale: 1 unit = 1 chessboard square. Pieces sit within ~0.5u diameter.
 */

export type ProfilePoints = ReadonlyArray<readonly [number, number]>;

/* ── PAWN — 0.52u tall, simple orb atop tapered stem ──────────────── */
export const PAWN_PROFILE: ProfilePoints = [
  [0.20, 0.00], [0.22, 0.015], [0.22, 0.04],
  [0.20, 0.06], [0.18, 0.08],
  [0.095, 0.10], [0.085, 0.14], [0.095, 0.18],
  [0.10, 0.28], [0.075, 0.34], [0.07, 0.36],
  [0.13, 0.38], [0.15, 0.42], [0.145, 0.46],
  [0.11, 0.50], [0.06, 0.52], [0.00, 0.52],
];

/* ── ROOK — 0.65u tall, straight cylindrical castle body ──────────── */
export const ROOK_PROFILE: ProfilePoints = [
  [0.21, 0.00], [0.23, 0.02], [0.23, 0.05],
  [0.21, 0.07], [0.18, 0.09],
  [0.13, 0.11], [0.12, 0.14], [0.13, 0.18],
  [0.145, 0.28], [0.15, 0.48],
  [0.17, 0.52], [0.20, 0.54], [0.20, 0.58],
  [0.18, 0.60], [0.18, 0.63], [0.18, 0.65],
];

/* ── BISHOP — 0.78u tall, ovoid miter head on tapered stem ────────── */
export const BISHOP_PROFILE: ProfilePoints = [
  [0.20, 0.00], [0.22, 0.02], [0.22, 0.05],
  [0.20, 0.07], [0.17, 0.09],
  [0.10, 0.11], [0.09, 0.15], [0.10, 0.20],
  [0.11, 0.34], [0.08, 0.42],
  [0.125, 0.45], [0.15, 0.48], [0.145, 0.52],
  [0.13, 0.58], [0.14, 0.62], [0.13, 0.66],
  [0.11, 0.70], [0.08, 0.74], [0.04, 0.77], [0.00, 0.78],
];

/* ── QUEEN — 0.88u tall, elegant stem with ball finial ────────────── */
export const QUEEN_PROFILE: ProfilePoints = [
  [0.22, 0.00], [0.24, 0.02], [0.24, 0.05],
  [0.22, 0.07], [0.19, 0.09],
  [0.12, 0.11], [0.11, 0.15], [0.12, 0.22],
  [0.125, 0.38], [0.11, 0.46], [0.095, 0.50],
  [0.15, 0.54], [0.17, 0.57], [0.165, 0.60],
  [0.14, 0.63], [0.12, 0.66], [0.10, 0.70],
  [0.13, 0.74], [0.14, 0.78], [0.12, 0.82],
  [0.08, 0.86], [0.00, 0.88],
];

/* ── KING — 0.95u tall, regal dual-collar stem (crown cross added as separate mesh) ─── */
export const KING_PROFILE: ProfilePoints = [
  [0.23, 0.00], [0.25, 0.02], [0.25, 0.05],
  [0.23, 0.07], [0.20, 0.09],
  [0.13, 0.11], [0.12, 0.16], [0.135, 0.22],
  [0.14, 0.42], [0.12, 0.50], [0.105, 0.54],
  [0.16, 0.58], [0.18, 0.61], [0.175, 0.64],
  [0.14, 0.67], [0.12, 0.70], [0.14, 0.73],
  [0.16, 0.76], [0.17, 0.80], [0.16, 0.84],
  [0.13, 0.87], [0.09, 0.90], [0.00, 0.92],
];

/* ═══════════════════════════════════════════════════════════════════
 * KNIGHT — ExtrudeGeometry from 2D horse silhouette
 * ═══════════════════════════════════════════════════════════════════
 *
 * The horse head is carved to face +X direction (viewer's right when navy team).
 * Traced from classical Staunton knight side profile, simplified to ~24 points.
 * Total height ~0.73u, horizontal depth ~0.28u, extrusion depth 0.16u.
 */
export function buildKnightShape(): THREE.Shape {
  const shape = new THREE.Shape();
  // Start at front of base, trace counter-clockwise around the horse silhouette.
  shape.moveTo(-0.21, 0.00);                  // bottom-left of base
  shape.lineTo(0.21, 0.00);                   // bottom-right
  shape.lineTo(0.23, 0.03);                   // base flare up-right
  shape.lineTo(0.20, 0.08);                   // base shoulder
  shape.lineTo(0.16, 0.10);                   // stem collar
  shape.lineTo(0.14, 0.18);                   // neck base
  shape.bezierCurveTo(0.12, 0.28, 0.22, 0.38, 0.24, 0.50); // front of neck
  shape.lineTo(0.23, 0.56);                   // under chin
  shape.bezierCurveTo(0.18, 0.58, 0.13, 0.58, 0.08, 0.60); // jaw curve to snout
  shape.lineTo(0.02, 0.62);                   // snout tip
  shape.lineTo(-0.04, 0.64);                  // nose tip
  shape.lineTo(-0.06, 0.68);                  // nose bridge
  shape.lineTo(-0.02, 0.71);                  // forehead curve start
  shape.bezierCurveTo(0.02, 0.75, 0.06, 0.76, 0.08, 0.73); // forehead top
  shape.lineTo(0.06, 0.70);                   // into ears
  shape.lineTo(0.04, 0.73);                   // ear valley
  shape.lineTo(0.00, 0.78);                   // left ear tip
  shape.lineTo(-0.06, 0.76);                  // back of ear
  shape.lineTo(-0.10, 0.70);                  // back of head
  shape.bezierCurveTo(-0.14, 0.64, -0.18, 0.58, -0.20, 0.50); // mane curve
  shape.lineTo(-0.22, 0.40);                  // back of neck
  shape.lineTo(-0.20, 0.28);                  // neck base back
  shape.lineTo(-0.16, 0.18);                  // stem collar back
  shape.lineTo(-0.18, 0.10);                  // base shoulder back
  shape.lineTo(-0.23, 0.03);                  // base flare
  shape.lineTo(-0.21, 0.00);                  // close
  return shape;
}

/* ── Crown cross dimensions (King finial) ── */
export const KING_CROSS = {
  vertical: { width: 0.035, height: 0.09, depth: 0.035, yOffset: 0.96 },
  horizontal: { width: 0.08, height: 0.03, depth: 0.035, yOffset: 0.975 },
} as const;

/* ── Rook crenellations — instanced rim blocks ── */
export const ROOK_CRENELLATIONS = {
  count: 6,
  size: { w: 0.05, h: 0.04, d: 0.08 },
  radius: 0.16,
  yOffset: 0.67,
} as const;

/* ── Bishop miter slot — dark marker embedded in head ── */
export const BISHOP_SLOT = {
  size: { w: 0.015, h: 0.08, d: 0.12 },
  yOffset: 0.68,
} as const;

/* ── Staunton proportions summary (for reference) ── */
export const PIECE_HEIGHTS = {
  pawn: 0.52,
  rook: 0.65,
  bishop: 0.78,
  knight: 0.73,
  queen: 0.88,
  king: 0.95,
} as const;

/* Helper: convert [number, number][] to THREE.Vector2[] */
export function toVec2Array(points: ProfilePoints): THREE.Vector2[] {
  return points.map(([x, y]) => new THREE.Vector2(x, y));
}
