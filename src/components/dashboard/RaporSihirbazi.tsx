import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Printer, Download, ChevronDown, ChevronUp,
  Check, X, AlertTriangle, Clock, PauseCircle, Ban,
  Filter, RefreshCw, CheckSquare, Square, Settings2,
} from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import { useUIStore } from "@/stores/uiStore";
import GlassCard from "@/components/ui/GlassCard";
import type { Hedef, Aksiyon, Source, EntityStatus } from "@/types";

// ===== Types =====
interface ReportTab {
  id: string;
  label: string;
  source: Source;
  icon: string;
  color: string;
}

const REPORT_TABS: ReportTab[] = [
  { id: "turkiye", label: "Türkiye", source: "Türkiye", icon: "TR", color: "#c8922a" },
  { id: "international", label: "International", source: "International", icon: "🌍", color: "#10b981" },
  { id: "kurumsal", label: "Kurumsal & Paylaşımlı", source: "Kurumsal", icon: "🏢", color: "#3b82f6" },
];

const SECTIONS = [
  { id: "summary", label: "Genel Özet", default: true },
  { id: "progressChart", label: "İlerleme Dağılımı Grafiği", default: true },
  { id: "deptTable", label: "Departman Tablosu", default: true },
  { id: "attention", label: "Dikkat Gerektiren", default: true },
  { id: "details", label: "Hedef Detayları", default: true },
  { id: "steps", label: "Aksiyonlar", default: true },
];

const STATUS_LABELS: Record<EntityStatus, string> = {
  "On Track": "Devam Ediyor",
  "At Risk": "Risk Altında",
  "Behind": "Geride",
  "Achieved": "Tamamlandı",
  "Not Started": "Başlamadı",
  "On Hold": "Askıya Alındı",
  "Cancelled": "İptal",
};

const STATUS_COLORS: Record<EntityStatus, string> = {
  "On Track": "#3b82f6",
  "At Risk": "#f59e0b",
  "Behind": "#ef4444",
  "Achieved": "#10b981",
  "Not Started": "#94a3b8",
  "On Hold": "#8b5cf6",
  "Cancelled": "#6b7280",
};

const STATUS_ICONS: Record<EntityStatus, typeof Check> = {
  "On Track": Clock,
  "At Risk": AlertTriangle,
  "Behind": AlertTriangle,
  "Achieved": Check,
  "Not Started": Clock,
  "On Hold": PauseCircle,
  "Cancelled": Ban,
};

function getProgressBucket(p: number) {
  if (p >= 100) return { label: "Tamamlandı (100%)", color: "#10b981" };
  if (p >= 60) return { label: "İlerlemiş (60–99%)", color: "#3b82f6" };
  if (p >= 30) return { label: "Orta (30–59%)", color: "#d4a017" };
  return { label: "Başlamadı (0%)", color: "#94a3b8" };
}

function getRiskLevel(h: Hedef, aksiyonlar: Aksiyon[]): "Düşük" | "Orta" | "Yüksek" {
  const hAksiyonlar = aksiyonlar.filter((a) => a.hedefId === h.id);
  const behindCount = hAksiyonlar.filter((a) => a.status === "Behind").length;
  const ratio = hAksiyonlar.length > 0 ? behindCount / hAksiyonlar.length : 0;
  if (ratio > 0.5) return "Yüksek";
  if (ratio > 0.2) return "Orta";
  return "Düşük";
}

// ===== Component =====
export default function RaporSihirbazi() {
  const hedefler = useDataStore((s) => s.hedefler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);
  const reportRef = useRef<HTMLDivElement>(null);

  // State
  const [activeTabId, setActiveTabId] = useState("turkiye");
  const [tabName, setTabName] = useState("Türkiye");
  const [reportTitle, setReportTitle] = useState("Türkiye Hedefleri Durum Raporu");
  const [selectedHedefIds, setSelectedHedefIds] = useState<Set<string>>(new Set());
  const [initializedTabs, setInitializedTabs] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sections, setSections] = useState(() =>
    Object.fromEntries(SECTIONS.map((s) => [s.id, s.default]))
  );
  const [expandedHedef, setExpandedHedef] = useState<string | null>(null);

  const activeTab = REPORT_TABS.find((t) => t.id === activeTabId)!;

  // Filter hedefler by source
  const sourceHedefler = useMemo(
    () => hedefler.filter((h) => h.source === activeTab.source),
    [hedefler, activeTab.source]
  );

  // Initialize selection when switching tabs
  const initTab = (tabId: string) => {
    if (!initializedTabs.has(tabId)) {
      const tab = REPORT_TABS.find((t) => t.id === tabId)!;
      const ids = hedefler.filter((h) => h.source === tab.source).map((h) => h.id);
      setSelectedHedefIds(new Set(ids));
      setInitializedTabs((prev) => new Set([...prev, tabId]));
    }
  };

  // Init first tab
  useMemo(() => initTab("turkiye"), []);

  // Apply filters
  const filteredHedefler = useMemo(() => {
    return sourceHedefler.filter((h) => {
      if (statusFilter !== "all" && h.status !== statusFilter) return false;
      if (categoryFilter !== "all" && h.department !== categoryFilter) return false;
      return true;
    });
  }, [sourceHedefler, statusFilter, categoryFilter]);

  // Selected & filtered
  const reportHedefler = useMemo(
    () => filteredHedefler.filter((h) => selectedHedefIds.has(h.id)),
    [filteredHedefler, selectedHedefIds]
  );

  // Departments
  const departments = useMemo(() => {
    const depts = [...new Set(sourceHedefler.map((h) => h.department))].filter(Boolean);
    return depts.sort();
  }, [sourceHedefler]);

  // ===== Report computations =====
  const reportAksiyonlar = useMemo(
    () => aksiyonlar.filter((a) => reportHedefler.some((h) => h.id === a.hedefId)),
    [aksiyonlar, reportHedefler]
  );

  const avgProgress = useMemo(() => {
    if (reportHedefler.length === 0) return 0;
    const total = reportHedefler.reduce((sum, h) => {
      const hAks = aksiyonlar.filter((a) => a.hedefId === h.id);
      if (hAks.length === 0) return sum + h.progress;
      return sum + Math.round(hAks.reduce((s, a) => s + a.progress, 0) / hAks.length);
    }, 0);
    return Math.round(total / reportHedefler.length);
  }, [reportHedefler, aksiyonlar]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      active: 0, achieved: 0, onHold: 0, cancelled: 0, behind: 0,
    };
    reportHedefler.forEach((h) => {
      if (h.status === "Achieved") counts.achieved++;
      else if (h.status === "On Hold") counts.onHold++;
      else if (h.status === "Cancelled") counts.cancelled++;
      else if (h.status === "Behind") counts.behind++;
      else counts.active++;
    });
    return counts;
  }, [reportHedefler]);

  // Progress buckets for pie chart
  const progressBuckets = useMemo(() => {
    const buckets = { completed: 0, advanced: 0, mid: 0, notStarted: 0 };
    reportHedefler.forEach((h) => {
      const hAks = aksiyonlar.filter((a) => a.hedefId === h.id);
      const prog = hAks.length > 0
        ? Math.round(hAks.reduce((s, a) => s + a.progress, 0) / hAks.length)
        : h.progress;
      if (prog >= 100) buckets.completed++;
      else if (prog >= 60) buckets.advanced++;
      else if (prog >= 30) buckets.mid++;
      else buckets.notStarted++;
    });
    return buckets;
  }, [reportHedefler, aksiyonlar]);

  // Dept breakdown
  const deptBreakdown = useMemo(() => {
    const map: Record<string, { total: number; active: number; achieved: number; behind: number }> = {};
    reportHedefler.forEach((h) => {
      const dept = h.department || "Belirtilmemiş";
      if (!map[dept]) map[dept] = { total: 0, active: 0, achieved: 0, behind: 0 };
      map[dept].total++;
      if (h.status === "Achieved") map[dept].achieved++;
      else if (h.status === "Behind") map[dept].behind++;
      else map[dept].active++;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [reportHedefler]);

  // Attention items (Behind or At Risk)
  const attentionItems = useMemo(
    () => reportHedefler.filter((h) => h.status === "Behind" || h.status === "At Risk"),
    [reportHedefler]
  );

  // Handlers
  const toggleHedef = (id: string) => {
    setSelectedHedefIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedHedefIds(new Set(filteredHedefler.map((h) => h.id)));
  };

  const clearAll = () => {
    setSelectedHedefIds(new Set());
  };

  const switchTab = (tabId: string) => {
    const tab = REPORT_TABS.find((t) => t.id === tabId)!;
    setActiveTabId(tabId);
    setTabName(tab.label);
    setReportTitle(`${tab.label} Hedefleri Durum Raporu`);
    initTab(tabId);
    setStatusFilter("all");
    setCategoryFilter("all");
  };

  const toggleSection = (id: string) => {
    setSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => {
    window.print();
  };

  // Pie chart SVG
  const PieChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return <div className="text-tyro-text-muted text-sm text-center py-8">Veri yok</div>;
    let cumulative = 0;
    const slices = data.filter((d) => d.value > 0).map((d) => {
      const startAngle = (cumulative / total) * 360;
      cumulative += d.value;
      const endAngle = (cumulative / total) * 360;
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
      const r = 80;
      const cx = 100, cy = 100;
      const x1 = cx + r * Math.cos((Math.PI * (startAngle - 90)) / 180);
      const y1 = cy + r * Math.sin((Math.PI * (startAngle - 90)) / 180);
      const x2 = cx + r * Math.cos((Math.PI * (endAngle - 90)) / 180);
      const y2 = cy + r * Math.sin((Math.PI * (endAngle - 90)) / 180);
      return { ...d, path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z` };
    });

    return (
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <svg viewBox="0 0 200 200" className="w-[160px] h-[160px] shrink-0">
          {slices.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2" />
          ))}
        </svg>
        <div className="flex flex-col gap-2">
          {data.filter((d) => d.value > 0).map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-[12px] text-tyro-text-secondary flex-1">{d.label}</span>
              <span className="text-[12px] font-bold text-tyro-text-primary w-5 text-right">{d.value}</span>
              <span className="text-[11px] text-tyro-text-muted w-10 text-right">
                {total > 0 ? Math.round((d.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-0 h-[calc(100vh-120px)] print:h-auto print:block">
      {/* ===== LEFT PANEL — Settings ===== */}
      <div className="w-[280px] shrink-0 border-r border-tyro-border/30 overflow-y-auto print:hidden">
        <div className="p-4 space-y-4">
          {/* Tab header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-md text-white"
                style={{ backgroundColor: activeTab.color }}
              >
                {activeTab.icon}
              </span>
              <span className="text-[13px] font-bold text-tyro-text-primary">
                {activeTab.label} Ayarları
              </span>
            </div>
            <p className="text-[11px] text-tyro-text-secondary">Dahil edilecek projeleri seçin</p>
          </div>

          {/* Tab name */}
          <div>
            <label className="text-[10px] font-bold uppercase text-tyro-text-muted tracking-wider mb-1 block">
              Sekme Adı
            </label>
            <input
              value={tabName}
              onChange={(e) => setTabName(e.target.value)}
              className="w-full text-[12px] px-3 py-2 rounded-lg border border-tyro-border bg-tyro-surface text-tyro-text-primary"
            />
          </div>

          {/* Report title */}
          <div>
            <label className="text-[10px] font-bold uppercase text-tyro-text-muted tracking-wider mb-1 block">
              Rapor Başlığı
            </label>
            <input
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full text-[12px] px-3 py-2 rounded-lg border border-tyro-border bg-tyro-surface text-tyro-text-primary"
            />
          </div>

          {/* Filters */}
          <div>
            <label className="text-[10px] font-bold uppercase text-tyro-text-muted tracking-wider mb-1.5 flex items-center gap-1.5">
              <Filter size={11} /> Hedefler
              <button onClick={selectAll} className="ml-auto text-[10px] text-tyro-gold hover:underline cursor-pointer">Tümü</button>
              <button onClick={clearAll} className="text-[10px] text-tyro-text-muted hover:underline cursor-pointer">Temizle</button>
            </label>

            <div className="flex gap-1.5 mb-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 text-[11px] px-2 py-1.5 rounded-lg border border-tyro-border bg-tyro-surface text-tyro-text-primary"
              >
                <option value="all">Tüm Kategoriler</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 text-[11px] px-2 py-1.5 rounded-lg border border-tyro-border bg-tyro-surface text-tyro-text-primary"
              >
                <option value="all">Tüm Durumlar</option>
                {(Object.keys(STATUS_LABELS) as EntityStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            {/* Hedefct list */}
            <div className="max-h-[280px] overflow-y-auto space-y-0.5 border border-tyro-border/20 rounded-lg p-1">
              {filteredHedefler.map((h) => (
                <button
                  key={h.id}
                  onClick={() => toggleHedef(h.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-tyro-bg transition-colors text-left cursor-pointer"
                >
                  {selectedHedefIds.has(h.id) ? (
                    <CheckSquare size={14} className="text-tyro-gold shrink-0" />
                  ) : (
                    <Square size={14} className="text-tyro-text-muted shrink-0" />
                  )}
                  <span className="text-[11px] text-tyro-text-primary truncate flex-1">{h.name}</span>
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      backgroundColor: `${STATUS_COLORS[h.status]}15`,
                      color: STATUS_COLORS[h.status],
                    }}
                  >
                    {STATUS_LABELS[h.status]}
                  </span>
                </button>
              ))}
              {filteredHedefler.length === 0 && (
                <p className="text-[11px] text-tyro-text-muted text-center py-4">Filtre sonucu boş</p>
              )}
            </div>
          </div>

          {/* Sections */}
          <div>
            <label className="text-[10px] font-bold uppercase text-tyro-text-muted tracking-wider mb-1.5 flex items-center gap-1.5">
              <Settings2 size={11} /> Bölümler
            </label>
            <div className="space-y-1">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleSection(s.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-tyro-bg transition-colors cursor-pointer"
                >
                  {sections[s.id] ? (
                    <CheckSquare size={14} className="text-tyro-gold shrink-0" />
                  ) : (
                    <Square size={14} className="text-tyro-text-muted shrink-0" />
                  )}
                  <span className="text-[11px] text-tyro-text-primary">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                /* Re-generate by switching sections or something */
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-tyro-navy text-white text-[12px] font-semibold hover:bg-tyro-navy-light transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
              Raporu Güncelle
            </button>
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-tyro-border text-tyro-text-primary text-[12px] font-semibold hover:bg-tyro-bg transition-colors cursor-pointer"
            >
              <Printer size={14} />
              Yazdır / PDF
            </button>
          </div>

          {/* Export */}
          <div className="pt-1">
            <label className="text-[10px] font-bold uppercase text-tyro-text-muted tracking-wider mb-1 block">
              Dışa Aktar
            </label>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-tyro-border text-[11px] text-tyro-text-secondary hover:bg-tyro-bg cursor-pointer"
              >
                <Download size={12} /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL — Report Preview ===== */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/20">
        {/* Tabs */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-tyro-surface/80 backdrop-blur-lg border-b border-tyro-border/30 px-6 flex items-center gap-1 print:hidden">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-[12px] font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTabId === tab.id
                  ? "border-current text-tyro-navy"
                  : "border-transparent text-tyro-text-muted hover:text-tyro-text-secondary"
              }`}
              style={activeTabId === tab.id ? { color: tab.color, borderColor: tab.color } : undefined}
            >
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: tab.color }}
              >
                {tab.icon}
              </span>
              {tab.label}
              {activeTabId === tab.id && (
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); }}
                  className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 cursor-pointer"
                >
                  <X size={10} />
                </span>
              )}
            </button>
          ))}
          <button className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center border border-tyro-border text-tyro-text-muted hover:bg-tyro-bg cursor-pointer print:hidden">
            +
          </button>
        </div>

        {/* Report Content */}
        <div ref={reportRef} className="max-w-[900px] mx-auto py-8 px-8 print:max-w-full print:px-12 print:py-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-[22px] font-bold text-tyro-navy tracking-tight">
              TİRYAKİ AGRO HOLDİNG · TYRO Strategy
            </h1>
            <h2 className="text-[14px] font-bold text-tyro-gold uppercase tracking-wider mt-1">
              {reportTitle}
            </h2>
            <p className="text-[12px] text-tyro-text-secondary mt-1">
              {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              {" · "}
              {reportHedefler.length} proje
            </p>
            <div className="h-1 bg-tyro-navy mt-4 rounded-full" />
          </div>

          {/* 1. Genel Özet */}
          {sections.summary && (
            <section className="mb-8">
              <h3 className="flex items-center gap-2 text-[13px] font-bold text-tyro-navy uppercase tracking-wider mb-4">
                <span className="w-1 h-5 bg-tyro-navy rounded-full" />
                1. Genel Özet
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: "Toplam", value: reportHedefler.length, color: "#1e3a5f" },
                  { label: "Devam", value: statusCounts.active, color: "#3b82f6" },
                  { label: "Tamamlanan", value: statusCounts.achieved, color: "#10b981" },
                  { label: "Askıda", value: statusCounts.onHold, color: "#8b5cf6" },
                  { label: "İptal", value: statusCounts.cancelled, color: "#ef4444" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="text-center py-4 rounded-xl border border-tyro-border/30 bg-white dark:bg-tyro-surface"
                  >
                    <p className="text-[10px] font-bold uppercase text-tyro-text-muted tracking-wider mb-1">
                      {item.label}
                    </p>
                    <p className="text-[28px] font-extrabold" style={{ color: item.color }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2. İlerleme Dağılımı */}
          {sections.progressChart && (
            <section className="mb-8">
              <h3 className="flex items-center gap-2 text-[13px] font-bold text-tyro-navy uppercase tracking-wider mb-4">
                <span className="w-1 h-5 bg-tyro-navy rounded-full" />
                2. Genel İlerleme Dağılımı
              </h3>
              <div className="rounded-xl border border-tyro-border/30 bg-white dark:bg-tyro-surface p-6">
                <PieChart
                  data={[
                    { label: "Tamamlandı (100%)", value: progressBuckets.completed, color: "#10b981" },
                    { label: "İlerlemiş (60–99%)", value: progressBuckets.advanced, color: "#3b82f6" },
                    { label: "Orta (30–59%)", value: progressBuckets.mid, color: "#d4a017" },
                    { label: "Başlamadı (0%)", value: progressBuckets.notStarted, color: "#94a3b8" },
                  ]}
                />
                <div className="text-center mt-4 pt-4 border-t border-tyro-border/20">
                  <p className="text-[10px] uppercase font-bold text-tyro-text-muted tracking-wider">
                    Ortalama İlerleme
                  </p>
                  <p className="text-[28px] font-extrabold text-tyro-gold">{avgProgress}%</p>
                  <div className="w-32 h-2 rounded-full bg-tyro-border/20 mx-auto mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all"
                      style={{ width: `${avgProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 3. Departman Bazlı Durum */}
          {sections.deptTable && deptBreakdown.length > 0 && (
            <section className="mb-8">
              <h3 className="flex items-center gap-2 text-[13px] font-bold text-tyro-navy uppercase tracking-wider mb-4">
                <span className="w-1 h-5 bg-tyro-navy rounded-full" />
                3. Departman Bazlı Durum
              </h3>
              <div className="rounded-xl border border-tyro-border/30 overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-tyro-navy text-white">
                      <th className="text-left px-4 py-2.5 font-semibold">Departman</th>
                      <th className="text-center px-4 py-2.5 font-semibold">Toplam</th>
                      <th className="text-center px-4 py-2.5 font-semibold">Aktif</th>
                      <th className="text-center px-4 py-2.5 font-semibold">Tamamlanan</th>
                      <th className="text-center px-4 py-2.5 font-semibold">Geride</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptBreakdown.map(([dept, data], i) => (
                      <tr key={dept} className={i % 2 === 0 ? "bg-white dark:bg-tyro-surface" : "bg-slate-50/50 dark:bg-slate-800/20"}>
                        <td className="px-4 py-2.5 font-semibold text-tyro-text-primary">{dept}</td>
                        <td className="text-center px-4 py-2.5 text-tyro-text-primary font-bold">{data.total}</td>
                        <td className="text-center px-4 py-2.5 text-blue-600 font-bold">{data.active}</td>
                        <td className="text-center px-4 py-2.5 text-emerald-600 font-bold">{data.achieved}</td>
                        <td className="text-center px-4 py-2.5 font-bold" style={{ color: data.behind > 0 ? "#ef4444" : "#64748b" }}>
                          {data.behind}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 4. Dikkat Gerektiren Hedefler */}
          {sections.attention && attentionItems.length > 0 && (
            <section className="mb-8">
              <h3 className="flex items-center gap-2 text-[13px] font-bold text-red-600 uppercase tracking-wider mb-4">
                <span className="w-1 h-5 bg-red-500 rounded-full" />
                4. Dikkat Gerektiren Hedefler
              </h3>
              <div className="space-y-2">
                {attentionItems.map((h) => {
                  const risk = getRiskLevel(h, aksiyonlar);
                  return (
                    <div
                      key={h.id}
                      className="flex items-center justify-between px-4 py-3 rounded-xl border border-red-200/50 bg-red-50/30 dark:bg-red-900/10"
                    >
                      <div>
                        <p className="text-[12px] font-semibold text-tyro-text-primary">{h.name}</p>
                        <p className="text-[11px] text-tyro-text-secondary">
                          {h.department} · {h.owner} · Bitiş: {h.endDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-semibold px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: `${STATUS_COLORS[h.status]}15`,
                            color: STATUS_COLORS[h.status],
                          }}
                        >
                          {STATUS_LABELS[h.status]}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                            risk === "Yüksek"
                              ? "bg-red-100 text-red-600"
                              : risk === "Orta"
                              ? "bg-amber-100 text-amber-600"
                              : "bg-emerald-100 text-emerald-600"
                          }`}
                        >
                          {risk}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 5. Hedef Detayları */}
          {sections.details && (
            <section className="mb-8">
              <h3 className="flex items-center gap-2 text-[13px] font-bold text-tyro-navy uppercase tracking-wider mb-4">
                <span className="w-1 h-5 bg-tyro-navy rounded-full" />
                5. Hedef Detayları
              </h3>
              <div className="space-y-4">
                {reportHedefler.map((h) => {
                  const hAksiyonlar = aksiyonlar.filter((a) => a.hedefId === h.id);
                  const hProgress = hAksiyonlar.length > 0
                    ? Math.round(hAksiyonlar.reduce((s, a) => s + a.progress, 0) / hAksiyonlar.length)
                    : h.progress;
                  const risk = getRiskLevel(h, aksiyonlar);
                  const isExpanded = expandedHedef === h.id;

                  return (
                    <div
                      key={h.id}
                      className={`rounded-xl border overflow-hidden ${
                        h.status === "Behind"
                          ? "border-red-200 bg-red-50/20"
                          : h.status === "Achieved"
                          ? "border-emerald-200 bg-emerald-50/10"
                          : "border-tyro-border/30 bg-white dark:bg-tyro-surface"
                      }`}
                    >
                      {/* Hedefct header */}
                      <div
                        className={`px-5 py-4 flex items-start justify-between ${
                          h.status === "Behind" ? "bg-red-50/50" :
                          h.status === "On Hold" ? "bg-amber-50/30" :
                          h.status === "Achieved" ? "bg-emerald-50/30" : ""
                        }`}
                      >
                        <div className="flex-1">
                          <h4 className="text-[14px] font-bold text-tyro-text-primary">{h.name}</h4>
                          <p className="text-[11px] text-tyro-text-secondary mt-0.5">
                            {h.department} · {h.source} · {h.owner} · {h.startDate} → {h.endDate}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[20px] font-extrabold" style={{ color: STATUS_COLORS[h.status] }}>
                            {hProgress}%
                          </span>
                          <span
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                            style={{
                              backgroundColor: `${STATUS_COLORS[h.status]}15`,
                              color: STATUS_COLORS[h.status],
                            }}
                          >
                            ▶ {STATUS_LABELS[h.status]}
                          </span>
                        </div>
                      </div>

                      {/* Hedefct meta */}
                      <div className="px-5 py-3 grid grid-cols-4 gap-4 border-t border-tyro-border/15 text-[11px]">
                        <div>
                          <span className="text-[9px] font-bold uppercase text-tyro-text-muted">Süreç Durumu</span>
                          <p className="font-semibold text-tyro-text-primary mt-0.5">{STATUS_LABELS[h.status]}</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold uppercase text-tyro-text-muted">Risk</span>
                          <p className={`font-semibold mt-0.5 ${
                            risk === "Yüksek" ? "text-red-600" : risk === "Orta" ? "text-amber-600" : "text-emerald-600"
                          }`}>
                            {risk}
                          </p>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold uppercase text-tyro-text-muted">Bütçe</span>
                          <p className="font-semibold text-tyro-text-primary mt-0.5">—</p>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold uppercase text-tyro-text-muted">Açıklama</span>
                          <p className="font-semibold text-tyro-text-primary mt-0.5 truncate">
                            {h.description || "—"}
                          </p>
                        </div>
                      </div>

                      {/* Aksiyonlar (steps) */}
                      {sections.steps && hAksiyonlar.length > 0 && (
                        <div className="border-t border-tyro-border/15">
                          <button
                            onClick={() => setExpandedHedef(isExpanded ? null : h.id)}
                            className="w-full flex items-center gap-2 px-5 py-2 text-[10px] font-bold uppercase text-tyro-text-muted tracking-wider hover:bg-tyro-bg/50 cursor-pointer"
                          >
                            Aksiyonlar ({hAksiyonlar.length})
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-3 space-y-1">
                                  {hAksiyonlar.map((a) => {
                                    const StatusIcon = STATUS_ICONS[a.status];
                                    return (
                                      <div
                                        key={a.id}
                                        className="flex items-center justify-between py-2 border-b border-tyro-border/10 last:border-0"
                                      >
                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                          <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: `${STATUS_COLORS[a.status]}20` }}
                                          >
                                            <StatusIcon size={12} style={{ color: STATUS_COLORS[a.status] }} />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-[12px] font-semibold text-tyro-text-primary truncate">
                                              {a.name}
                                            </p>
                                            <p className="text-[10px] text-tyro-text-secondary">
                                              {a.owner} · {a.startDate} → {a.endDate}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className="text-[12px] font-bold" style={{ color: STATUS_COLORS[a.status] }}>
                                            {a.progress}%
                                          </span>
                                          <span
                                            className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                                            style={{
                                              backgroundColor: `${STATUS_COLORS[a.status]}12`,
                                              color: STATUS_COLORS[a.status],
                                            }}
                                          >
                                            {STATUS_LABELS[a.status]}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Footer */}
          <div className="text-center text-[10px] text-tyro-text-muted mt-12 pt-6 border-t border-tyro-border/20">
            <p>Bu rapor TYRO Strategy platformu tarafından otomatik olarak üretilmiştir.</p>
            <p className="mt-1">Powered by <strong>TTECH Business Solutions</strong> | Tiryaki Agro © 2025-2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
