import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Crosshair, CircleCheckBig, CheckCircle, AlertTriangle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { useMyWorkspace } from "@/hooks/useMyWorkspace";

export default function BentoKPI() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ws = useMyWorkspace();

  const aksiyonPct = ws.totalAksiyonlar > 0
    ? Math.round((ws.achievedAksiyonlar / ws.totalAksiyonlar) * 100) : 0;
  const overallPct = ws.overallProgress;

  return (
    <GlassCard className="p-4 sm:p-5 flex-1 flex flex-col gap-3 overflow-hidden">
      {/* Hedefler + Aksiyonlar side by side */}
      <div className="grid grid-cols-2 gap-2">
        {/* Hedeflerim */}
        <div
          onClick={() => navigate("/hedefler")}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-tyro-navy/5 cursor-pointer hover:bg-tyro-navy/10 transition-colors"
        >
          <Crosshair size={18} className="text-tyro-navy mb-1" />
          <span className="text-[22px] font-extrabold text-tyro-text-primary tabular-nums leading-none">{ws.myHedefler.length}</span>
          <span className="text-[11px] font-medium text-tyro-text-muted">{t("workspace.myObjectives")}</span>
        </div>

        {/* Aksiyonlarım */}
        <div
          onClick={() => navigate("/aksiyonlar")}
          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-blue-500/5 cursor-pointer hover:bg-blue-500/10 transition-colors"
        >
          <CircleCheckBig size={18} className="text-blue-500 mb-1" />
          <span className="text-[22px] font-extrabold text-tyro-text-primary tabular-nums leading-none">{ws.totalAksiyonlar}</span>
          <span className="text-[11px] font-medium text-tyro-text-muted">{t("workspace.myActions")}</span>
        </div>
      </div>

      {/* Tamamlanan — big donut */}
      <div
        onClick={() => navigate("/aksiyonlar")}
        className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 cursor-pointer hover:bg-emerald-500/10 transition-colors"
      >
        <div className="relative w-12 h-12 shrink-0">
          <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
            <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" className="text-tyro-bg" stroke="currentColor" />
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--tyro-success)" strokeWidth="3"
              strokeDasharray={`${aksiyonPct * 0.88} 88`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold tabular-nums text-emerald-600">
            {aksiyonPct}%
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="text-[12px] font-bold text-tyro-text-primary">{ws.achievedAksiyonlar}</span>
            <span className="text-[11px] text-tyro-text-muted">/ {ws.totalAksiyonlar}</span>
          </div>
          <span className="text-[11px] text-tyro-text-muted">{t("workspace.completed")}</span>
        </div>
      </div>

      {/* Geciken / Riskli */}
      {(ws.behindAksiyonlar + ws.atRiskAksiyonlar) > 0 && (
        <div
          onClick={() => navigate("/aksiyonlar")}
          className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-colors"
        >
          <AlertTriangle size={20} className="text-red-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[16px] font-extrabold text-tyro-text-primary tabular-nums">{ws.behindAksiyonlar + ws.atRiskAksiyonlar}</span>
            <span className="text-[11px] text-tyro-text-muted block">
              {ws.behindAksiyonlar} {t("workspace.late")}, {ws.atRiskAksiyonlar} {t("workspace.atRisk")}
            </span>
          </div>
        </div>
      )}

      {/* Overall progress bar */}
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-tyro-text-muted">{t("workspace.avgProgress")}</span>
          <span className="text-[13px] font-extrabold text-tyro-navy tabular-nums">%{overallPct}</span>
        </div>
        <div className="h-2.5 rounded-full bg-tyro-bg overflow-hidden">
          <div className="h-full rounded-full bg-tyro-navy transition-all" style={{ width: `${overallPct}%` }} />
        </div>
      </div>
    </GlassCard>
  );
}
