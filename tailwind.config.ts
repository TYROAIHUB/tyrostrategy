import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tyro: {
          navy: "var(--tyro-navy)",
          "navy-light": "var(--tyro-navy-light)",
          "navy-dark": "var(--tyro-navy-dark)",
          gold: "var(--tyro-gold)",
          "gold-light": "var(--tyro-gold-light)",
          "gold-muted": "var(--tyro-gold-muted)",
          success: "var(--tyro-success)",
          warning: "var(--tyro-warning)",
          danger: "var(--tyro-danger)",
          info: "var(--tyro-info)",
          bg: "var(--tyro-bg)",
          surface: "var(--tyro-surface)",
          border: "var(--tyro-border)",
          "text-primary": "var(--tyro-text-primary)",
          "text-secondary": "var(--tyro-text-secondary)",
          "text-muted": "var(--tyro-text-muted)",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        "tyro-sm": "0 1px 3px rgba(30,58,95,0.04), 0 4px 12px rgba(30,58,95,0.06)",
        "tyro-md": "0 2px 6px rgba(30,58,95,0.05), 0 12px 36px rgba(30,58,95,0.08)",
        "tyro-lg": "0 4px 12px rgba(30,58,95,0.06), 0 24px 64px rgba(30,58,95,0.12)",
        "tyro-glow": "0 0 40px rgba(200,146,42,0.15)",
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        input: "10px",
        sidebar: "20px",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: { DEFAULT: "#1e3a5f", foreground: "#ffffff" },
            secondary: { DEFAULT: "#c8922a", foreground: "#ffffff" },
            success: { DEFAULT: "#10b981", foreground: "#ffffff" },
            warning: { DEFAULT: "#f59e0b", foreground: "#ffffff" },
            danger: { DEFAULT: "#ef4444", foreground: "#ffffff" },
          },
        },
      },
    }),
  ],
};
