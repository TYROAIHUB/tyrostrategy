import { useTranslation } from "react-i18next";
import { activityFeed } from "@/lib/mock-data/dashboard";
import GlassCard from "@/components/ui/GlassCard";

export default function ActivityFeed() {
  const { t } = useTranslation();
  return (
    <GlassCard className="p-6 flex-1 flex flex-col">
      <h3 className="text-sm font-semibold text-tyro-text-secondary mb-4">
        {t("dashboard.recentActivities")}
      </h3>
      <div className="space-y-4">
        {activityFeed.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="w-px flex-1 bg-tyro-border mt-1" />
            </div>
            <div className="pb-4">
              <p className="text-sm font-semibold text-tyro-text-primary leading-snug">
                {item.title}
              </p>
              <p className="text-xs text-tyro-text-secondary mt-0.5">
                {item.description}
              </p>
              <p className="text-[11px] text-tyro-text-muted mt-1">
                {item.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
