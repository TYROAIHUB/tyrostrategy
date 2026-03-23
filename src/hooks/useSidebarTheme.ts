import type React from "react";
import { useUIStore } from "@/stores/uiStore";
import { sidebarThemes, type SidebarTheme, type AppThemeConfig } from "@/config/sidebarThemes";

export function useSidebarTheme(): SidebarTheme {
  const themeId = useUIStore((s) => s.sidebarTheme);
  return sidebarThemes[themeId];
}

export function sidebarCSSVars(theme: SidebarTheme): React.CSSProperties {
  return {
    "--sb-bg": theme.bg,
    "--sb-text-primary": theme.textPrimary,
    "--sb-text-secondary": theme.textSecondary,
    "--sb-text-muted": theme.textMuted,
    "--sb-active-bg": theme.activeBg,
    "--sb-active-text": theme.activeText,
    "--sb-active-bar": theme.activeBar,
    "--sb-hover-bg": theme.hoverBg,
    "--sb-hover-text": theme.hoverText,
    "--sb-section-title": theme.sectionTitle,
    "--sb-brand-tyro": theme.brandTyro,
    "--sb-brand-strategy": theme.brandStrategy,
    "--sb-avatar-from": theme.avatarFrom,
    "--sb-avatar-to": theme.avatarTo,
    "--sb-profile-hover-bg": theme.profileHoverBg,
    "--sb-online-border": theme.onlineBorderColor,
    "--sb-popover-bg": theme.popoverBg,
    "--sb-popover-border": theme.popoverBorder,
    "--sb-popover-hover-bg": theme.popoverHoverBg,
    "--sb-popover-divider": theme.popoverDivider,
    "--sb-border": theme.border,
  } as React.CSSProperties;
}

/**
 * Returns app-wide CSS variables as inline styles.
 * When scope="full", overrides ALL --tyro-* variables so every component
 * using bg-tyro-*, text-tyro-*, border-tyro-* automatically adapts.
 * When scope="sidebar", returns empty object (standard theme untouched).
 */
export function appCSSVars(theme: SidebarTheme): React.CSSProperties {
  if (theme.scope !== "full" || !theme.app) return {};

  const app = theme.app;
  return {
    // Core backgrounds
    "--tyro-bg": app.bg,
    "--tyro-surface": app.surface,
    // Text
    "--tyro-text-primary": app.textPrimary,
    "--tyro-text-secondary": app.textSecondary,
    "--tyro-text-muted": app.textMuted,
    // Borders
    "--tyro-border": app.border,
    // Primary accent (navy → theme accent)
    "--tyro-navy": app.navy,
    "--tyro-navy-light": app.navyLight,
    "--tyro-navy-dark": app.navyDark,
    // Secondary accent (gold → theme secondary)
    "--tyro-gold": app.gold,
    "--tyro-gold-light": app.goldLight,
    "--tyro-gold-muted": app.goldMuted,
    // Semantic (if overridden)
    ...(app.success ? { "--tyro-success": app.success } : {}),
    ...(app.warning ? { "--tyro-warning": app.warning } : {}),
    ...(app.danger ? { "--tyro-danger": app.danger } : {}),
    ...(app.info ? { "--tyro-info": app.info } : {}),
    // Glass card overrides
    ...(app.glassBg ? { "--app-glass-bg": app.glassBg } : {}),
    ...(app.glassElevatedBg ? { "--app-glass-elevated-bg": app.glassElevatedBg } : {}),
    ...(app.glassBorder ? { "--app-glass-border": app.glassBorder } : {}),
    // Card styling
    "--app-card-shadow": app.cardShadow,
    "--app-card-radius": app.cardRadius,
    "--app-surface": app.surface,
  } as React.CSSProperties;
}

/** Returns the AppThemeConfig if full theme, otherwise null */
export function getAppTheme(theme: SidebarTheme): AppThemeConfig | null {
  return theme.scope === "full" && theme.app ? theme.app : null;
}
