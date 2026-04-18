/**
 * ChessMatch — square ↔ world coordinate helpers + choreographed match sequences
 * for the TYROStrategy login scene.
 *
 * The Poly Haven chess set uses:
 *   - square size 0.05789 unit
 *   - board center at world (0,0,0)
 *   - white back rank (a1..h1) at z=-0.2026, file "a" at x=-0.2026
 *   - black back rank (a8..h8) at z=+0.2019 (slight asymmetry in model)
 *   - pieces rest at y=0.01739
 */

export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type Square = { file: File; rank: Rank };

export type FeatureIconId = "target" | "chart" | "network" | "clock" | "shield";

export type Move = {
  id: string;
  pieceName: string;
  to: Square;
  startTime: number;
  duration: number;
  feature?: { i18nKey: string; iconId: FeatureIconId };
  capture?: string;
};

export const SQUARE_SIZE = 0.05789;
export const FILE_ORIGIN_X = -0.20260828733444214;
export const RANK_ORIGIN_Z_WHITE = -0.20260828733444214;
export const PIECE_Y = 0.017392655834555626;

const FILES: File[] = ["a", "b", "c", "d", "e", "f", "g", "h"];

/**
 * Convert a chess square to world coordinates.
 * Rank 1 = z=-0.2026 (white back rank), rank 8 = z=+0.2019 (black back rank).
 */
export function squareToWorld(sq: Square): [number, number, number] {
  const fileIdx = FILES.indexOf(sq.file);
  const x = FILE_ORIGIN_X + fileIdx * SQUARE_SIZE;
  const z = RANK_ORIGIN_Z_WHITE + (sq.rank - 1) * SQUARE_SIZE;
  return [x, PIECE_Y, z];
}

/**
 * Opening match sequence — Italian-ish opening, 6 moves over ~14s.
 * First move (m1) has no feature card (it's the "curtain open" move).
 * Moves m2-m6 each reveal a feature.
 */
export const MATCH: Move[] = [
  // m1: White e-pawn opens (piece_pawn_white_04 sits at e2, moves to e4)
  {
    id: "m1",
    pieceName: "piece_pawn_white_04",
    to: { file: "e", rank: 4 },
    startTime: 0.6,
    duration: 0.9,
  },
  // m2: Black e-pawn responds (piece_pawn_black_04 at e7 → e5)
  {
    id: "m2",
    pieceName: "piece_pawn_black_04",
    to: { file: "e", rank: 5 },
    startTime: 2.6,
    duration: 0.9,
    feature: { i18nKey: "login.revealedFeature.planning", iconId: "target" },
  },
  // m3: White knight develops (piece_knight_white_02 at g1 → f3)
  {
    id: "m3",
    pieceName: "piece_knight_white_02",
    to: { file: "f", rank: 3 },
    startTime: 5.0,
    duration: 1.0,
    feature: { i18nKey: "login.revealedFeature.kpi", iconId: "chart" },
  },
  // m4: Black knight develops (piece_knight_black_01 at b8 → c6)
  {
    id: "m4",
    pieceName: "piece_knight_black_01",
    to: { file: "c", rank: 6 },
    startTime: 7.6,
    duration: 1.0,
    feature: { i18nKey: "login.revealedFeature.strategyMap", iconId: "network" },
  },
  // m5: White bishop (piece_bishop_white_02 at f1 → c4)
  {
    id: "m5",
    pieceName: "piece_bishop_white_02",
    to: { file: "c", rank: 4 },
    startTime: 10.2,
    duration: 1.0,
    feature: { i18nKey: "login.revealedFeature.gantt", iconId: "clock" },
  },
  // m6: Black d-pawn (piece_pawn_black_03 at d7 → d6)
  {
    id: "m6",
    pieceName: "piece_pawn_black_03",
    to: { file: "d", rank: 6 },
    startTime: 12.6,
    duration: 0.8,
    feature: { i18nKey: "login.revealedFeature.security", iconId: "shield" },
  },
];

/**
 * Checkmate finale — Scholar's Mate style (Queen + Bishop on f7).
 * Triggered by portal button click. Starts fresh from current piece positions.
 * Timing relative to intro start (t=0 when portal clicked).
 */
export const CHECKMATE_SEQUENCE: Move[] = [
  // Queen emerges from d1 (or wherever she is) to h5
  {
    id: "c1",
    pieceName: "piece_queen_white",
    to: { file: "h", rank: 5 },
    startTime: 0.15,
    duration: 0.55,
  },
  // Queen strikes f7 (if bishop already at c4 from m5, this is mate)
  {
    id: "c2",
    pieceName: "piece_queen_white",
    to: { file: "f", rank: 7 },
    startTime: 0.85,
    duration: 0.65,
    capture: "piece_pawn_black_06",
  },
];

/**
 * Match duration helpers (for restart logic)
 */
export function lastMoveEndTime(moves: Move[]): number {
  if (moves.length === 0) return 0;
  const last = moves[moves.length - 1];
  return last.startTime + last.duration;
}

/** Time of portal button reveal (after first move finishes) */
export const PORTAL_REVEAL_TIME = MATCH[0].startTime + MATCH[0].duration + 0.15;
