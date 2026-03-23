/** Returns a color based on progress percentage: red → orange → yellow → green */
export function progressColor(pct: number): string {
  if (pct >= 100) return "#22c55e";
  if (pct >= 75) return "#4ade80";
  if (pct >= 50) return "#facc15";
  if (pct >= 25) return "#fb923c";
  return "#ef4444";
}

/** Convert hex color to HSL string for HeroUI CSS variables (e.g. "30 90% 44%") */
export function hexToHSL(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `0 0% ${Math.round(l * 100)}%`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
