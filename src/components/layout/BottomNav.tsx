import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { HomeIcon } from "@/components/ui/HomeIcon";
import { useDataStore } from "@/stores/dataStore";
import {
  BarChart3,
  Target,
  ListChecks,
  MoreHorizontal,
  GanttChart,
  GitMerge,
  Network,
  Users,
  Settings,
  Map,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { usePermissions } from "@/hooks/usePermissions";

export default function BottomNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useSidebarTheme();

  const mainItems = [
    { id: "workspace", label: t("nav.home"), icon: HomeIcon, path: "/workspace" },
    { id: "hedefler", label: t("nav.objectives"), icon: Target, path: "/hedefler", pageKey: "hedefler" as const },
    { id: "aksiyonlar", label: t("nav.actions"), icon: ListChecks, path: "/aksiyonlar", pageKey: "aksiyonlar" as const },
  ];

  const moreItems = [
    { id: "dashboard", label: t("nav.kpi"), icon: BarChart3, path: "/dashboard", pageKey: "kpi" as const },
    { id: "stratejik-karargah", label: t("nav.strategicHQ"), icon: Map, path: "/stratejik-karargah", pageKey: "stratejikKarargah" as const },
    { id: "t-alignment", label: t("nav.tAlignment"), icon: GitMerge, path: "/t-alignment", pageKey: "hedefler" as const },
    { id: "gantt", label: t("nav.gantt"), icon: GanttChart, path: "/gantt", pageKey: "gantt" as const },
    { id: "tree", label: t("nav.wbs"), icon: Network, path: "/tree", pageKey: "wbs" as const },
    { id: "users", label: t("nav.users"), icon: Users, path: "/kullanicilar", pageKey: "kullanicilar" as const },
    { id: "settings", label: t("nav.settings"), icon: Settings, path: "/ayarlar", pageKey: "ayarlar" as const },
  ];
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const { canAccessPage } = usePermissions();
  const riskCount = aksiyonlar.filter((a) => a.status === "Behind" || a.status === "At Risk").length;
  const [moreOpen, setMoreOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const accentColor = theme.accentColor;

  const filteredMainItems = mainItems.filter(
    (item) => !("pageKey" in item && item.pageKey) || canAccessPage(item.pageKey)
  );
  const filteredMoreItems = moreItems.filter(
    (item) => !("pageKey" in item && item.pageKey) || canAccessPage(item.pageKey)
  );

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = filteredMoreItems.some((item) => location.pathname === item.path);

  const allNavItems = [...filteredMainItems, ...(filteredMoreItems.length > 0 ? [{ id: "more", label: t("common.viewAll"), icon: MoreHorizontal, path: "__more__" }] : [])];
  const activeIndex = filteredMainItems.findIndex((item) => isActive(item.path));
  const moreIndex = filteredMainItems.length;
  const resolvedIndex = activeIndex >= 0 ? activeIndex : isMoreActive ? moreIndex : -1;

  // Measure active tab position for sliding indicator
  const updateIndicator = useCallback(() => {
    if (resolvedIndex < 0 || !navRef.current) return;
    const buttons = navRef.current.querySelectorAll<HTMLButtonElement>("[data-nav-item]");
    const btn = buttons[resolvedIndex];
    if (btn) {
      const navRect = navRef.current.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - navRect.left + btnRect.width / 2 - 16,
        width: 32,
      });
    }
  }, [resolvedIndex]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setMoreOpen(false);
  };

  return (
    <>
      {/* More menu backdrop */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            className="fixed inset-0 z-20 bg-black/10 backdrop-blur-[1px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMoreOpen(false)}
          />
        )}
      </AnimatePresence>

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* More menu popup */}
        <AnimatePresence>
          {moreOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-full right-2 mb-2 w-48 bg-tyro-surface/95 backdrop-blur-xl rounded-2xl border border-tyro-border/50 shadow-tyro-lg p-1.5"
            >
              {filteredMoreItems.map((item, i) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    onClick={() => handleNavigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                      active
                        ? "font-semibold"
                        : "text-tyro-text-secondary hover:bg-tyro-bg active:scale-[0.97]"
                    }`}
                    style={active ? { color: accentColor, backgroundColor: `${accentColor}12` } : undefined}
                  >
                    <Icon size={18} />
                    {item.label}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom nav bar — glassmorphism floating pill */}
        <div className="mx-3 mb-2 rounded-2xl bg-tyro-surface/70 backdrop-blur-2xl border border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.08)]">
          <div ref={navRef} className="relative flex items-center justify-around px-1 h-16">
            {/* Sliding dot indicator under active icon */}
            {resolvedIndex >= 0 && (
              <motion.div
                className="absolute bottom-1.5 h-[3px] rounded-full"
                style={{ backgroundColor: accentColor }}
                animate={{ left: indicatorStyle.left + 4, width: indicatorStyle.width - 8 }}
                transition={{ type: "spring", damping: 28, stiffness: 350, mass: 0.8 }}
              />
            )}

            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isMore = item.path === "__more__";
              const active = isMore ? (isMoreActive || moreOpen) : isActive(item.path);

              return (
                <button
                  key={item.id}
                  data-nav-item
                  onClick={() => isMore ? setMoreOpen((prev) => !prev) : handleNavigate(item.path)}
                  className="relative z-10 flex flex-col items-center justify-center min-w-[48px] min-h-[44px] gap-0.5 cursor-pointer"
                >
                  <motion.div
                    animate={active ? { scale: [1, 1.15, 1], y: -2 } : { scale: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <Icon
                      size={22}
                      strokeWidth={active ? 2.5 : 1.8}
                      className="transition-colors duration-200"
                      style={{ color: active ? accentColor : undefined }}
                    />
                  </motion.div>
                  {item.id === "aksiyonlar" && riskCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
                      {riskCount}
                    </span>
                  )}
                  <motion.span
                    animate={{ opacity: active ? 1 : 0.5, scale: active ? 1 : 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="text-[11px] font-semibold leading-tight"
                    style={{ color: active ? accentColor : undefined }}
                  >
                    {item.label}
                  </motion.span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
