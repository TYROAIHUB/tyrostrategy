import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "./" : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — cached long-term
          "chunk-react": ["react", "react-dom", "react-router-dom", "react-is"],
          // UI framework + animation — large, rarely changes
          "chunk-ui": ["@heroui/react", "framer-motion", "lucide-react"],
          // Charts — only needed on Dashboard
          "chunk-charts": ["recharts"],
          // Flow/graph — only needed on Strategy Map & T-Alignment
          "chunk-flow": ["@xyflow/react", "@dagrejs/dagre"],
          // Gantt — only needed on Gantt page
          "chunk-gantt": ["wx-react-gantt"],
          // Export libraries — only triggered on user action
          "chunk-export": ["pptxgenjs", "docx", "exceljs", "jspdf", "html2canvas", "file-saver"],
          // Rich text editor — only needed in forms
          "chunk-editor": ["@tiptap/react", "@tiptap/starter-kit", "@tiptap/extension-placeholder", "@tiptap/extension-underline"],
          // Azure AD auth
          "chunk-azure": ["@azure/msal-browser", "@azure/msal-react"],
          // Data layer
          "chunk-data": ["@tanstack/react-query", "@tanstack/react-table", "@supabase/supabase-js", "zustand"],
          // i18n
          "chunk-i18n": ["i18next", "react-i18next"],
        },
      },
    },
  },
}));
