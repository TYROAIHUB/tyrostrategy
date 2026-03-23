import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Briefcase, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, ListChecks } from "lucide-react";
import type { ReactNode } from "react";
import GlassCard from "@/components/ui/GlassCard";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import CircularProgress from "@/components/ui/CircularProgress";

const iconMap: Record<string, ReactNode> = {
  Target: <Target size={20} />,
  Briefcase: <Briefcase size={20} />,
  CheckCircle: <CheckCircle2 size={20} />,
  AlertTriangle: <AlertTriangle size={20} />,
  ListChecks: <ListChecks size={20} />,
};

interface KPICardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  icon: string;
  color: string;
  progress?: number;
  target?: number;
  sparklineData?: number[];
  contextText?: string;
  onClick?: () => void;
}

function InteractiveSparkline({ data, color }: { data: number[]; color: string }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 90;
  const h = 32;

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * h,
    value: v,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Area fill
  const areaPath = `M${points[0].x},${h} ${points.map((p) => `L${p.x},${p.y}`).join(" ")} L${points[points.length - 1].x},${h} Z`;

  return (
    <div className="relative">
      <svg width={w} height={h + 4} className="overflow-visible">
        {/* Area gradient */}
        <defs>
          <linearGradient id={`spark-grad-${color.replace(/[^a-z]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#spark-grad-${color.replace(/[^a-z]/g, "")})`} />
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Hover dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredIdx === i ? 4 : 0}
            fill={color}
            stroke="white"
            strokeWidth={2}
            className="transition-all duration-150"
          />
        ))}
        {/* Invisible hit areas */}
        {points.map((p, i) => (
          <rect
            key={`hit-${i}`}
            x={p.x - 5}
            y={0}
            width={10}
            height={h + 4}
            fill="transparent"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="cursor-pointer"
          />
        ))}
      </svg>
      {/* Tooltip */}
      {hoveredIdx !== null && (
        <div
          className="absolute -top-7 px-1.5 py-0.5 rounded bg-tyro-text-primary text-white text-[9px] font-bold tabular-nums pointer-events-none whitespace-nowrap"
          style={{ left: points[hoveredIdx].x, transform: "translateX(-50%)" }}
        >
          {points[hoveredIdx].value}
        </div>
      )}
    </div>
  );
}

export default function KPICard({
  label,
  value,
  prefix = "",
  suffix = "",
  trend,
  trendLabel,
  icon,
  color,
  progress,
  target,
  sparklineData,
  contextText,
  onClick,
}: KPICardProps) {
  const [hovered, setHovered] = useState(false);
  const trendIsPositive = trend !== undefined && trend >= 0;
  const trendColor = trendIsPositive ? "text-tyro-success" : "text-tyro-danger";
  const hasRing = progress !== undefined;

  return (
    <GlassCard
      className={`p-4 sm:p-6 flex-1 flex flex-col${onClick ? " cursor-pointer active:scale-[0.98] transition-transform" : ""}`}
      onClick={onClick}
    >
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="text-[12px] sm:text-[13px] font-semibold text-tyro-text-secondary">
            {label}
          </span>
          <motion.div
            className="flex items-center justify-center w-9 h-9 rounded-button"
            style={{ backgroundColor: `${color}15`, color }}
            animate={{ scale: hovered ? 1.1 : 1, rotate: hovered ? 5 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {iconMap[icon]}
          </motion.div>
        </div>

        {/* Value — pulse on hover */}
        <motion.div
          className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums leading-none mb-2 sm:mb-3 text-tyro-text-primary"
          animate={{ scale: hovered ? 1.03 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
          {target !== undefined && (
            <span className="text-base font-medium text-tyro-text-muted ml-1">
              / {target}
            </span>
          )}
        </motion.div>
      </div>

      {/* Footer: trend + ring or sparkline — pushed to bottom */}
      <div className="flex items-center justify-between mt-auto">
        {hasRing ? (
          <>
            <div className="flex flex-col gap-0.5">
              {trend !== undefined && (
                <motion.div
                  className="flex items-center gap-1.5"
                  animate={{ x: hovered ? 3 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {trendIsPositive ? <TrendingUp size={12} className="text-tyro-success" /> : <TrendingDown size={12} className="text-tyro-danger" />}
                  <span className={`text-xs font-bold ${trendColor}`}>
                    {trendIsPositive ? "+" : ""}{trend}%
                  </span>
                  {trendLabel && (
                    <span className="text-xs text-tyro-text-muted">{trendLabel}</span>
                  )}
                </motion.div>
              )}
              {contextText && (
                <span className="text-[11px] text-tyro-text-muted">{contextText}</span>
              )}
            </div>
            <motion.div
              animate={{ scale: hovered ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <CircularProgress progress={progress} size={44} strokeWidth={4} color={color}>
                <span className="text-[10px] font-bold text-tyro-text-secondary">
                  {progress}%
                </span>
              </CircularProgress>
            </motion.div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-0.5">
              {trend !== undefined && (
                <motion.div
                  className="flex items-center gap-1.5"
                  animate={{ x: hovered ? 3 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {trendIsPositive ? <TrendingUp size={12} className="text-tyro-success" /> : <TrendingDown size={12} className="text-tyro-danger" />}
                  <span className={`text-xs font-bold ${trendColor}`}>
                    {trendIsPositive ? "↑" : "↓"} {trend}
                  </span>
                  {trendLabel && (
                    <span className="text-xs text-tyro-text-muted">{trendLabel}</span>
                  )}
                </motion.div>
              )}
              {contextText && (
                <span className="text-[11px] text-tyro-text-muted">{contextText}</span>
              )}
            </div>
            {sparklineData && (
              <InteractiveSparkline data={sparklineData} color={color} />
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
}
