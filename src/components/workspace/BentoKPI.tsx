import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Crosshair, CalendarClock, TrendingUp, CheckCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useMyWorkspace } from "@/hooks/useMyWorkspace";
import { useDataStore } from "@/stores/dataStore";
import type { EntityStatus } from "@/types";
import { getStatusLabel } from "@/lib/constants";

const STATUS_COLORS: Record<string, string> = {
  "On Track": "#10b981",
  "At Risk": "#f59e0b",
  "Behind": "#ef4444",
  "Achieved": "#059669",
  "Not Started": "#94a3b8",
  "Cancelled": "#6b7280",
  "On Hold": "#8b5cf6",
};

const STATUS_ORDER: EntityStatus[] = ["On Track", "At Risk", "Behind", "Achieved", "Not Started", "On Hold", "Cancelled"];

export default function BentoKPI() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ws = useMyWorkspace();
  const projeler = useDataStore((s) => s.projeler);

  const overdueCount = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return projeler.filter((h) => {
      if (!h.reviewDate) return true;
      if (h.status === "Achieved" || h.status === "Cancelled") return false;
      return new Date(h.reviewDate) <= oneMonthAgo;
    }).length;
  }, [projeler]);

  // Status counts for my projects
  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const h of ws.myProjeler) counts.set(h.status, (counts.get(h.status) ?? 0) + 1);
    return STATUS_ORDER.map((s) => ({
      status: s,
      label: getStatusLabel(s, t),
      count: counts.get(s) ?? 0,
      color: STATUS_COLORS[s] ?? "#94a3b8",
    }));
  }, [ws.myProjeler, t]);

  const avgProgress = ws.overallProgress;

  // Donut segments
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let accOffset = 0;
  const total = ws.myProjeler.length || 1;
  const arcs = statusCounts.filter((s) => s.count > 0).map((seg) => {
    const pct = (seg.count / total) * 100;
    const dashLen = (pct / 100) * circumference;
    const dashOffset = circumference - accOffset;
    accOffset += dashLen;
    return { ...seg, pct, dashLen, dashOffset };
  });

  return (
    <GlassCard className="p-4 sm:p-5 flex-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-tyro-navy/8 flex items-center justify-center">
            <TrendingUp size={15} className="text-tyro-navy" />
          </div>
          <h3 className="text-[13px] font-bold text-tyro-text-primary">Proje Özeti</h3>
        </div>
        <button
          type="button"
          onClick={() => navigate("/projeler")}
          className="text-[11px] font-semibold text-tyro-navy hover:underline cursor-pointer"
        >
          Tümünü Gör &rsaquo;
        </button>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-3">
        {/* Left section (9 col) */}
        <div className="col-span-9 flex flex-col gap-2.5">
          {/* Row 1: 3 summary cards */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Projelerim */}
            <div
              onClick={() => navigate("/projeler")}
              className="rounded-xl bg-tyro-navy/5 p-3 cursor-pointer hover:bg-tyro-navy/8 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Crosshair size={13} className="text-tyro-navy" />
                <span className="text-[10px] font-semibold text-tyro-text-muted uppercase tracking-wider">Projelerim</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[26px] font-extrabold text-tyro-text-primary tabular-nums leading-none">{ws.myProjeler.length}</span>
                <span className="text-[10px] text-tyro-text-muted">/ {ws.totalProjeler}</span>
              </div>
            </div>

            {/* Tamamlanan */}
            <div
              onClick={() => navigate("/projeler")}
              className="rounded-xl bg-emerald-500/5 p-3 cursor-pointer hover:bg-emerald-500/8 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle size={13} className="text-emerald-500" />
                <span className="text-[10px] font-semibold text-tyro-text-muted uppercase tracking-wider">Tamamlanan</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[26px] font-extrabold text-tyro-text-primary tabular-nums leading-none">{ws.achievedProjeler}</span>
                <span className="text-[10px] text-tyro-text-muted">proje</span>
              </div>
            </div>

            {/* Kontrol Tarihi */}
            <div
              onClick={() => navigate("/projeler?reviewOverdue=true")}
              className="rounded-xl bg-amber-500/5 p-3 cursor-pointer hover:bg-amber-500/8 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <CalendarClock size={13} className="text-amber-500" />
                <span className="text-[10px] font-semibold text-tyro-text-muted uppercase tracking-wider">Kontrol</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[26px] font-extrabold text-tyro-text-primary tabular-nums leading-none">{overdueCount}</span>
                <span className="text-[10px] text-tyro-text-muted">güncel değil</span>
              </div>
            </div>
          </div>

          {/* Row 2: 6 status mini cards (Achieved excluded — shown above) */}
          <div className="grid grid-cols-6 gap-2">
            {statusCounts.filter((s) => s.status !== "Achieved").map((s) => (
              <div
                key={s.status}
                onClick={() => navigate("/projeler")}
                className={`rounded-xl p-2 cursor-pointer hover:brightness-95 transition-all text-center ${s.count === 0 ? "opacity-35" : ""}`}
                style={{ backgroundColor: `${s.color}10` }}
              >
                <span className="text-[16px] font-extrabold tabular-nums leading-none" style={{ color: s.color }}>
                  {s.count}
                </span>
                <p className="text-[8px] font-semibold mt-1 truncate" style={{ color: s.color }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Premium Circular Progress (3 col) — shows avgProgress % */}
        <div className="col-span-3 flex items-center justify-center">
          {(() => {
            const r = 54;
            const c = 2 * Math.PI * r;
            const progressDash = (avgProgress / 100) * c;
            // Color based on progress
            const progColor = avgProgress >= 75 ? "#059669" : avgProgress >= 50 ? "#10b981" : avgProgress >= 25 ? "#f59e0b" : "#ef4444";
            return (
              <div className="relative" style={{ width: 130, height: 130 }}>
                <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${progColor}12 0%, transparent 70%)` }} />
                <svg width={130} height={130} viewBox="0 0 130 130" className="-rotate-90">
                  <circle cx={65} cy={65} r={r} fill="none" stroke="#e2e8f0" strokeWidth={10} opacity={0.4} />
                  <circle
                    cx={65} cy={65} r={r}
                    fill="none"
                    stroke={progColor}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={`${progressDash} ${c - progressDash}`}
                    strokeDashoffset={0}
                    style={{ transition: "all 0.8s ease", filter: `drop-shadow(0 0 4px ${progColor}50)` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[24px] font-extrabold tabular-nums text-tyro-text-primary leading-none">
                    %{avgProgress}
                  </span>
                  <span className="text-[9px] font-semibold text-tyro-text-muted mt-1">
                    Ort. İlerleme
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </GlassCard>
  );
}
