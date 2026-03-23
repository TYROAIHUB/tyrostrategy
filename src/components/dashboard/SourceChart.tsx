import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTranslation } from "react-i18next";
import { useDataStore } from "@/stores/dataStore";
import GlassCard from "@/components/ui/GlassCard";

export default function SourceChart() {
  const { t } = useTranslation();
  const hedefler = useDataStore((s) => s.hedefler);
  const aksiyonlar = useDataStore((s) => s.aksiyonlar);

  const chartData = useMemo(() => {
    const sources = ["T\u00fcrkiye", "Kurumsal", "International"];
    return sources.map((source) => {
      const sourceHedefler = hedefler.filter((h) => h.source === source);
      const sourceHedefIds = new Set(sourceHedefler.map((h) => h.id));
      const sourceAksiyonlar = aksiyonlar.filter((a) => sourceHedefIds.has(a.hedefId));
      const achieved = sourceAksiyonlar.filter((a) => a.status === "Achieved").length;
      const active = sourceAksiyonlar.filter(
        (a) => a.status === "On Track" || a.status === "At Risk"
      ).length;
      const remaining = sourceAksiyonlar.length - achieved - active;

      return {
        source: source === "International" ? "Intl" : source,
        hedef: sourceHedefler.length,
        aksiyon: sourceAksiyonlar.length,
        tamamlanan: achieved,
        devamEden: active,
        bekleyen: Math.max(0, remaining),
      };
    });
  }, [hedefler, aksiyonlar]);

  return (
    <GlassCard className="p-6 flex-1 flex flex-col">
      <h3 className="text-sm font-semibold text-tyro-text-secondary mb-1">
        {t("dashboard.sourceDistribution")}
      </h3>
      <p className="text-xs text-tyro-text-muted mb-4">
        {t("dashboard.sourceSubtitle")}
      </p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={4} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--tyro-border)" vertical={false} />
            <XAxis
              dataKey="source"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--tyro-text-muted)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--tyro-text-muted)" }}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--tyro-border)",
                borderRadius: 12,
                boxShadow: "0 8px 32px rgba(30,58,95,0.12)",
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="tamamlanan"
              name={t("dashboard.completed")}
              fill="var(--tyro-success)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}
              animationDuration={1200}
            />
            <Bar
              dataKey="devamEden"
              name={t("dashboard.inProgress")}
              fill="var(--tyro-navy)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}
              animationDuration={1200}
              animationBegin={200}
            />
            <Bar
              dataKey="bekleyen"
              name={t("dashboard.pending")}
              fill="var(--tyro-gold)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}
              animationDuration={1200}
              animationBegin={400}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
