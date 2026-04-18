/**
 * IntroPhase — state machine for cinematic login intro.
 *
 * Timing (TYROWMS parity):
 *   idle  → click on portal button → p1
 *   p1    (100ms)  gold glow intensifies
 *   p2    (800ms)  vignette fade-in, left panel slides out, button scales
 *   p2b   (1000ms) typewriter TYROVERSE reveals
 *   p3    (1800ms) button implodes, portal rings contract
 *   p4    (2000ms) dissolve blur + grain overlay
 *   p5    (2500ms) camera zooms to gold king crown, desaturate
 *   p6    (2800ms) gold flash (2-stage white spike → gold bloom)
 *   auth  (3500ms) msalLogin() triggered, "verifying" status shown
 */
export type IntroPhase =
  | "idle"
  | "p1"
  | "p2"
  | "p2b"
  | "p3"
  | "p4"
  | "p5"
  | "p6"
  | "auth";

/** Checks if intro is actively animating (any non-idle phase). */
export function isAnimating(phase: IntroPhase): boolean {
  return phase !== "idle";
}

/** Phase → approximate elapsed ms since start. For debug/diagnostics. */
export const PHASE_TIMING: Record<IntroPhase, number> = {
  idle: 0,
  p1: 100,
  p2: 800,
  p2b: 1000,
  p3: 1800,
  p4: 2000,
  p5: 2500,
  p6: 2800,
  auth: 3500,
};
