import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, ArrowRight, BarChart3, FileText } from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import { usePermissions } from "@/hooks/usePermissions";
import { useUIStore } from "@/stores/uiStore";
import KPICard from "@/components/dashboard/KPICard";
import GlassCard from "@/components/ui/GlassCard";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import CircularProgress from "@/components/ui/CircularProgress";
import {
  EMPTY_DASHBOARD_FILTER,
  countActiveFilters,
  type DashboardFilter,
} from "@/components/dashboard/AdvancedFilterPanel";

// Lazy load heavy chart components (recharts ~200KB)
const ProjectStatusBreakdown = lazy(() => import("@/components/dashboard/ProjectStatusBreakdown"));
const MultiRingWidget = lazy(() => import("@/components/dashboard/MultiRingWidget"));
const ActivityFeed = lazy(() => import("@/components/dashboard/ActivityFeed"));
const AdvancedFilterPanel = lazy(() => import("@/components/dashboard/AdvancedFilterPanel"));
const RaporSihirbazi = lazy(() => import("@/components/dashboard/RaporSihirbazi"));
// Lighter — no recharts — can eagerly import
import BreakdownMatrixCard from "@/components/dashboard/BreakdownMatrixCard";
import TagDistributionCard from "@/components/dashboard/TagDistributionCard";

function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t("workspace.goodMorning");
  if (hour < 18) return t("workspace.goodAfternoon");
  return t("workspace.goodEvening");
}

function getSummaryText(
  aktivCount: number,
  gecikenCount: number,
  achievedCount: number,
  totalGorev: number,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  const completionRate = totalGorev > 0 ? Math.round((achievedCount / totalGorev) * 100) : 0;
  if (gecikenCount === 0) {
    return t("dashboard.summaryGood", { count: aktivCount, rate: completionRate });
  }
  return t("dashboard.summaryWarning", { activeCount: aktivCount, delayedCount: gecikenCount, rate: completionRate });
}

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 20 },
  },
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const sidebarTheme = useSidebarTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const activeTab = searchParams.get("tab") || "dashboard";
  const allProjeler = useDataStore((s) => s.projeler);
  const allAksiyonlar = useDataStore((s) => s.aksiyonlar);
  const { filterProjeler, filterAksiyonlar, canAccessPage } = usePermissions();
  const rlsProjeler = useMemo(() => filterProjeler(allProjeler), [allProjeler, filterProjeler]);
  const rlsAksiyonlar = useMemo(() => filterAksiyonlar(allAksiyonlar), [allAksiyonlar, filterAksiyonlar]);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);

  // ===== Advanced Filter — owned here, panel is controlled =====
  // Single state object so partial updates from the panel can be merged
  // with one setter call. RLS-filtered list above is the *base*; the
  // user-driven filter narrows it further before any KPI / chart math.
  const [filter, setFilter] = useState<DashboardFilter>(EMPTY_DASHBOARD_FILTER);
  const updateFilter = useCallback((next: Partial<DashboardFilter>) => {
    setFilter((prev) => ({ ...prev, ...next }));
  }, []);
  const clearFilter = useCallback(() => setFilter(EMPTY_DASHBOARD_FILTER), []);
  const activeFilterCount = countActiveFilters(filter);

  // Apply user filter on top of RLS-filtered list. Aksiyonlar follow
  // proje membership so a hidden proje's aksiyons disappear too.
  const projeler = useMemo(() => {
    let list = rlsProjeler;
    if (filter.kaynak.size > 0) list = list.filter((p) => filter.kaynak.has(p.source));
    if (filter.durum.size > 0) list = list.filter((p) => filter.durum.has(p.status));
    if (filter.departman.size > 0) list = list.filter((p) => filter.departman.has(p.department));
    if (filter.lider.size > 0) list = list.filter((p) => filter.lider.has(p.owner));
    // Date range: project overlaps [from, to] window when its end >= from AND start <= to
    if (filter.dateFrom) list = list.filter((p) => p.endDate >= filter.dateFrom);
    if (filter.dateTo) list = list.filter((p) => p.startDate <= filter.dateTo);
    if (filter.progressMin > 0) list = list.filter((p) => p.progress >= filter.progressMin);
    if (filter.progressMax < 100) list = list.filter((p) => p.progress <= filter.progressMax);
    return list;
  }, [rlsProjeler, filter]);

  const aksiyonlar = useMemo(() => {
    if (activeFilterCount === 0) return rlsAksiyonlar;
    const ids = new Set(projeler.map((p) => p.id));
    return rlsAksiyonlar.filter((a) => ids.has(a.projeId));
  }, [rlsAksiyonlar, projeler, activeFilterCount]);

  // ===== KPI Hesaplamaları (tamamen veriye dayalı) =====

  // KPI 1: Proje Tamamlanma — tüm aksiyonları "Achieved" olan projeler
  const projeTamamlanan = useMemo(
    () =>
      projeler.filter((h) => {
        const aksiyonlarForH = aksiyonlar.filter((a) => a.projeId === h.id);
        if (aksiyonlarForH.length === 0) return false;
        return aksiyonlarForH.every((a) => a.status === "Achieved");
      }),
    [projeler, aksiyonlar]
  );
  const projeProgress =
    projeler.length > 0 ? Math.round((projeTamamlanan.length / projeler.length) * 100) : 0;

  // Single-pass status counts + avg progress.
  // 2026-05-10 (kullanıcı geri bildirimi): avg progress yalnızca "Yolunda",
  // "Riskte" ve "Yüksek Riskte" statülerini sayar. Eskiden On Hold + Cancelled
  // dışında her şey ortalamaya giriyordu — bu da Achieved (100%) ve Not
  // Started (0%) kayıtlarını dahil edip "şu an çalışılan portföy" ölçümünü
  // bulanıklaştırıyordu. Yeni tanım: progress ortalaması SADECE in-flight
  // (on-track / risky) projeler için anlamlı; tamamlananı katmaz (zaten
  // %100), başlanmamışı katmaz (zaten %0), askıdaki/iptali katmaz.
  const { statusCounts, avgProgress, activeCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    let activeTotal = 0;
    let activeN = 0;
    for (const h of projeler) {
      counts[h.status] = (counts[h.status] ?? 0) + 1;
      if (h.status === "On Track" || h.status === "At Risk" || h.status === "High Risk") {
        activeTotal += h.progress;
        activeN += 1;
      }
    }
    return {
      statusCounts: counts,
      avgProgress: activeN > 0 ? Math.round(activeTotal / activeN) : 0,
      activeCount: activeN,
    };
  }, [projeler]);

  const onTrackCount = statusCounts["On Track"] ?? 0;
  const behindCount = statusCounts["High Risk"] ?? 0;
  const atRiskCount = statusCounts["At Risk"] ?? 0;
  // Aktif = Yolunda + Riskte + Yüksek Riskte (kullanıcı isteği 2026-05-10):
  // High Risk eskiden bu sayıma dahil değildi, Askıda (On Hold) ise
  // navigate filtresine sızıyordu. Şimdi her ikisi de düzeltildi —
  // tıklayınca açılan kokpit filtresi de aynı 3 statüyü gösterir.
  const aktivProjeler = projeler.filter((h) => h.status === "On Track" || h.status === "At Risk" || h.status === "High Risk");
  const gecikenProjeler = projeler.filter((h) => h.status === "High Risk" || h.status === "At Risk");

  const kpiCards = [
    {
      label: t("dashboard.projectCompletion"),
      value: projeTamamlanan.length,
      target: projeler.length,
      icon: "Target",
      color: "var(--tyro-navy)",
      progress: projeProgress,
      contextText: t("dashboard.projectCount", { completed: projeTamamlanan.length, total: projeler.length }),
      onClick: () => navigate("/stratejik-kokpit?status=Achieved"),
    },
    {
      label: t("dashboard.activeProjects"),
      value: aktivProjeler.length,
      icon: "Target",
      color: "var(--tyro-gold)",
      trend: onTrackCount,
      trendLabel: t("dashboard.onTrackTrend"),
      contextText: t("dashboard.totalProjects", { count: projeler.length }),
      onClick: () => navigate("/stratejik-kokpit?status=On Track,At Risk,High Risk"),
    },
    {
      label: t("dashboard.delayedRisky"),
      value: gecikenProjeler.length,
      icon: "AlertTriangle",
      color: "var(--tyro-danger)",
      trend: behindCount,
      trendLabel: t("dashboard.behindTrend", { atRisk: atRiskCount }),
      contextText: t("dashboard.totalProjectsOf", { count: projeler.length }),
      onClick: () => navigate("/stratejik-kokpit?status=High Risk,At Risk"),
    },
    {
      label: t("dashboard.avgProgress"),
      value: avgProgress,
      suffix: "%",
      icon: "BarChart3",
      color: "var(--tyro-info)",
      progress: avgProgress,
      contextText: t("dashboard.projectAverage", { count: activeCount }),
      onClick: () => navigate("/stratejik-kokpit"),
    },
  ];

  const switchTab = (tab: string) => {
    setSearchParams(tab === "dashboard" ? {} : { tab });
  };

  // ===== Tab render helper =====
  const accentColor = sidebarTheme.accentColor ?? "#c8922a";

  // Rapor Konfigürasyonu tab is gated by the `raporKonfigurasyonu`
  // page permission — role defaults give it to Admin/Proje Lideri/
  // Management but not to the standard Kullanıcı role.
  const canSeeReportTab = canAccessPage("raporKonfigurasyonu");
  const tabItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    ...(canSeeReportTab
      ? [{ id: "rapor", label: t("dashboard.reportWizard"), icon: FileText }]
      : []),
  ];

  // Desktop tabs — original style
  const renderDesktopTabs = () => (
    <div className="hidden sm:flex items-center gap-1 text-[12px] print:hidden">
      {tabItems.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              isActive
                ? "shadow-sm"
                : "text-tyro-text-muted hover:bg-tyro-bg hover:text-tyro-text-secondary"
            }`}
            style={isActive ? { backgroundColor: sidebarTheme.bg, color: sidebarTheme.isDark !== false ? "#ffffff" : "#1e293b" } : undefined}
          >
            <Icon size={14} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  // Mobile tabs — Liquid Glass style
  const renderMobileTabs = () => (
    <div className="sm:hidden flex items-center bg-white/40 dark:bg-tyro-surface/30 backdrop-blur-[24px] backdrop-saturate-[1.6] rounded-xl border border-white/40 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.5)] p-1 print:hidden">
      {tabItems.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className="relative flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-semibold cursor-pointer flex-1 justify-center transition-colors whitespace-nowrap"
            style={{ color: isActive ? accentColor : "var(--tyro-text-muted)" }}
          >
            {isActive && (
              <motion.div
                layoutId="dashboard-tab-pill"
                className="absolute inset-0 rounded-lg"
                style={{
                  background: `radial-gradient(ellipse at 50% 30%, ${accentColor}18, ${accentColor}08 70%, transparent 100%)`,
                  boxShadow: `0 1px 8px ${accentColor}15, inset 0 1px 2px rgba(255,255,255,0.6)`,
                  border: `1px solid ${accentColor}12`,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon size={14} />
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  // ===== Rapor Konfigürasyonu tab =====
  // Also guard against URL-typed ?tab=rapor when the user lacks the perm.
  if (activeTab === "rapor" && canSeeReportTab) {
    return (
      <div>
        <div className="flex items-center justify-between mb-5 print:hidden">
          {renderMobileTabs()}
          {renderDesktopTabs()}
        </div>
        <Suspense fallback={<div className="flex items-center justify-center py-20 text-tyro-text-muted">{t("dashboard.loading")}</div>}>
          <RaporSihirbazi />
        </Suspense>
      </div>
    );
  }

  return (
    <motion.div className="space-y-5" variants={stagger} initial="hidden" animate="show">
      {/* Page Header — Tabs + Greeting + Summary */}
      <motion.div variants={fadeUp} className="space-y-3 sm:space-y-0">
        {/* Mobile: tabs + filter icon inline */}
        <div className="flex items-center justify-between gap-2 sm:hidden">
          <div className="min-w-0 flex-1">{renderMobileTabs()}</div>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="relative h-9 w-9 rounded-lg border border-tyro-border bg-tyro-surface flex items-center justify-center cursor-pointer hover:bg-tyro-navy/5 transition-colors shrink-0"
            aria-label={t("common.filter")}
          >
            <SlidersHorizontal size={15} className="text-tyro-text-secondary" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-tyro-navy text-white text-[9px] font-bold leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Desktop: tabs + search + filter */}
        <div className="hidden sm:flex items-start justify-between gap-3">
          <div className="min-w-0">{renderDesktopTabs()}</div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openCommandPalette}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-button border border-tyro-border bg-tyro-surface text-tyro-text-secondary hover:border-tyro-navy/20 transition-colors cursor-pointer"
            >
              <Search size={16} />
              <span className="text-[13px] text-tyro-text-muted">{t("common.search")}</span>
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-tyro-bg border border-tyro-border text-[11px] font-mono text-tyro-text-muted ml-2">
                ⌘K
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className={`inline-flex items-center gap-2 h-10 px-4 rounded-button border transition-colors cursor-pointer ${
                activeFilterCount > 0
                  ? "border-tyro-navy/40 bg-tyro-navy/5 text-tyro-navy hover:bg-tyro-navy/10"
                  : "border-tyro-border bg-tyro-surface text-tyro-text-secondary hover:border-tyro-navy/20 hover:text-tyro-navy"
              }`}
            >
              <SlidersHorizontal size={16} />
              <span className="text-[13px] font-semibold">{t("common.filter")}</span>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-tyro-navy text-white text-[10px] font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Advanced Filter Panel */}
      <Suspense fallback={null}>
        <AdvancedFilterPanel
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          filter={filter}
          onChange={updateFilter}
          onClear={clearFilter}
        />
      </Suspense>

      {/* Row 1: 4 KPI Cards — equal height */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        <motion.div key={kpiCards[0].label} variants={fadeUp} className="flex">
          <ActiveBentoCard kpi={kpiCards[0]} />
        </motion.div>
        {kpiCards.slice(1).map((kpi) => (
          <motion.div key={kpi.label} variants={fadeUp} className="flex">
            <KPICard {...kpi} onClick={kpi.onClick} />
          </motion.div>
        ))}
      </div>

      {/* Row 2: Tabbed breakdown matrix (9) + maturity tag card (3) —
           the right-hand card is sized to line up with the 4th KPI
           tile in the row above (KPIs are grid-cols-4, so each is 3/12). */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        <motion.div variants={fadeUp} className="lg:col-span-9 flex">
          <BreakdownMatrixCard projeler={projeler} />
        </motion.div>
        <motion.div variants={fadeUp} className="lg:col-span-3 flex">
          <TagDistributionCard projeler={projeler} />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ===== Active Bento Card =====
interface ActiveBentoCardProps {
  kpi: {
    label: string;
    value: number;
    target?: number;
    prefix?: string;
    suffix?: string;
    icon: string;
    color: string;
    progress?: number;
    trend?: number;
    trendLabel?: string;
    contextText?: string;
  };
}

function ActiveBentoCard({ kpi }: ActiveBentoCardProps) {
  const navigate = useNavigate();
  const trendIsPositive = kpi.trend !== undefined && kpi.trend >= 0;
  const trendColor = trendIsPositive ? "text-tyro-success" : "text-tyro-danger";

  // Hover-detay paneli kaldırıldı (kullanıcı isteği 2026-05-22): kart zaten
  // tıklayınca filtreli Kokpit'e gidiyor, üzerine gelince ek bilgi panelinin
  // anlamı kalmamış.
  return (
    <div className="flex-1 flex flex-col">
      <GlassCard className="p-6 overflow-hidden flex-1 flex flex-col cursor-pointer" onClick={() => navigate("/stratejik-kokpit?status=Achieved")}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-semibold text-tyro-text-secondary">{kpi.label}</span>
          <div
            className="flex items-center justify-center w-9 h-9 rounded-button"
            style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
            </svg>
          </div>
        </div>

        <div className="text-3xl font-extrabold tracking-tight tabular-nums leading-none mb-3 text-tyro-text-primary">
          <AnimatedCounter value={kpi.value} prefix={kpi.prefix ?? ""} suffix={kpi.suffix ?? ""} />
          {kpi.target !== undefined && (
            <span className="text-base font-medium text-tyro-text-muted ml-1">/ {kpi.target}</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col gap-0.5">
            {kpi.trend !== undefined && (
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${trendColor}`}>
                  {trendIsPositive ? "↑" : "↓"} {kpi.trend}
                </span>
                {kpi.trendLabel && <span className="text-xs text-tyro-text-muted">{kpi.trendLabel}</span>}
              </div>
            )}
            {kpi.contextText && (
              <span className="text-[11px] text-tyro-text-muted">{kpi.contextText}</span>
            )}
          </div>
          {kpi.progress !== undefined && (
            <CircularProgress progress={kpi.progress} size={44} strokeWidth={4} color={kpi.color}>
              <span className="text-[11px] font-bold text-tyro-text-secondary">{kpi.progress}%</span>
            </CircularProgress>
          )}
        </div>

      </GlassCard>
    </div>
  );
}

// The former DepartmentDistribution / LeaderDistribution inline
// components + their STATUS_COLORS / useStatusLabels helpers were
// deleted when the dashboard moved to the consolidated
// BreakdownMatrixCard — see src/components/dashboard/BreakdownMatrixCard.tsx.
// Shared palette now lives at src/lib/statusColors.ts.

