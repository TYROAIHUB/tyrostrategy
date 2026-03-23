export type SidebarThemeId =
  | "light"
  | "arctic"
  | "navy"
  | "blue-gradient"
  | "black"
  | "emerald"
  | "violet"
  | "gold"
  | "jira"
  | "tiryaki"
  | "slate"
  | "rose"
  | "aurora"
  | "cyber"
  | "obsidian"
  | "liquid-glass";

/** App-wide overrides applied when a full theme is active.
 *  These values override the --tyro-* CSS variables on the app root,
 *  so ALL components using Tailwind's bg-tyro-*, text-tyro-*, border-tyro-*
 *  automatically pick up the theme colors. */
export interface AppThemeConfig {
  /** Page background */
  bg: string;
  bgGradient?: string;
  /** Card / surface background (replaces bg-white & --tyro-surface) */
  surface: string;
  /** Glass card tint for transparent cards */
  glassBg?: string;
  glassElevatedBg?: string;
  glassBorder?: string;

  /** Text colors */
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  /** Border color */
  border: string;
  /** Card shadow */
  cardShadow: string;
  /** Card border-radius */
  cardRadius: string;

  /** Primary accent — replaces --tyro-navy */
  navy: string;
  navyLight: string;
  navyDark: string;
  /** Secondary accent — replaces --tyro-gold */
  gold: string;
  goldLight: string;
  goldMuted: string;

  /** Semantic colors — keep defaults or override */
  success?: string;
  warning?: string;
  danger?: string;
  info?: string;

  /** Extra CSS class added to the app root */
  rootClass?: string;
  /** Dark mode flag for the app area */
  isDark: boolean;
}

export interface SidebarTheme {
  id: SidebarThemeId;
  label: string;
  previewColor: string;
  isDark: boolean;
  /** "sidebar" = only sidebar changes, "full" = entire app changes */
  scope: "sidebar" | "full";

  bg: string;
  bgGradient?: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  activeBg: string;
  activeText: string;
  activeBar: string;

  hoverBg: string;
  hoverText: string;

  sectionTitle: string;

  brandTyro: string;
  brandStrategy: string;

  logoGradientStart: string;
  logoGradientEnd: string;
  logoFillA: string;
  logoFillB: string;
  logoFillC: string;

  avatarFrom: string;
  avatarTo: string;
  profileHoverBg: string;
  onlineBorderColor: string;

  popoverBg: string;
  popoverBorder: string;
  popoverHoverBg: string;
  popoverDivider: string;
  popoverShadow: string;

  border: string;
  shadow: string;

  /** Accent color for page elements (buttons, pagination, etc.) */
  accentColor: string;
  accentColorLight: string;
  /** Background color for table column headers — matches sidebar bg for colored themes */
  tableHeaderBg: string;
  /** Gradient stops for primary action buttons (Yeni, etc.) */
  buttonGradient: string;
  buttonGradientHover: string;
  buttonShadow: string;
  buttonShadowHover: string;
  /** Glass effect properties — only for glass-style themes */
  glass?: {
    backdropFilter: string;
    borderColor: string;
    tint: string;
  };
  /** Animated mesh gradient blobs — only for mesh-style themes */
  meshBlobs?: {
    colors: string[];
    bg: string;
  };
  /** Gradient border hover effect — gold-accented border glow on cards */
  gradBorder?: {
    gradient: string;
    glow: string;
  };
  /** Full app theme config — only present when scope is "full" */
  app?: AppThemeConfig;
}

/* ─── 1. Light ─── */
const light: SidebarTheme = {
  id: "light",
  label: "Light",
  previewColor: "#ffffff",
  isDark: false,
  scope: "sidebar",
  bg: "#ffffff",
  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  activeBg: "rgba(30,58,95,0.07)",
  activeText: "#1e3a5f",
  activeBar: "#c8922a",
  hoverBg: "#f8fafc",
  hoverText: "#0f172a",
  sectionTitle: "#94a3b8",
  brandTyro: "#1e3a5f",
  brandStrategy: "#c8922a",
  logoGradientStart: "#c8922a",
  logoGradientEnd: "#8a6518",
  logoFillA: "#1e3a5f",
  logoFillB: "#2a4f7f",
  logoFillC: "#142842",
  avatarFrom: "#1e3a5f",
  avatarTo: "#2a4f7f",
  profileHoverBg: "rgba(30,58,95,0.06)",
  onlineBorderColor: "#ffffff",
  popoverBg: "#ffffff",
  popoverBorder: "rgba(226,232,240,0.5)",
  popoverHoverBg: "rgba(30,58,95,0.06)",
  popoverDivider: "rgba(226,232,240,0.4)",
  popoverShadow: "0 12px 40px rgba(30,58,95,0.15)",
  border: "#e2e8f0",
  shadow: "0 1px 3px rgba(30,58,95,0.04), 0 4px 12px rgba(30,58,95,0.06)",
  accentColor: "#1e3a5f",
  accentColorLight: "#2a4f7f",
  tableHeaderBg: "#1e3a5f",
  buttonGradient: "linear-gradient(135deg, #1e3a5f 0%, #2a4f7f 100%)",
  buttonGradientHover: "linear-gradient(135deg, #2a4f7f 0%, #3b6ba5 100%)",
  buttonShadow: "0 4px 14px rgba(30,58,95,0.3)",
  buttonShadowHover: "0 6px 20px rgba(30,58,95,0.45)",
};

/* ─── 2. Arctic Light ─── */
const arctic: SidebarTheme = {
  id: "arctic",
  label: "Arctic Light",
  previewColor: "#d4e4f7",
  isDark: false,
  scope: "sidebar",
  bg: "#f0f7ff",
  bgGradient: "linear-gradient(180deg, #f0f7ff 0%, #e8f1fc 100%)",
  textPrimary: "#1a2e4a",
  textSecondary: "#5a7394",
  textMuted: "#8ba3c1",
  activeBg: "rgba(59,130,246,0.10)",
  activeText: "#2563eb",
  activeBar: "#3b82f6",
  hoverBg: "rgba(59,130,246,0.06)",
  hoverText: "#1a2e4a",
  sectionTitle: "#8ba3c1",
  brandTyro: "#1e40af",
  brandStrategy: "#3b82f6",
  logoGradientStart: "#3b82f6",
  logoGradientEnd: "#1e40af",
  logoFillA: "#1e40af",
  logoFillB: "#2563eb",
  logoFillC: "#1a2e4a",
  avatarFrom: "#2563eb",
  avatarTo: "#60a5fa",
  profileHoverBg: "rgba(59,130,246,0.08)",
  onlineBorderColor: "#f0f7ff",
  popoverBg: "#f4f9ff",
  popoverBorder: "rgba(186,210,240,0.5)",
  popoverHoverBg: "rgba(59,130,246,0.08)",
  popoverDivider: "rgba(186,210,240,0.4)",
  popoverShadow: "0 12px 40px rgba(30,80,150,0.12)",
  border: "#d4e4f7",
  shadow: "0 1px 3px rgba(30,80,150,0.04), 0 4px 12px rgba(30,80,150,0.06)",
  accentColor: "#2563eb",
  accentColorLight: "#60a5fa",
  tableHeaderBg: "#2563eb",
  buttonGradient: "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
  buttonGradientHover: "linear-gradient(135deg, #3b82f6 0%, #93c5fd 100%)",
  buttonShadow: "0 4px 14px rgba(37,99,235,0.35)",
  buttonShadowHover: "0 6px 20px rgba(37,99,235,0.5)",
};

/* ─── 3. Navy ─── */
const navy: SidebarTheme = {
  id: "navy",
  label: "Navy",
  previewColor: "#1e3a5f",
  isDark: true,
  scope: "sidebar",
  bg: "#0f1d2f",
  bgGradient: "linear-gradient(180deg, #142842 0%, #0f1d2f 100%)",
  textPrimary: "#e2e8f0",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  activeBg: "rgba(200,146,42,0.15)",
  activeText: "#e0ad3e",
  activeBar: "#c8922a",
  hoverBg: "rgba(255,255,255,0.06)",
  hoverText: "#f1f5f9",
  sectionTitle: "#64748b",
  brandTyro: "#e2e8f0",
  brandStrategy: "#c8922a",
  logoGradientStart: "#e0ad3e",
  logoGradientEnd: "#c8922a",
  logoFillA: "#4a7ab5",
  logoFillB: "#6b9bd4",
  logoFillC: "#e0ad3e",
  avatarFrom: "#c8922a",
  avatarTo: "#e0ad3e",
  profileHoverBg: "rgba(255,255,255,0.08)",
  onlineBorderColor: "#142842",
  popoverBg: "#1a2d44",
  popoverBorder: "rgba(255,255,255,0.08)",
  popoverHoverBg: "rgba(255,255,255,0.08)",
  popoverDivider: "rgba(255,255,255,0.06)",
  popoverShadow: "0 12px 40px rgba(0,0,0,0.3)",
  border: "rgba(255,255,255,0.08)",
  shadow: "0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.3)",
  accentColor: "#1e3a5f",
  accentColorLight: "#2a4f7f",
  tableHeaderBg: "#0f1d2f",
  buttonGradient: "linear-gradient(135deg, #142842 0%, #1e3a5f 100%)",
  buttonGradientHover: "linear-gradient(135deg, #1e3a5f 0%, #2a4f7f 100%)",
  buttonShadow: "0 4px 14px rgba(20,40,66,0.4)",
  buttonShadowHover: "0 6px 20px rgba(20,40,66,0.55)",
};

/* ─── 4. Blue Gradient ─── */
const blueGradient: SidebarTheme = {
  id: "blue-gradient",
  label: "Blue Gradient",
  previewColor: "#2a4f7f",
  isDark: true,
  scope: "sidebar",
  bg: "#1e3a5f",
  bgGradient: "linear-gradient(180deg, #1e3a5f 0%, #2a4f7f 50%, #3b6ba5 100%)",
  textPrimary: "#f1f5f9",
  textSecondary: "#c5d8ec",
  textMuted: "#97b8d8",
  activeBg: "rgba(255,255,255,0.12)",
  activeText: "#ffffff",
  activeBar: "#e0ad3e",
  hoverBg: "rgba(255,255,255,0.08)",
  hoverText: "#ffffff",
  sectionTitle: "#7a9bbd",
  brandTyro: "#ffffff",
  brandStrategy: "#e0ad3e",
  logoGradientStart: "#e0ad3e",
  logoGradientEnd: "#c8922a",
  logoFillA: "#ffffff",
  logoFillB: "#d0e0f0",
  logoFillC: "#e0ad3e",
  avatarFrom: "#e0ad3e",
  avatarTo: "#f0c860",
  profileHoverBg: "rgba(255,255,255,0.10)",
  onlineBorderColor: "#2a4f7f",
  popoverBg: "#1a3358",
  popoverBorder: "rgba(255,255,255,0.10)",
  popoverHoverBg: "rgba(255,255,255,0.10)",
  popoverDivider: "rgba(255,255,255,0.08)",
  popoverShadow: "0 12px 40px rgba(0,0,0,0.3)",
  border: "rgba(255,255,255,0.10)",
  shadow: "0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.3)",
  accentColor: "#1e3a5f",
  accentColorLight: "#3b6ba5",
  tableHeaderBg: "#1e3a5f",
  buttonGradient: "linear-gradient(135deg, #1e3a5f 0%, #2a4f7f 50%, #3b6ba5 100%)",
  buttonGradientHover: "linear-gradient(135deg, #2a4f7f 0%, #3b6ba5 50%, #5a8ec4 100%)",
  buttonShadow: "0 4px 14px rgba(30,58,95,0.4)",
  buttonShadowHover: "0 6px 20px rgba(42,79,127,0.55)",
};

/* ─── 5. Black ─── */
const black: SidebarTheme = {
  id: "black",
  label: "Black",
  previewColor: "#18181b",
  isDark: true,
  scope: "sidebar",
  bg: "#09090b",
  bgGradient: "linear-gradient(180deg, #0a0a0e 0%, #09090b 100%)",
  textPrimary: "#fafafa",
  textSecondary: "#a1a1aa",
  textMuted: "#71717a",
  activeBg: "rgba(250,250,250,0.08)",
  activeText: "#ffffff",
  activeBar: "#c8922a",
  hoverBg: "rgba(255,255,255,0.05)",
  hoverText: "#fafafa",
  sectionTitle: "#71717a",
  brandTyro: "#fafafa",
  brandStrategy: "#c8922a",
  logoGradientStart: "#c8922a",
  logoGradientEnd: "#e0ad3e",
  logoFillA: "#fafafa",
  logoFillB: "#d4d4d8",
  logoFillC: "#c8922a",
  avatarFrom: "#27272a",
  avatarTo: "#3f3f46",
  profileHoverBg: "rgba(255,255,255,0.06)",
  onlineBorderColor: "#09090b",
  popoverBg: "#18181b",
  popoverBorder: "rgba(255,255,255,0.08)",
  popoverHoverBg: "rgba(255,255,255,0.06)",
  popoverDivider: "rgba(255,255,255,0.06)",
  popoverShadow: "0 12px 40px rgba(0,0,0,0.5)",
  border: "rgba(255,255,255,0.06)",
  shadow: "0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.5)",
  accentColor: "#27272a",
  accentColorLight: "#3f3f46",
  tableHeaderBg: "#09090b",
  buttonGradient: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
  buttonGradientHover: "linear-gradient(135deg, #27272a 0%, #3f3f46 100%)",
  buttonShadow: "0 4px 14px rgba(0,0,0,0.4)",
  buttonShadowHover: "0 6px 20px rgba(0,0,0,0.55)",
};

/* ─── 6. Emerald ───
   Spotify-inspired: deep forest green bg, NEUTRAL white/gray text.
   Green only for accents — no neon green text.
   Ref: Spotify sidebar, Vercel's green, Supabase dashboard */
const emerald: SidebarTheme = {
  id: "emerald",
  label: "Emerald",
  previewColor: "#166534",
  isDark: true,
  scope: "sidebar",
  bg: "#14281e",
  bgGradient: "linear-gradient(180deg, #1a3328 0%, #14281e 100%)",
  textPrimary: "#f0fdf4",
  textSecondary: "#b0c4b8",
  textMuted: "#7a9486",
  activeBg: "rgba(52,211,153,0.14)",
  activeText: "#6ee7b7",
  activeBar: "#10b981",
  hoverBg: "rgba(255,255,255,0.06)",
  hoverText: "#ecfdf5",
  sectionTitle: "#6b8f7d",
  brandTyro: "#f0fdf4",
  brandStrategy: "#34d399",
  logoGradientStart: "#34d399",
  logoGradientEnd: "#059669",
  logoFillA: "#f0fdf4",
  logoFillB: "#a7f3d0",
  logoFillC: "#10b981",
  avatarFrom: "#059669",
  avatarTo: "#10b981",
  profileHoverBg: "rgba(255,255,255,0.08)",
  onlineBorderColor: "#14281e",
  popoverBg: "#1a3328",
  popoverBorder: "rgba(255,255,255,0.08)",
  popoverHoverBg: "rgba(255,255,255,0.08)",
  popoverDivider: "rgba(255,255,255,0.06)",
  popoverShadow: "0 12px 40px rgba(0,20,10,0.4)",
  border: "rgba(255,255,255,0.08)",
  shadow: "0 1px 3px rgba(0,20,10,0.25), 0 4px 12px rgba(0,20,10,0.35)",
  accentColor: "#166534",
  accentColorLight: "#22c55e",
  tableHeaderBg: "#14281e",
  buttonGradient: "linear-gradient(135deg, #166534 0%, #22c55e 100%)",
  buttonGradientHover: "linear-gradient(135deg, #15803d 0%, #4ade80 100%)",
  buttonShadow: "0 4px 14px rgba(22,101,52,0.4)",
  buttonShadowHover: "0 6px 20px rgba(22,101,52,0.55)",
};

/* ─── 7. Violet ───
   Discord/Figma-inspired: refined indigo-purple, balanced depth.
   Neutral off-white text, purple only for accents.
   Ref: Discord sidebar, Figma purple, Linear */
const violet: SidebarTheme = {
  id: "violet",
  label: "Violet",
  previewColor: "#6d28d9",
  isDark: true,
  scope: "sidebar",
  bg: "#1a1030",
  bgGradient: "linear-gradient(180deg, #221540 0%, #1a1030 100%)",
  textPrimary: "#f5f3ff",
  textSecondary: "#b8afd4",
  textMuted: "#8b80aa",
  activeBg: "rgba(139,92,246,0.16)",
  activeText: "#c4b5fd",
  activeBar: "#8b5cf6",
  hoverBg: "rgba(255,255,255,0.06)",
  hoverText: "#ede9fe",
  sectionTitle: "#7c6f9e",
  brandTyro: "#f5f3ff",
  brandStrategy: "#a78bfa",
  logoGradientStart: "#a78bfa",
  logoGradientEnd: "#7c3aed",
  logoFillA: "#f5f3ff",
  logoFillB: "#c4b5fd",
  logoFillC: "#8b5cf6",
  avatarFrom: "#7c3aed",
  avatarTo: "#8b5cf6",
  profileHoverBg: "rgba(255,255,255,0.08)",
  onlineBorderColor: "#1a1030",
  popoverBg: "#221540",
  popoverBorder: "rgba(255,255,255,0.08)",
  popoverHoverBg: "rgba(255,255,255,0.08)",
  popoverDivider: "rgba(255,255,255,0.06)",
  popoverShadow: "0 12px 40px rgba(15,5,40,0.5)",
  border: "rgba(255,255,255,0.08)",
  shadow: "0 1px 3px rgba(15,5,40,0.3), 0 4px 12px rgba(15,5,40,0.4)",
  accentColor: "#6d28d9",
  accentColorLight: "#8b5cf6",
  tableHeaderBg: "#1a1030",
  buttonGradient: "linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)",
  buttonGradientHover: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
  buttonShadow: "0 4px 14px rgba(109,40,217,0.4)",
  buttonShadowHover: "0 6px 20px rgba(109,40,217,0.55)",
};

/* ─── 8. Gold / Amber ───
   Bloomberg/luxury-inspired: dark warm charcoal bg with copper/gold accents.
   NOT bright orange bg. Professional dark theme with warm personality.
   Ref: Bloomberg Terminal, premium finance apps */
const gold: SidebarTheme = {
  id: "gold",
  label: "Gold",
  previewColor: "#92400e",
  isDark: true,
  scope: "sidebar",
  bg: "#1c1410",
  bgGradient: "linear-gradient(180deg, #241a14 0%, #1c1410 100%)",
  textPrimary: "#fef3c7",
  textSecondary: "#c9ab80",
  textMuted: "#8f7a5e",
  activeBg: "rgba(217,168,80,0.16)",
  activeText: "#fbbf24",
  activeBar: "#d97706",
  hoverBg: "rgba(255,255,255,0.06)",
  hoverText: "#fef9ee",
  sectionTitle: "#7d6b52",
  brandTyro: "#fef3c7",
  brandStrategy: "#d97706",
  logoGradientStart: "#f59e0b",
  logoGradientEnd: "#b45309",
  logoFillA: "#fef3c7",
  logoFillB: "#fbbf24",
  logoFillC: "#d97706",
  avatarFrom: "#b45309",
  avatarTo: "#d97706",
  profileHoverBg: "rgba(255,255,255,0.08)",
  onlineBorderColor: "#1c1410",
  popoverBg: "#241a14",
  popoverBorder: "rgba(255,255,255,0.08)",
  popoverHoverBg: "rgba(255,255,255,0.08)",
  popoverDivider: "rgba(255,255,255,0.06)",
  popoverShadow: "0 12px 40px rgba(10,5,0,0.5)",
  border: "rgba(255,255,255,0.08)",
  shadow: "0 1px 3px rgba(10,5,0,0.3), 0 4px 12px rgba(10,5,0,0.4)",
  accentColor: "#92400e",
  accentColorLight: "#d97706",
  tableHeaderBg: "#1c1410",
  buttonGradient: "linear-gradient(135deg, #92400e 0%, #d97706 100%)",
  buttonGradientHover: "linear-gradient(135deg, #b45309 0%, #f59e0b 100%)",
  buttonShadow: "0 4px 14px rgba(146,64,14,0.4)",
  buttonShadowHover: "0 6px 20px rgba(146,64,14,0.55)",
};

/* ─── 9. Jira ───
   Atlassian Design System — official Jira/Confluence sidebar colors.
   Minor contrast improvements from original. */
const jira: SidebarTheme = {
  id: "jira",
  label: "Jira",
  previewColor: "#0052CC",
  isDark: true,
  scope: "sidebar",
  bg: "#172B4D",
  bgGradient: "linear-gradient(180deg, #1a3154 0%, #172B4D 100%)",
  textPrimary: "#DEEBFF",
  textSecondary: "#B3D4FF",
  textMuted: "#8CA4C4",
  activeBg: "rgba(0,82,204,0.25)",
  activeText: "#4C9AFF",
  activeBar: "#0065FF",
  hoverBg: "rgba(255,255,255,0.06)",
  hoverText: "#DEEBFF",
  sectionTitle: "#7A8DB5",
  brandTyro: "#DEEBFF",
  brandStrategy: "#4C9AFF",
  logoGradientStart: "#4C9AFF",
  logoGradientEnd: "#0052CC",
  logoFillA: "#DEEBFF",
  logoFillB: "#B3D4FF",
  logoFillC: "#4C9AFF",
  avatarFrom: "#0052CC",
  avatarTo: "#2684FF",
  profileHoverBg: "rgba(255,255,255,0.08)",
  onlineBorderColor: "#172B4D",
  popoverBg: "#1C3259",
  popoverBorder: "rgba(255,255,255,0.08)",
  popoverHoverBg: "rgba(255,255,255,0.08)",
  popoverDivider: "rgba(255,255,255,0.06)",
  popoverShadow: "0 12px 40px rgba(0,0,0,0.35)",
  border: "rgba(255,255,255,0.08)",
  shadow: "0 1px 3px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.35)",
  accentColor: "#0052CC",
  accentColorLight: "#2684FF",
  tableHeaderBg: "#172B4D",
  buttonGradient: "linear-gradient(135deg, #0052CC 0%, #2684FF 100%)",
  buttonGradientHover: "linear-gradient(135deg, #0065FF 0%, #4C9AFF 100%)",
  buttonShadow: "0 4px 14px rgba(0,82,204,0.35)",
  buttonShadowHover: "0 6px 20px rgba(0,82,204,0.5)",
};

/* ─── 10. Tiryaki ───
   Tiryaki Agro brand: navy blue + lime green.
   Lime toned down — secondary text is neutral, lime only for accents.
   Brand identity preserved. */
const tiryaki: SidebarTheme = {
  id: "tiryaki",
  label: "Tiryaki",
  previewColor: "#004579",
  isDark: true,
  scope: "sidebar",
  bg: "#004579",
  bgGradient: "linear-gradient(180deg, #005591 0%, #004579 100%)",
  textPrimary: "#f0f4f8",
  textSecondary: "#b0c4d8",
  textMuted: "#7a94ad",
  activeBg: "rgba(200,212,0,0.16)",
  activeText: "#d4e000",
  activeBar: "#c8d400",
  hoverBg: "rgba(255,255,255,0.07)",
  hoverText: "#f0f4f8",
  sectionTitle: "#6d88a2",
  brandTyro: "#f0f4f8",
  brandStrategy: "#c8d400",
  logoGradientStart: "#c8d400",
  logoGradientEnd: "#8aad00",
  logoFillA: "#f0f4f8",
  logoFillB: "#c8d400",
  logoFillC: "#00afcb",
  avatarFrom: "#00afcb",
  avatarTo: "#00c9e8",
  profileHoverBg: "rgba(255,255,255,0.08)",
  onlineBorderColor: "#004579",
  popoverBg: "#003a66",
  popoverBorder: "rgba(255,255,255,0.10)",
  popoverHoverBg: "rgba(255,255,255,0.08)",
  popoverDivider: "rgba(255,255,255,0.06)",
  popoverShadow: "0 12px 40px rgba(0,20,50,0.35)",
  border: "rgba(255,255,255,0.10)",
  shadow: "0 1px 3px rgba(0,20,50,0.2), 0 4px 12px rgba(0,20,50,0.3)",
  accentColor: "#004579",
  accentColorLight: "#00afcb",
  tableHeaderBg: "#004579",
  buttonGradient: "linear-gradient(135deg, #004579 0%, #00afcb 100%)",
  buttonGradientHover: "linear-gradient(135deg, #005591 0%, #00c9e8 100%)",
  buttonShadow: "0 4px 14px rgba(0,69,121,0.35)",
  buttonShadowHover: "0 6px 20px rgba(0,69,121,0.5)",
};

/* ─── 11. Slate (NEW) ───
   Linear/Notion dark mode-inspired: warm blue-gray.
   Most professional neutral dark theme. Easy on eyes for long sessions.
   Ref: Linear app, Raycast, Arc browser sidebar */
const slate: SidebarTheme = {
  id: "slate",
  label: "Slate",
  previewColor: "#334155",
  isDark: true,
  scope: "sidebar",
  bg: "#0f172a",
  bgGradient: "linear-gradient(180deg, #131c30 0%, #0f172a 100%)",
  textPrimary: "#e2e8f0",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  activeBg: "rgba(99,102,241,0.14)",
  activeText: "#a5b4fc",
  activeBar: "#6366f1",
  hoverBg: "rgba(255,255,255,0.05)",
  hoverText: "#f1f5f9",
  sectionTitle: "#475569",
  brandTyro: "#e2e8f0",
  brandStrategy: "#818cf8",
  logoGradientStart: "#818cf8",
  logoGradientEnd: "#6366f1",
  logoFillA: "#e2e8f0",
  logoFillB: "#a5b4fc",
  logoFillC: "#6366f1",
  avatarFrom: "#4f46e5",
  avatarTo: "#6366f1",
  profileHoverBg: "rgba(255,255,255,0.06)",
  onlineBorderColor: "#0f172a",
  popoverBg: "#1e293b",
  popoverBorder: "rgba(255,255,255,0.08)",
  popoverHoverBg: "rgba(255,255,255,0.06)",
  popoverDivider: "rgba(255,255,255,0.06)",
  popoverShadow: "0 12px 40px rgba(0,0,0,0.4)",
  border: "rgba(255,255,255,0.07)",
  shadow: "0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4)",
  accentColor: "#4f46e5",
  accentColorLight: "#6366f1",
  tableHeaderBg: "#0f172a",
  buttonGradient: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
  buttonGradientHover: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
  buttonShadow: "0 4px 14px rgba(79,70,229,0.35)",
  buttonShadowHover: "0 6px 20px rgba(79,70,229,0.5)",
};

/* ─── 12. Rose (NEW) ───
   Premium burgundy/wine — luxury finance/executive feel.
   Deep wine bg with rose-gold accents. Warm and sophisticated.
   Ref: Premium banking apps, Bloomberg Wealth, Pitch */
const rose: SidebarTheme = {
  id: "rose",
  label: "Rose",
  previewColor: "#881337",
  isDark: true,
  scope: "sidebar",
  bg: "#1a0f14",
  bgGradient: "linear-gradient(180deg, #22141a 0%, #1a0f14 100%)",
  textPrimary: "#fdf2f8",
  textSecondary: "#c8a4b4",
  textMuted: "#8f6e7e",
  activeBg: "rgba(244,114,182,0.14)",
  activeText: "#f9a8d4",
  activeBar: "#ec4899",
  hoverBg: "rgba(255,255,255,0.06)",
  hoverText: "#fce7f3",
  sectionTitle: "#7a5a6a",
  brandTyro: "#fdf2f8",
  brandStrategy: "#f472b6",
  logoGradientStart: "#f472b6",
  logoGradientEnd: "#db2777",
  logoFillA: "#fdf2f8",
  logoFillB: "#f9a8d4",
  logoFillC: "#ec4899",
  avatarFrom: "#be185d",
  avatarTo: "#db2777",
  profileHoverBg: "rgba(255,255,255,0.08)",
  onlineBorderColor: "#1a0f14",
  popoverBg: "#22141a",
  popoverBorder: "rgba(255,255,255,0.08)",
  popoverHoverBg: "rgba(255,255,255,0.08)",
  popoverDivider: "rgba(255,255,255,0.06)",
  popoverShadow: "0 12px 40px rgba(15,5,10,0.5)",
  border: "rgba(255,255,255,0.08)",
  shadow: "0 1px 3px rgba(15,5,10,0.3), 0 4px 12px rgba(15,5,10,0.4)",
  accentColor: "#9f1239",
  accentColorLight: "#e11d48",
  tableHeaderBg: "#1a0f14",
  buttonGradient: "linear-gradient(135deg, #9f1239 0%, #e11d48 100%)",
  buttonGradientHover: "linear-gradient(135deg, #be185d 0%, #f43f5e 100%)",
  buttonShadow: "0 4px 14px rgba(159,18,57,0.4)",
  buttonShadowHover: "0 6px 20px rgba(159,18,57,0.55)",
};

/* ─── 13. Aurora ───
   AI/modern-inspired: deep navy → teal → emerald 4-stop gradient.
   Northern lights feel. Teal/cyan accents.
   Ref: Vercel, ChatGPT gradient, modern AI dashboards */
const aurora: SidebarTheme = {
  id: "aurora",
  label: "Aurora",
  previewColor: "#0d3b66",
  isDark: true,
  scope: "sidebar",
  bg: "#0a192f",
  bgGradient: "linear-gradient(180deg, #0a192f 0%, #0d3b66 35%, #1a6b5e 70%, #1a5c50 100%)",
  textPrimary: "#e0f2f1",
  textSecondary: "#a0c4c0",
  textMuted: "#6b9690",
  activeBg: "rgba(45,212,168,0.16)",
  activeText: "#5eead4",
  activeBar: "#2dd4a8",
  hoverBg: "rgba(255,255,255,0.07)",
  hoverText: "#e0f2f1",
  sectionTitle: "#5a8a84",
  brandTyro: "#e0f2f1",
  brandStrategy: "#2dd4a8",
  logoGradientStart: "#2dd4a8",
  logoGradientEnd: "#0d9488",
  logoFillA: "#e0f2f1",
  logoFillB: "#5eead4",
  logoFillC: "#2dd4a8",
  avatarFrom: "#0d9488",
  avatarTo: "#14b8a6",
  profileHoverBg: "rgba(255,255,255,0.08)",
  onlineBorderColor: "#0a192f",
  popoverBg: "#0e2a4a",
  popoverBorder: "rgba(255,255,255,0.10)",
  popoverHoverBg: "rgba(255,255,255,0.08)",
  popoverDivider: "rgba(255,255,255,0.06)",
  popoverShadow: "0 12px 40px rgba(5,10,25,0.5)",
  border: "rgba(255,255,255,0.09)",
  shadow: "0 1px 3px rgba(5,10,25,0.3), 0 4px 12px rgba(5,10,25,0.4)",
  accentColor: "#0d6e5e",
  accentColorLight: "#14b8a6",
  tableHeaderBg: "#0a192f",
  buttonGradient: "linear-gradient(135deg, #0d3b66 0%, #14b8a6 100%)",
  buttonGradientHover: "linear-gradient(135deg, #1a5276 0%, #2dd4a8 100%)",
  buttonShadow: "0 4px 14px rgba(13,59,102,0.4)",
  buttonShadowHover: "0 6px 20px rgba(20,184,166,0.4)",
};

/* ─── 14. Cyber ───
   Vercel/Next.js-inspired: ultra-dark navy→purple with neon cyan accents.
   Futuristic, dev-tool aesthetic.
   Ref: Vercel dashboard, GitHub Copilot, Warp terminal */
const cyber: SidebarTheme = {
  id: "cyber",
  label: "Cyber",
  previewColor: "#1a103d",
  isDark: true,
  scope: "sidebar",
  bg: "#0a0a1e",
  bgGradient: "linear-gradient(180deg, #0a0a1e 0%, #1a103d 50%, #2a1a5e 100%)",
  textPrimary: "#eef0ff",
  textSecondary: "#a0a8c8",
  textMuted: "#6b7394",
  activeBg: "rgba(0,240,255,0.12)",
  activeText: "#22d3ee",
  activeBar: "#06b6d4",
  hoverBg: "rgba(255,255,255,0.06)",
  hoverText: "#f0f4ff",
  sectionTitle: "#565e80",
  brandTyro: "#eef0ff",
  brandStrategy: "#22d3ee",
  logoGradientStart: "#22d3ee",
  logoGradientEnd: "#06b6d4",
  logoFillA: "#eef0ff",
  logoFillB: "#67e8f9",
  logoFillC: "#06b6d4",
  avatarFrom: "#7c3aed",
  avatarTo: "#06b6d4",
  profileHoverBg: "rgba(255,255,255,0.08)",
  onlineBorderColor: "#0a0a1e",
  popoverBg: "#12102e",
  popoverBorder: "rgba(255,255,255,0.10)",
  popoverHoverBg: "rgba(255,255,255,0.08)",
  popoverDivider: "rgba(255,255,255,0.06)",
  popoverShadow: "0 12px 40px rgba(5,0,20,0.6)",
  border: "rgba(255,255,255,0.08)",
  shadow: "0 1px 3px rgba(5,0,20,0.4), 0 4px 12px rgba(5,0,20,0.5)",
  accentColor: "#1a103d",
  accentColorLight: "#06b6d4",
  tableHeaderBg: "#0a0a1e",
  buttonGradient: "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
  buttonGradientHover: "linear-gradient(135deg, #8b5cf6 0%, #22d3ee 100%)",
  buttonShadow: "0 4px 14px rgba(124,58,237,0.35)",
  buttonShadowHover: "0 6px 20px rgba(6,182,212,0.4)",
};

/* ─── 15. Obsidian ───
   Ultra-dark with subtle blue undertone. Premium minimalist feel.
   Like polished obsidian stone — almost black but with depth.
   Ref: Obsidian app, Notion dark, premium SaaS */
const obsidian: SidebarTheme = {
  id: "obsidian",
  label: "Obsidian",
  previewColor: "#1a1a2e",
  isDark: true,
  scope: "sidebar",
  bg: "#0d0d14",
  bgGradient: "linear-gradient(180deg, #0d0d14 0%, #12122a 50%, #0d0d1a 100%)",
  textPrimary: "#e8e8f0",
  textSecondary: "#9494a8",
  textMuted: "#646478",
  activeBg: "rgba(165,165,200,0.10)",
  activeText: "#c8c8e0",
  activeBar: "#8888b0",
  hoverBg: "rgba(255,255,255,0.05)",
  hoverText: "#e8e8f0",
  sectionTitle: "#505068",
  brandTyro: "#e8e8f0",
  brandStrategy: "#a0a0c8",
  logoGradientStart: "#a0a0c8",
  logoGradientEnd: "#7070a0",
  logoFillA: "#e8e8f0",
  logoFillB: "#b8b8d0",
  logoFillC: "#8888b0",
  avatarFrom: "#3a3a5c",
  avatarTo: "#525278",
  profileHoverBg: "rgba(255,255,255,0.06)",
  onlineBorderColor: "#0d0d14",
  popoverBg: "#16162a",
  popoverBorder: "rgba(255,255,255,0.07)",
  popoverHoverBg: "rgba(255,255,255,0.06)",
  popoverDivider: "rgba(255,255,255,0.05)",
  popoverShadow: "0 12px 40px rgba(0,0,0,0.6)",
  border: "rgba(255,255,255,0.06)",
  shadow: "0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.5)",
  accentColor: "#3a3a5c",
  accentColorLight: "#606088",
  tableHeaderBg: "#0d0d14",
  buttonGradient: "linear-gradient(135deg, #3a3a5c 0%, #5a5a80 100%)",
  buttonGradientHover: "linear-gradient(135deg, #4a4a70 0%, #7070a0 100%)",
  buttonShadow: "0 4px 14px rgba(30,30,60,0.5)",
  buttonShadowHover: "0 6px 20px rgba(30,30,60,0.65)",
};

/* ─── 16. Liquid Glass ───
   iOS 26 Liquid Glass-inspired: translucent frosted glass sidebar.
   Background shows through with blur effect. Light & airy.
   Ref: iOS 26, macOS Sequoia, visionOS */
const liquidGlass: SidebarTheme = {
  id: "liquid-glass",
  label: "Liquid Glass",
  previewColor: "#e8edf4",
  isDark: false,
  scope: "sidebar",
  bg: "rgba(255,255,255,0.45)",
  textPrimary: "#1c1c1e",
  textSecondary: "#636366",
  textMuted: "#aeaeb2",
  activeBg: "rgba(0,122,255,0.10)",
  activeText: "#007aff",
  activeBar: "#007aff",
  hoverBg: "rgba(120,120,140,0.08)",
  hoverText: "#1c1c1e",
  sectionTitle: "#aeaeb2",
  brandTyro: "#1c1c1e",
  brandStrategy: "#007aff",
  logoGradientStart: "#007aff",
  logoGradientEnd: "#0052cc",
  logoFillA: "#2c2c2e",
  logoFillB: "#1c1c1e",
  logoFillC: "#0e0e10",
  avatarFrom: "#007aff",
  avatarTo: "#5ac8fa",
  profileHoverBg: "rgba(120,120,140,0.10)",
  onlineBorderColor: "rgba(255,255,255,0.7)",
  popoverBg: "rgba(255,255,255,0.72)",
  popoverBorder: "rgba(255,255,255,0.35)",
  popoverHoverBg: "rgba(120,120,140,0.10)",
  popoverDivider: "rgba(120,120,140,0.12)",
  popoverShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
  border: "rgba(255,255,255,0.30)",
  shadow: "0 8px 32px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
  accentColor: "#007aff",
  accentColorLight: "#5ac8fa",
  tableHeaderBg: "rgba(0,122,255,0.85)",
  buttonGradient: "linear-gradient(135deg, #007aff 0%, #5ac8fa 100%)",
  buttonGradientHover: "linear-gradient(135deg, #0056b3 0%, #007aff 100%)",
  buttonShadow: "0 4px 14px rgba(0,122,255,0.3)",
  buttonShadowHover: "0 6px 20px rgba(0,122,255,0.45)",
  glass: {
    backdropFilter: "blur(20px) saturate(1.8)",
    borderColor: "rgba(255,255,255,0.30)",
    tint: "rgba(120,120,140,0.12)",
  },
  app: {
    bg: "#f0f2f5",
    surface: "rgba(255,255,255,0.72)",
    glassBg: "rgba(255,255,255,0.55)",
    glassElevatedBg: "rgba(255,255,255,0.75)",
    glassBorder: "rgba(255,255,255,0.35)",
    textPrimary: "#1c1c1e",
    textSecondary: "#636366",
    textMuted: "#aeaeb2",
    border: "rgba(200,200,215,0.35)",
    cardShadow: "0 8px 32px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
    cardRadius: "16px",
    navy: "#007aff",
    navyLight: "#3395ff",
    navyDark: "#0056b3",
    gold: "#ff9500",
    goldLight: "#ffb340",
    goldMuted: "rgba(255,149,0,0.15)",
    isDark: false,
  },
};

export const sidebarThemes: Record<SidebarThemeId, SidebarTheme> = {
  light,
  arctic,
  navy,
  "blue-gradient": blueGradient,
  black,
  emerald,
  violet,
  gold,
  jira,
  tiryaki,
  slate,
  rose,
  aurora,
  cyber,
  obsidian,
  "liquid-glass": liquidGlass,
};

/** Sidebar-only themes (scope: "sidebar") */
export const sidebarOnlyThemes: SidebarTheme[] = Object.values(sidebarThemes).filter(
  (t) => t.scope === "sidebar"
);

/** Full app themes (scope: "full") */
export const fullAppThemes: SidebarTheme[] = Object.values(sidebarThemes).filter(
  (t) => t.scope === "full"
);

export const sidebarThemeList: SidebarTheme[] = Object.values(sidebarThemes);
