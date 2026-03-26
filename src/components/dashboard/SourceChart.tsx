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
import { useDataStore } from "@/stores/dataStore";
import GlassCard from "@/components/ui/GlassCard";

export default function SourceChart() {
  const projeler = useDataStore((s) => s.projeler);

  const chartData = useMemo(() => {
    const sources = ["Türkiye", "Kurumsal", "International"];
    return sources.map((source) => {
      const sp = projeler.filter((h) => h.source === source);
      const count = (s: string) => sp.filter((h) => h.status === s).length;

      return {
        source: source === "International" ? "Intl" : source,
        "Yolunda": count("On Track"),
        "Risk Altında": count("At Risk"),
        "Gecikmeli": count("Behind"),
        "Tamamlandı": count("Achieved"),
        "Başlanmadı": count("Not Started"),
        "Askıda": count("On Hold"),
        "İptal": count("Cancelled"),
      };
    });
  }, [projeler]);

  return (
    <GlassCard className="p-5 flex-1 flex flex-col">
      <h3 className="text-[13px] font-bold text-tyro-text-primary mb-1">
        İş Grubu Bazlı Proje Dağılımı
      </h3>
      <p className="text-[11px] text-tyro-text-secondary mb-3">
        Türkiye, Kurumsal ve International iş grupları
      </p>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={2} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--tyro-border)" vertical={false} />
            <XAxis
              dataKey="source"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--tyro-text-secondary)" }}
              padding={{ left: 5, right: 5 }}
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
              wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
              iconType="circle"
              iconSize={7}
            />
            <Bar dataKey="Yolunda" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={1200} />
            <Bar dataKey="Risk Altında" fill="#f59e0b" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={100} />
            <Bar dataKey="Gecikmeli" fill="#ef4444" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={200} />
            <Bar dataKey="Tamamlandı" fill="#06b6d4" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={300} />
            <Bar dataKey="Başlanmadı" fill="#94a3b8" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={400} />
            <Bar dataKey="Askıda" fill="#8b5cf6" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={500} />
            <Bar dataKey="İptal" fill="#6b7280" radius={[4, 4, 0, 0]} animationDuration={1200} animationBegin={600} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
