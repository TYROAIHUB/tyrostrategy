import { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * Cascading Constellation — Strategy cascading visualization for login background.
 *
 * Visualizes the strategy hierarchy:
 *   Vision → Pillars → Objectives → Key Results → Actions
 *
 * Palette: Tiryaki navy + gold.
 * Light/dark theme aware.
 */

type Node = {
  id: string;
  level: 0 | 1 | 2 | 3 | 4;
  x: number; // 0-100 (percentage of viewBox width)
  y: number; // 0-100
  parentId?: string;
  r: number; // radius
};

/* ── Deterministic layout ───────────────────────────────────────
 * Hand-crafted positions so the constellation always looks balanced.
 * Vision at top, actions at bottom — 5 hierarchical levels.
 */
const LEVELS = {
  vision:     { y: 12, count: 1,  r: 3.2 },
  pillars:    { y: 30, count: 3,  r: 2.2 },
  objectives: { y: 50, count: 7,  r: 1.6 },
  keyResults: { y: 72, count: 13, r: 1.1 },
  actions:    { y: 90, count: 21, r: 0.7 },
} as const;

function buildNodes(): Node[] {
  const nodes: Node[] = [];
  const seed = (i: number, spread = 2) => Math.sin(i * 99.31) * spread; // deterministic jitter

  // Level 0: Vision (center)
  nodes.push({ id: "v", level: 0, x: 50, y: LEVELS.vision.y, r: LEVELS.vision.r });

  // Level 1: Pillars (3 nodes, evenly distributed)
  for (let i = 0; i < LEVELS.pillars.count; i++) {
    const x = 22 + (i * (56 / (LEVELS.pillars.count - 1)));
    nodes.push({
      id: `p${i}`, level: 1, x, y: LEVELS.pillars.y + seed(i, 1.5),
      r: LEVELS.pillars.r, parentId: "v",
    });
  }

  // Level 2: Objectives (7 nodes, distributed across 3 pillars: 2, 3, 2)
  const objDist = [2, 3, 2];
  let objIdx = 0;
  for (let p = 0; p < objDist.length; p++) {
    const pillarX = 22 + (p * (56 / (LEVELS.pillars.count - 1)));
    const n = objDist[p];
    const span = 20; // horizontal span per cluster
    for (let k = 0; k < n; k++) {
      const offset = n === 1 ? 0 : (k / (n - 1) - 0.5) * span;
      nodes.push({
        id: `o${objIdx}`, level: 2,
        x: pillarX + offset + seed(objIdx + 17, 1),
        y: LEVELS.objectives.y + seed(objIdx + 13, 1.5),
        r: LEVELS.objectives.r, parentId: `p${p}`,
      });
      objIdx++;
    }
  }

  // Level 3: Key Results (13 nodes, ~1.8 per objective)
  const krPerObj = [2, 2, 2, 1, 2, 2, 2]; // totals 13, biased slightly
  let krIdx = 0;
  for (let o = 0; o < krPerObj.length; o++) {
    const parent = nodes.find((n) => n.id === `o${o}`)!;
    const n = krPerObj[o];
    for (let k = 0; k < n; k++) {
      const offset = n === 1 ? 0 : (k / (n - 1) - 0.5) * 8;
      nodes.push({
        id: `k${krIdx}`, level: 3,
        x: parent.x + offset + seed(krIdx + 31, 0.8),
        y: LEVELS.keyResults.y + seed(krIdx + 23, 1.2),
        r: LEVELS.keyResults.r, parentId: parent.id,
      });
      krIdx++;
    }
  }

  // Level 4: Actions (21 small nodes, ~1.6 per KR)
  const actPerKr = [2, 2, 2, 1, 2, 1, 2, 2, 1, 2, 2, 1, 1]; // totals 21
  let actIdx = 0;
  for (let k = 0; k < actPerKr.length; k++) {
    const parent = nodes.find((n) => n.id === `k${k}`)!;
    const n = actPerKr[k];
    for (let m = 0; m < n; m++) {
      const offset = n === 1 ? 0 : (m / (n - 1) - 0.5) * 4;
      nodes.push({
        id: `a${actIdx}`, level: 4,
        x: parent.x + offset + seed(actIdx + 41, 0.6),
        y: LEVELS.actions.y + seed(actIdx + 37, 1.5),
        r: LEVELS.actions.r, parentId: parent.id,
      });
      actIdx++;
    }
  }

  return nodes;
}

/* ── Color palette by theme & level ─────────────────────────── */
const PALETTE = {
  dark: {
    bg: "transparent",
    gold: "#e0ad3e",
    goldSoft: "#c8922a",
    navy: "#3b6ba5",
    navySoft: "#2a5580",
    line: "rgba(200, 218, 240, 0.18)",
    lineGlow: "rgba(224, 173, 62, 0.35)",
    haloGold: "rgba(224, 173, 62, 0.22)",
    textPrimary: "rgba(255,255,255,0.85)",
    textMuted: "rgba(180, 200, 230, 0.6)",
  },
  light: {
    bg: "transparent",
    gold: "#c8922a",
    goldSoft: "#e0ad3e",
    navy: "#1e3a5f",
    navySoft: "#2a4f7f",
    line: "rgba(30, 58, 95, 0.14)",
    lineGlow: "rgba(200, 146, 42, 0.45)",
    haloGold: "rgba(200, 146, 42, 0.18)",
    textPrimary: "rgba(30, 58, 95, 0.85)",
    textMuted: "rgba(30, 58, 95, 0.55)",
  },
} as const;

function nodeColor(level: number, p: typeof PALETTE.light): string {
  switch (level) {
    case 0: return p.gold;       // Vision
    case 1: return p.goldSoft;   // Pillars
    case 2: return p.navy;       // Objectives
    case 3: return p.navySoft;   // Key Results
    default: return p.navySoft;  // Actions
  }
}

/* ── Stagger config ─────────────────────────────────────────── */
const LEVEL_DELAY = [0.2, 0.55, 0.9, 1.25, 1.6]; // seconds — top→bottom cascade

export function CascadingConstellation({ variant = "dark", northStarLabel }: {
  variant?: "dark" | "light";
  northStarLabel?: string;
}) {
  const nodes = useMemo(buildNodes, []);
  const palette = PALETTE[variant];

  // Build connection list
  const connections = useMemo(
    () => nodes.filter((n) => n.parentId).map((child) => {
      const parent = nodes.find((n) => n.id === child.parentId)!;
      return {
        id: `${parent.id}-${child.id}`,
        x1: parent.x, y1: parent.y,
        x2: child.x, y2: child.y,
        childLevel: child.level,
      };
    }),
    [nodes]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        aria-hidden="true"
      >
        <defs>
          {/* Gold vision halo */}
          <radialGradient id="visionHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.gold} stopOpacity="0.45" />
            <stop offset="60%" stopColor={palette.gold} stopOpacity="0.08" />
            <stop offset="100%" stopColor={palette.gold} stopOpacity="0" />
          </radialGradient>
          {/* Action glow */}
          <radialGradient id="actionGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.navySoft} stopOpacity="0.7" />
            <stop offset="100%" stopColor={palette.navySoft} stopOpacity="0" />
          </radialGradient>
          {/* Blur filter for glow */}
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>

        {/* ── Ambient bottom fade (gradient to transparent) ── */}
        <rect x="0" y="0" width="100" height="100" fill={palette.bg} />

        {/* ── Connections ── */}
        <g>
          {connections.map((c, i) => (
            <motion.line
              key={c.id}
              x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
              stroke={palette.line}
              strokeWidth={c.childLevel <= 2 ? 0.12 : 0.08}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: { duration: 0.9, delay: LEVEL_DELAY[c.childLevel] - 0.15, ease: [0.4, 0, 0.2, 1] },
                opacity:    { duration: 0.5, delay: LEVEL_DELAY[c.childLevel] - 0.15 },
              }}
            />
          ))}
        </g>

        {/* ── Nodes ── */}
        <g>
          {nodes.map((n, i) => {
            const delay = LEVEL_DELAY[n.level] + (i % 7) * 0.03;
            const fill = nodeColor(n.level, palette);
            const isVision = n.level === 0;

            return (
              <g key={n.id}>
                {/* Halo for vision */}
                {isVision && (
                  <motion.circle
                    cx={n.x} cy={n.y} r={n.r * 5}
                    fill="url(#visionHalo)"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.08, 1] }}
                    transition={{
                      opacity: { delay, duration: 0.8 },
                      scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                    }}
                    style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                  />
                )}

                {/* Soft outer glow */}
                <motion.circle
                  cx={n.x} cy={n.y} r={n.r * 1.8}
                  fill={fill}
                  opacity={n.level === 0 ? 0.35 : n.level === 1 ? 0.25 : 0.15}
                  filter="url(#softGlow)"
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{
                    opacity: [0.15, 0.3, 0.15],
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    opacity: { delay, duration: 0.6, repeat: Infinity, repeatType: "reverse" as const, repeatDelay: 2 + (i % 5) * 0.4 },
                    scale: { duration: 3.5 + (i % 4) * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.07 },
                  }}
                  style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                />

                {/* Main node */}
                <motion.circle
                  cx={n.x} cy={n.y} r={n.r}
                  fill={fill}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0.75, 1, 0.75],
                    scale: [1, 1.04, 1],
                  }}
                  transition={{
                    opacity: { duration: 3.5 + (i % 3) * 0.3, repeat: Infinity, ease: "easeInOut", delay: delay + i * 0.02 },
                    scale: { duration: 3.5 + (i % 3) * 0.3, repeat: Infinity, ease: "easeInOut", delay: delay + i * 0.02 },
                  }}
                  style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                />
              </g>
            );
          })}
        </g>

        {/* ── North Star label ── */}
        {northStarLabel && (
          <motion.text
            x="50"
            y="8.5"
            textAnchor="middle"
            fill={palette.textMuted}
            fontSize="1.5"
            fontWeight="600"
            style={{ letterSpacing: "0.3px", textTransform: "uppercase" }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {northStarLabel}
          </motion.text>
        )}
      </svg>
    </div>
  );
}
