import { create } from "zustand";
import i18n from "@/lib/i18n";
import type { SidebarThemeId } from "@/config/sidebarThemes";

interface UIState {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  activePage: string;
  mockLoggedIn: boolean;
  mockUserName: string;
  mockUserRole: string;
  mobileDrawerOpen: boolean;
  theme: "light" | "dark";
  sidebarTheme: SidebarThemeId;
  locale: "tr" | "en";
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setActivePage: (page: string) => void;
  setMockLoggedIn: (v: boolean) => void;
  setMockUserName: (name: string) => void;
  setMockUserRole: (role: string) => void;
  toggleMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  toggleTheme: () => void;
  setSidebarTheme: (theme: SidebarThemeId) => void;
  setLocale: (locale: "tr" | "en") => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  activePage: "dashboard",
  mockLoggedIn: false,
  mockUserName: localStorage.getItem("tyro-mock-user") || "Cenk Şayli",
  mockUserRole: localStorage.getItem("tyro-mock-role") || "Admin",
  mobileDrawerOpen: false,
  theme: (localStorage.getItem("tyro-theme") as "light" | "dark") || "light",
  sidebarTheme: (localStorage.getItem("tyro-sidebar-theme") as SidebarThemeId) || "light",
  locale: (localStorage.getItem("tyro-locale") as "tr" | "en") || "tr",
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  setActivePage: (page) => set({ activePage: page }),
  setMockLoggedIn: (v) => set({ mockLoggedIn: v }),
  setMockUserName: (name) => {
    localStorage.setItem("tyro-mock-user", name);
    set({ mockUserName: name });
  },
  setMockUserRole: (role) => {
    localStorage.setItem("tyro-mock-role", role);
    set({ mockUserRole: role });
  },
  toggleMobileDrawer: () =>
    set((state) => ({ mobileDrawerOpen: !state.mobileDrawerOpen })),
  closeMobileDrawer: () => set({ mobileDrawerOpen: false }),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "light" ? "dark" : "light";
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("tyro-theme", next);
      return { theme: next };
    }),
  setSidebarTheme: (theme) => {
    localStorage.setItem("tyro-sidebar-theme", theme);
    set({ sidebarTheme: theme });
  },
  setLocale: (locale) => {
    localStorage.setItem("tyro-locale", locale);
    i18n.changeLanguage(locale);
    set({ locale });
  },
}));
