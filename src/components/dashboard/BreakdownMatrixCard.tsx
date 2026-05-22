import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Crown, Building2, UserCircle2, Briefcase, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import { STATUS_HEX, STATUS_HEX_DARK, STATUS_ORDER } from "@/lib/statusColors";
import { getStatusLabel } from "@/lib/constants";
import { deptLabel } from "@/config/departments";
import { EXECUTIVE_BOARD, findExecutiveByOwner } from "@/config/executiveBoard";
import type { Proje, EntityStatus } from "@/types";

type Dim = "exec" | "dept" | "leader" | "source";
const INITIAL_ROWS = 5;

interface Props {
  projeler: Proje[];
}

/**
 * Tabbed 2D heatmap: rows are the active dimension values (dept / owner
 * / source), columns are statuses. Cells show per-bucket counts; 0 cells
 * are muted, populated cells carry a soft-tinted status color.
 */
export default function BreakdownMatrixCard({ projeler }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sidebarTheme = useSidebarTheme();
  const accentColor = sidebarTheme.accentColor ?? "#c8922a";
  const [dim, setDim] = useState<Dim>("exec");
  const [expanded, setExpanded] = useState(false);
  // Üst Yönetim sekmesi için her satıra ait alt-kırılım (departman bazlı)
  // açık/kapalı state'i. Tab değişince hepsi kapanır.
  const [expandedExecs, setExpandedExecs] = useState<Set<string>>(new Set());

  // Tab değişince collapsed duruma dön — farklı boyutta kullanıcı en yoğun
  // ilk 5'i görsün, gerekirse tekrar açsın.
  useEffect(() => {
    setExpanded(false);
    setExpandedExecs(new Set());
  }, [dim]);

  const toggleExecExpand = (execName: string) => {
    setExpandedExecs((prev) => {
      const next = new Set(prev);
      if (next.has(execName)) next.delete(execName);
      else next.add(execName);
      return next;
    });
  };

  // Üst Yönetim sub-row hesabı (kullanıcı isteği 2026-05-22): bir İcra
  // Kurulu üyesi genişlediğinde, ona bağlı projelerin departman bazlı
  // statü dağılımı alt satır olarak gösterilir. Memoize edilir; sadece
  // ilgili üyeler için çalışır.
  const subRowsByExec = useMemo(() => {
    if (dim !== "exec") return new Map<string, Array<{ key: string; counts: Record<EntityStatus, number>; total: number; rawOwners: Set<string>; rawDepts: Set<string> }>>();
    const result = new Map<string, Array<{ key: string; counts: Record<EntityStatus, number>; total: number; rawOwners: Set<string>; rawDepts: Set<string> }>>();
    for (const exec of EXECUTIVE_BOARD) {
      if (!expandedExecs.has(exec.name)) continue;
      const subs = new Set(exec.subordinates);
      const execProjeler = projeler.filter((p) => subs.has(p.owner ?? ""));
      if (execProjeler.length === 0) continue;
      const deptBucket = new Map<string, { counts: Record<EntityStatus, number>; rawOwners: Set<string>; rawDepts: Set<string> }>();
      const blank = (): Record<EntityStatus, number> =>
        STATUS_ORDER.reduce((acc, s) => ({ ...acc, [s]: 0 }), {} as Record<EntityStatus, number>);
      for (const p of execProjeler) {
        const deptKey = deptLabel(p.department, t) || t("dashboard.other");
        if (!deptBucket.has(deptKey)) deptBucket.set(deptKey, { counts: blank(), rawOwners: new Set(), rawDepts: new Set() });
        const entry = deptBucket.get(deptKey)!;
        entry.counts[p.status] = (entry.counts[p.status] ?? 0) + 1;
        if (p.owner) entry.rawOwners.add(p.owner);
        if (p.department) entry.rawDepts.add(p.department);
      }
      const rows = Array.from(deptBucket.entries())
        .map(([key, { counts, rawOwners, rawDepts }]) => ({
          key,
          counts,
          total: STATUS_ORDER.reduce((s, st) => s + (counts[st] ?? 0), 0),
          rawOwners,
          rawDepts,
        }))
        .sort((a, b) => b.total - a.total);
      result.set(exec.name, rows);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dim, expandedExecs, projeler, t]);

  // Sub-row tıklaması: hem owner (üyenin alt çalışanları o departmanda olan)
  // hem dept hem status filtrelenir. Kokpit URL paramlarını birleştirir.
  const navigateToSubCell = (rawOwners: Set<string>, rawDepts: Set<string>, status: EntityStatus | null) => {
    const params = new URLSearchParams();
    if (rawOwners.size > 0) params.set("owner", Array.from(rawOwners).join(","));
    if (rawDepts.size > 0) params.set("dept", Array.from(rawDepts).join(","));
    if (status) params.set("status", status);
    const qs = params.toString();
    navigate(qs ? `/stratejik-kokpit?${qs}` : "/stratejik-kokpit");
  };

  // Tab metadata — kullanıcı isteği 2026-05-22: "İcra Kurulu" sekmesi
  // departmandan ÖNCE eklendi. config/executiveBoard.ts statik liste.
  const tabs: { id: Dim; label: string; icon: typeof Building2 }[] = [
    { id: "exec",   label: t("dashboard.breakdownTabs.exec"),   icon: Crown },
    { id: "dept",   label: t("dashboard.breakdownTabs.dept"),   icon: Building2 },
    { id: "leader", label: t("dashboard.breakdownTabs.leader"), icon: UserCircle2 },
    { id: "source", label: t("dashboard.breakdownTabs.source"), icon: Briefcase },
  ];

  // Extract the row key for a proje given the active dimension.
  // department labels are passed through deptLabel() to resolve tr/en
  // aliases (same helper the other widgets use).
  const extract = (h: Proje): string => {
    if (dim === "exec") {
      const exec = findExecutiveByOwner(h.owner);
      return exec ? exec.name : t("dashboard.other");
    }
    if (dim === "dept") return deptLabel(h.department, t) || t("dashboard.other");
    if (dim === "leader") return h.owner || "-";
    return h.source || "-";
  };

  // Raw değer çıkartıcı — dim'e göre proje üzerinden temel alanı döner.
  // deptLabel alias mapping yapıldığı için bir satır birden fazla raw
  // değerden oluşabilir (örn. raw "İnsan Kaynakları" + canonical
  // "insan-kaynaklari" aynı label'a düşer). Bu raw'ları satır başına
  // toplamak gerekiyor ki tıklayınca kokpit doğru filtrelesin.
  // exec dim: key = İcra Kurulu üyesi adı, raw = proje.owner (alt çalışan).
  // Tıklayınca o satırın tüm subordinate owner'ları virgülle ?owner=...
  // şeklinde URL'e yansır → Kokpit owner-filter ile eşleşmiş projeleri gösterir.
  const extractRaw = (h: Proje): string => {
    if (dim === "exec") return h.owner || "";
    if (dim === "dept") return h.department || "";
    if (dim === "leader") return h.owner || "";
    return h.source || "";
  };

  // Build { rowKey → Record<EntityStatus, number> }. Single pass,
  // zero cells initialized so the matrix is rectangular — no holes.
  // Column totals + grand total are computed across the FULL matrix
  // (not just visible rows) so collapsing/expanding never changes the
  // numbers in the "Toplam" footer — what you see is the real total.
  // Her satır kendi raw değerlerini (Set) tutar — hücre tıklamasında bu
  // set'i URL'e koyup kokpit'in filterlemesine veriyoruz.
  const { matrix, columnTotals, grandTotal } = useMemo(() => {
    const bucket = new Map<string, { counts: Record<EntityStatus, number>; rawValues: Set<string> }>();
    const blank = (): Record<EntityStatus, number> =>
      STATUS_ORDER.reduce((acc, s) => ({ ...acc, [s]: 0 }), {} as Record<EntityStatus, number>);

    for (const h of projeler) {
      const key = extract(h);
      const raw = extractRaw(h);
      if (!bucket.has(key)) bucket.set(key, { counts: blank(), rawValues: new Set<string>() });
      const entry = bucket.get(key)!;
      entry.counts[h.status] = (entry.counts[h.status] ?? 0) + 1;
      if (raw) entry.rawValues.add(raw);
    }

    const rows = Array.from(bucket.entries())
      .map(([key, { counts, rawValues }]) => {
        const total = STATUS_ORDER.reduce((s, st) => s + (counts[st] ?? 0), 0);
        return { key, counts, total, rawValues };
      })
      .sort((a, b) => b.total - a.total);

    const colTotals = STATUS_ORDER.reduce((acc, s) => {
      acc[s] = rows.reduce((sum, r) => sum + (r.counts[s] ?? 0), 0);
      return acc;
    }, {} as Record<EntityStatus, number>);

    const grand = rows.reduce((sum, r) => sum + r.total, 0);

    return { matrix: rows, columnTotals: colTotals, grandTotal: grand };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projeler, dim]);

  // Hücre tıklaması → kokpit'e ilgili filtrelerle yönlendir.
  // rowRawValues null → tüm dim değerleri (sadece status filter)
  // status null → tüm statüler (sadece dim filter)
  // İkisi de null → tüm projeler (filter yok)
  const navigateToCell = (rowRawValues: Set<string> | null, status: EntityStatus | null) => {
    const params = new URLSearchParams();
    if (rowRawValues && rowRawValues.size > 0) {
      // exec dim → owner filter (subordinate display_name'leri virgülle)
      const paramName =
        dim === "dept" ? "dept" :
        dim === "leader" || dim === "exec" ? "owner" :
        "source";
      params.set(paramName, Array.from(rowRawValues).join(","));
    }
    if (status) params.set("status", status);
    const qs = params.toString();
    navigate(qs ? `/stratejik-kokpit?${qs}` : "/stratejik-kokpit");
  };

  return (
    <GlassCard className="p-5 flex-1 flex flex-col w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-[13px] font-bold text-tyro-text-primary">
          {t("dashboard.breakdownMatrixTitle")}
        </h3>
        {/* Tab row — mirrors DashboardPage's desktop tab style. */}
        <div className="flex items-center gap-1 text-[12px]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = dim === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setDim(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "shadow-sm text-white"
                    : "text-tyro-text-muted hover:bg-tyro-bg hover:text-tyro-text-secondary"
                }`}
                style={isActive ? { backgroundColor: accentColor } : undefined}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Matrix — mobile gets a horizontal scroll window so the status
          columns don't wrap. */}
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full min-w-[540px] border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-tyro-text-muted px-2 py-1 sticky left-0 bg-tyro-surface z-10">
                {tabs.find((x) => x.id === dim)?.label}
              </th>
              {STATUS_ORDER.map((s) => (
                <th
                  key={s}
                  className="text-[10px] font-semibold uppercase tracking-wider text-tyro-text-muted px-1 py-1 text-center"
                  style={{ minWidth: 64 }}
                >
                  {getStatusLabel(s, t)}
                </th>
              ))}
              {/* Right-most TOPLAM column header — separated visually from
                  the status columns by a heavier left border. */}
              <th
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 text-center border-l-2 border-tyro-border/60"
                style={{ minWidth: 64, color: accentColor }}
              >
                {t("dashboard.total")}
              </th>
            </tr>
          </thead>
          <tbody>
            {matrix.length === 0 && (
              <tr>
                <td
                  colSpan={STATUS_ORDER.length + 2}
                  className="text-center text-[12px] text-tyro-text-muted py-8"
                >
                  {t("common.noResults")}
                </td>
              </tr>
            )}
            {(expanded ? matrix : matrix.slice(0, INITIAL_ROWS)).flatMap(({ key, counts, total, rawValues }) => {
              const isExecRow = dim === "exec";
              const isOpen = isExecRow && expandedExecs.has(key);
              const subRows = isOpen ? subRowsByExec.get(key) ?? [] : [];
              return [
                <tr key={key}>
                  <td className="text-[12px] font-medium text-tyro-text-primary px-2 py-1.5 truncate max-w-[200px] sticky left-0 bg-tyro-surface z-10">
                    {isExecRow ? (
                      <button
                        type="button"
                        onClick={() => toggleExecExpand(key)}
                        className="flex items-center gap-1.5 w-full text-left hover:text-tyro-navy transition-colors cursor-pointer"
                        title={isOpen ? t("common.showLess") : t("dashboard.expandDeptBreakdown")}
                      >
                        {isOpen ? (
                          <ChevronDown size={13} className="shrink-0 text-tyro-text-muted" />
                        ) : (
                          <ChevronRight size={13} className="shrink-0 text-tyro-text-muted" />
                        )}
                        <span className="truncate">{key}</span>
                      </button>
                    ) : (
                      <span>{key}</span>
                    )}
                  </td>
                  {STATUS_ORDER.map((s) => {
                    const n = counts[s] ?? 0;
                    const color = STATUS_HEX[s];
                    const darkColor = STATUS_HEX_DARK[s];
                    return (
                      <td
                        key={s}
                        className="px-1 py-1 cursor-pointer"
                        onClick={() => navigateToCell(rawValues, s)}
                        title={`${key} × ${getStatusLabel(s, t)} → ${n} ${t("dashboard.project").toLowerCase()}`}
                      >
                        <div
                          className="h-10 flex items-center justify-center rounded-lg tabular-nums text-[13px] font-bold transition-all hover:brightness-95 hover:scale-[1.03]"
                          style={
                            n > 0
                              ? {
                                  backgroundColor: `${color}33`,
                                  color: darkColor,
                                  border: `1px solid ${color}66`,
                                }
                              : {
                                  backgroundColor: "var(--tyro-bg)",
                                  color: "var(--tyro-text-muted)",
                                  opacity: 0.5,
                                }
                          }
                        >
                          {n}
                        </div>
                      </td>
                    );
                  })}
                  <td
                    className="px-1 py-1 border-l-2 border-tyro-border/60 cursor-pointer"
                    onClick={() => navigateToCell(rawValues, null)}
                    title={`${key} → ${total} ${t("dashboard.project").toLowerCase()}`}
                  >
                    <div
                      className="h-10 flex items-center justify-center rounded-lg tabular-nums text-[13px] font-bold transition-all hover:brightness-95 hover:scale-[1.03]"
                      style={{
                        backgroundColor: "#ffffff",
                        color: accentColor,
                        border: `1px solid ${accentColor}55`,
                      }}
                    >
                      {total}
                    </div>
                  </td>
                </tr>,
                // Sub-rows — departman bazlı alt kırılım, sadece exec dim'inde
                // ve satır expand edildiğinde. Görsel olarak hafif gri arkaplan
                // + soldan girinti ile parent'tan ayrılır.
                ...subRows.map((sr) => (
                  <tr key={`${key}__${sr.key}`} className="bg-slate-50/60 dark:bg-white/[0.03]">
                    <td className="text-[11px] font-medium text-tyro-text-secondary px-2 py-1 sticky left-0 bg-slate-50/60 dark:bg-white/[0.03] z-10">
                      <div className="flex items-center gap-1.5 pl-6 truncate max-w-[200px]">
                        <span className="text-tyro-border">└</span>
                        <span className="truncate">{sr.key}</span>
                      </div>
                    </td>
                    {STATUS_ORDER.map((s) => {
                      const n = sr.counts[s] ?? 0;
                      const color = STATUS_HEX[s];
                      const darkColor = STATUS_HEX_DARK[s];
                      return (
                        <td
                          key={s}
                          className="px-1 py-0.5 cursor-pointer"
                          onClick={() => navigateToSubCell(sr.rawOwners, sr.rawDepts, s)}
                          title={`${key} → ${sr.key} × ${getStatusLabel(s, t)} → ${n} ${t("dashboard.project").toLowerCase()}`}
                        >
                          <div
                            className="h-8 flex items-center justify-center rounded-md tabular-nums text-[12px] font-semibold transition-all hover:brightness-95"
                            style={
                              n > 0
                                ? {
                                    backgroundColor: `${color}22`,
                                    color: darkColor,
                                    border: `1px solid ${color}44`,
                                  }
                                : {
                                    backgroundColor: "transparent",
                                    color: "var(--tyro-text-muted)",
                                    opacity: 0.4,
                                  }
                            }
                          >
                            {n}
                          </div>
                        </td>
                      );
                    })}
                    <td
                      className="px-1 py-0.5 border-l-2 border-tyro-border/60 cursor-pointer"
                      onClick={() => navigateToSubCell(sr.rawOwners, sr.rawDepts, null)}
                      title={`${key} → ${sr.key} → ${sr.total} ${t("dashboard.project").toLowerCase()}`}
                    >
                      <div
                        className="h-8 flex items-center justify-center rounded-md tabular-nums text-[12px] font-semibold transition-all hover:brightness-95"
                        style={{
                          backgroundColor: "transparent",
                          color: accentColor,
                          border: `1px solid ${accentColor}33`,
                        }}
                      >
                        {sr.total}
                      </div>
                    </td>
                  </tr>
                )),
              ];
            })}
          </tbody>
          {matrix.length > 0 && (
            <tfoot>
              <tr>
                <td className="text-[11px] font-bold uppercase tracking-wider px-2 py-1.5 sticky left-0 bg-tyro-surface z-10 border-t-2 border-tyro-border/60" style={{ color: accentColor }}>
                  {t("dashboard.total")}
                </td>
                {STATUS_ORDER.map((s) => {
                  const n = columnTotals[s] ?? 0;
                  return (
                    <td
                      key={s}
                      className="px-1 py-1 border-t-2 border-tyro-border/60 cursor-pointer"
                      onClick={() => navigateToCell(null, s)}
                      title={`${getStatusLabel(s, t)} → ${n} ${t("dashboard.project").toLowerCase()}`}
                    >
                      <div
                        className="h-10 flex items-center justify-center rounded-lg tabular-nums text-[13px] font-bold transition-all hover:brightness-95 hover:scale-[1.03]"
                        style={{
                          backgroundColor: "#ffffff",
                          color: accentColor,
                          border: `1px solid ${accentColor}40`,
                        }}
                      >
                        {n}
                      </div>
                    </td>
                  );
                })}
                {/* Grand total — strongest emphasis. Tıklama: filtresiz kokpit. */}
                <td
                  className="px-1 py-1 border-t-2 border-l-2 border-tyro-border/60 cursor-pointer"
                  onClick={() => navigateToCell(null, null)}
                  title={`${t("dashboard.total")} → ${grandTotal} ${t("dashboard.project").toLowerCase()}`}
                >
                  <div
                    className="h-10 flex items-center justify-center rounded-lg tabular-nums text-[14px] font-extrabold text-white transition-all hover:brightness-110 hover:scale-[1.03]"
                    style={{
                      backgroundColor: accentColor,
                      border: `1px solid ${accentColor}`,
                    }}
                  >
                    {grandTotal}
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Daha fazla göster / gizle — varsayılan 5 satır, fazlasını kullanıcı
          isterse açsın. Aşağıya doğru animasyon olmadan direkt genişler
          (satır sayısı az ise buton hiç çıkmaz). */}
      {matrix.length > INITIAL_ROWS && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold text-tyro-text-secondary hover:text-tyro-navy hover:bg-tyro-bg/60 transition-colors cursor-pointer border border-dashed border-tyro-border/40"
        >
          {expanded
            ? <>{t("common.showLess")} <ChevronUp size={14} /></>
            : <>+{matrix.length - INITIAL_ROWS} {t("common.showMore")} <ChevronDown size={14} /></>}
        </button>
      )}
    </GlassCard>
  );
}
