import { useTranslation } from "react-i18next";
import { getStatusLabel } from "@/lib/constants";
import type { EntityStatus } from "@/types";

const statusConfig: Record<EntityStatus, { bg: string; text: string; dot: string }> = {
  "On Track": {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  Achieved: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    dot: "bg-blue-500",
  },
  Behind: {
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-500",
  },
  "At Risk": {
    bg: "bg-amber-50",
    text: "text-amber-600",
    dot: "bg-amber-500",
  },
  "Not Started": {
    bg: "bg-slate-100",
    text: "text-slate-500",
    dot: "bg-slate-400",
  },
};

interface StatusBadgeProps {
  status: EntityStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const cfg = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {getStatusLabel(status, t)}
    </span>
  );
}
