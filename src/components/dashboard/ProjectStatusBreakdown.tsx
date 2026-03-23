import { useTranslation } from "react-i18next";
import { projectStatusData } from "@/lib/mock-data/dashboard";
import GlassCard from "@/components/ui/GlassCard";

export default function ProjectStatusBreakdown() {
  const { t } = useTranslation();
  return (
    <GlassCard className="p-6 flex-1 flex flex-col">
      <h3 className="text-sm font-semibold text-tyro-text-secondary mb-4">
        {t("dashboard.objectiveStatusBreakdown")}
      </h3>
      <div className="space-y-5">
        {projectStatusData.map((group) => (
          <div key={group.status}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: group.color }}
              />
              <span className="text-sm font-semibold text-tyro-text-primary">
                {group.status}
              </span>
              <span className="ml-auto text-sm font-bold tabular-nums" style={{ color: group.color }}>
                {group.count}
              </span>
            </div>
            <div className="pl-5 space-y-1">
              {group.projects.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <span className="text-tyro-text-secondary truncate max-w-[180px]">
                    {p.name}
                  </span>
                  <span className="text-tyro-text-muted tabular-nums ml-2 flex-shrink-0">
                    {p.progress}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
