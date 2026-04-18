import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import {
  MATCH,
  CHECKMATE_SEQUENCE,
  squareToWorld,
  PIECE_Y,
  PORTAL_REVEAL_TIME,
  lastMoveEndTime,
  type Move,
} from "./ChessMatch";
import type { PieceRefMap } from "./PolyHavenChessSet";

/**
 * MatchOrchestrator — drives piece animations for the login scene.
 *
 * Modes:
 *  - "match": runs the opening sequence (MATCH), loops after completion
 *  - "checkmate": runs the CHECKMATE_SEQUENCE (Scholar's Mate) once
 *  - "idle": frozen at current positions
 *
 * Events:
 *  - onPortalReveal fires once at PORTAL_REVEAL_TIME during match mode
 *  - onMoveComplete fires when each move finishes (used for feature cards)
 */

type Mode = "idle" | "match" | "checkmate";

type Props = {
  pieces: PieceRefMap;
  mode: Mode;
  onPortalReveal?: () => void;
  onMoveComplete?: (move: Move, worldPos: [number, number, number]) => void;
};

export default function MatchOrchestrator({
  pieces,
  mode,
  onPortalReveal,
  onMoveComplete,
}: Props) {
  const startTimeRef = useRef<number | null>(null);
  const portalFiredRef = useRef(false);
  const completedMovesRef = useRef<Set<string>>(new Set());
  const originalPositionsRef = useRef<Map<string, [number, number, number]>>(new Map());
  const prevModeRef = useRef<Mode>("idle");

  // Capture original piece positions once when pieces map is ready
  useEffect(() => {
    if (Object.keys(pieces).length === 0) return;
    Object.entries(pieces).forEach(([name, obj]) => {
      if (!originalPositionsRef.current.has(name)) {
        originalPositionsRef.current.set(name, [
          obj.position.x,
          obj.position.y,
          obj.position.z,
        ]);
      }
    });
  }, [pieces]);

  // Reset orchestrator state when mode changes
  useEffect(() => {
    if (prevModeRef.current === mode) return;
    prevModeRef.current = mode;

    startTimeRef.current = null;
    completedMovesRef.current = new Set();
    portalFiredRef.current = mode !== "match" ? true : false;
  }, [mode]);

  useFrame(() => {
    if (mode === "idle") return;
    if (Object.keys(pieces).length === 0) return;
    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now() / 1000;
    }

    const elapsed = performance.now() / 1000 - startTimeRef.current;
    const sequence = mode === "checkmate" ? CHECKMATE_SEQUENCE : MATCH;

    // Fire portal reveal once
    if (mode === "match" && !portalFiredRef.current && elapsed >= PORTAL_REVEAL_TIME) {
      portalFiredRef.current = true;
      onPortalReveal?.();
    }

    // Apply each move
    sequence.forEach((move) => {
      const piece = pieces[move.pieceName];
      if (!piece) return;

      const t = elapsed - move.startTime;
      if (t < 0) return; // not yet

      const origin = originalPositionsRef.current.get(move.pieceName);
      if (!origin) return;

      const to = squareToWorld(move.to);

      if (t >= move.duration) {
        // Snap to final position
        piece.position.set(to[0], PIECE_Y, to[2]);

        // Capture fade out
        if (move.capture) {
          const captured = pieces[move.capture];
          if (captured) {
            // Sink below board (fade-out alternative without material opacity)
            captured.position.y = PIECE_Y - 0.03 - Math.min((t - move.duration) * 0.04, 0.1);
            captured.visible = t - move.duration > 2.0 ? false : true;
          }
        }

        // Emit move-complete once
        if (!completedMovesRef.current.has(move.id)) {
          completedMovesRef.current.add(move.id);
          onMoveComplete?.(move, to);
        }
        return;
      }

      // Lerp during move
      const p = t / move.duration;
      const eased = 1 - Math.pow(1 - p, 3);
      const fromX = (() => {
        // Always lerp FROM original (not current), so restart works
        const current = piece.userData.moveOriginX;
        if (current !== undefined) return current;
        piece.userData.moveOriginX = piece.position.x;
        piece.userData.moveOriginZ = piece.position.z;
        return piece.position.x;
      })();
      const fromZ = piece.userData.moveOriginZ as number;

      piece.position.x = fromX + (to[0] - fromX) * eased;
      piece.position.z = fromZ + (to[2] - fromZ) * eased;
      piece.position.y = PIECE_Y + Math.sin(eased * Math.PI) * 0.025;
    });

    // Match loop — restart after last move + 5s hold
    if (mode === "match") {
      const endTime = lastMoveEndTime(MATCH) + 5.0;
      if (elapsed > endTime) {
        // Reset pieces to original positions
        Object.entries(pieces).forEach(([name, piece]) => {
          const orig = originalPositionsRef.current.get(name);
          if (orig) {
            piece.position.set(orig[0], orig[1], orig[2]);
            piece.visible = true;
          }
          piece.userData.moveOriginX = undefined;
          piece.userData.moveOriginZ = undefined;
        });
        startTimeRef.current = performance.now() / 1000;
        completedMovesRef.current = new Set();
      }
    }
  });

  return null;
}
