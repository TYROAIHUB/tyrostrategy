/**
 * Z-index token system — single source of truth for all z-index values.
 *
 * Layer hierarchy (low → high):
 *   base       (0)   — default stacking
 *   sticky     (10)  — sticky headers, inline overlays
 *   dropdown   (20)  — dropdowns, tooltips, popovers
 *   navbar     (30)  — bottom nav, mobile header
 *   sidebar    (40)  — sidebar overlay, filter panels
 *   panel      (50)  — sliding panels, drawers
 *   backdrop   (60)  — modal/FAB backdrops
 *   modal      (70)  — modals, dialogs, FAB menus
 *   toast      (80)  — toast notifications
 *   offline    (90)  — offline banner (always on top)
 *   devtools   (100) — debug overlays (dev only)
 */
export const Z = {
  base: 0,
  sticky: 10,
  dropdown: 20,
  navbar: 30,
  sidebar: 40,
  panel: 50,
  backdrop: 60,
  modal: 70,
  toast: 80,
  offline: 90,
  devtools: 100,
} as const;
