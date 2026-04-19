import type { ReactNode } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import TagChip from "@/components/ui/TagChip";
import { useSidebarTheme } from "@/hooks/useSidebarTheme";
import type { EntityStatus } from "@/types";

const STATUS_HEX: Record<string, string> = {
  "On Track": "#10b981", "At Risk": "#f59e0b", "High Risk": "#ef4444",
  "Achieved": "#3b82f6", "Not Started": "#94a3b8", "Cancelled": "#6b7280", "On Hold": "#8b5cf6",
};

interface ParentContext {
  id: string;
  name: string;
  owner: string;
  source: string;
  status: EntityStatus;
  progress: number;
}

interface EntityHeaderProps {
  id: string;
  name: string;
  description?: string;
  status: EntityStatus;
  progress: number;
  tags?: string[];
  parentContext?: ParentContext;
  actions?: ReactNode;
}

export default function EntityHeader({ id, name, description, status, progress, tags, parentContext, actions }: EntityHeaderProps) {
  const sidebarTheme = useSidebarTheme();
  const stColor = STATUS_HEX[status] ?? "#94a3b8";

  const isDark = sidebarTheme.isDark !== false;
  const txtColor = isDark ? "#ffffff" : "#1e293b";
  const txtMuted = isDark ? "rgba(255,255,255,0.7)" : "rgba(30,41,59,0.6)";
  const sepColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)";

  return (
    <div
      className="relative rounded-xl overflow-hidden px-4 py-3"
      style={{ background: sidebarTheme.bg }}
    >
      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${sidebarTheme.accentColor ?? "rgba(255,255,255,0.4)"} 1px, transparent 0)`,
          backgroundSize: "20px 20px",
        }}
      />
      {/* Decorative glow */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20"
        style={{ backgroundColor: sidebarTheme.accentColor ?? "#c8922a" }}
      />

      <div className="relative z-10">
        {/* Row 0: ID + Actions */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-bold tabular-nums" style={{ color: txtMuted }}>
            {id}
          </span>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        {/* Separator */}
        <div className="h-px rounded-full mb-2" style={{ background: `linear-gradient(to right, transparent, ${sepColor} 30%, ${sepColor} 70%, transparent)` }} />

        {/* Parent context (for aksiyonlar) */}
        {parentContext && (
          <div className="rounded-lg px-3 py-2 mb-2" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)", border: `1px solid ${sepColor}` }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold tabular-nums" style={{ color: txtMuted }}>{parentContext.id}</span>
              <span className="text-[12px] font-semibold truncate max-w-[200px]" style={{ color: txtColor }}>{parentContext.name}</span>
              <span className="text-[11px]" style={{ color: txtMuted }}>{parentContext.owner}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)", color: txtMuted }}>
                {parentContext.source}
              </span>
              <StatusBadge status={parentContext.status} />
              <span className="text-[11px] font-bold tabular-nums ml-auto" style={{ color: txtMuted }}>%{parentContext.progress}</span>
            </div>
          </div>
        )}

        {/* Title */}
        <h3
          className="text-[15px] font-bold leading-snug"
          style={{ color: sidebarTheme.textPrimary ?? "#ffffff" }}
        >
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p
            className="text-[11px] leading-relaxed mt-1 line-clamp-2"
            style={{ color: sidebarTheme.textSecondary ?? "rgba(255,255,255,0.6)" }}
          >
            {description}
          </p>
        )}

        {/* Status + Tags + Progress */}
        <div className="flex items-center flex-wrap gap-2 mt-2">
          <StatusBadge status={status} />
          {tags && tags.length > 0 && (
            <>
              <span className="w-px h-3.5 rounded-full" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }} />
              {tags.map((tag) => (
                <TagChip key={tag} name={tag} size="md" showIcon />
              ))}
            </>
          )}
          <span className="ml-auto text-[13px] font-extrabold tabular-nums" style={{ color: txtColor }}>
            %{progress}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, backgroundColor: stColor }}
          />
        </div>
      </div>
    </div>
  );
}

/** Glassmorphic button helper — use inside EntityHeader actions slot */
export function HeaderButton({ onClick, children, variant = "default" }: { onClick: () => void; children: ReactNode; variant?: "default" | "danger" }) {
  const sidebarTheme = useSidebarTheme();
  const isDark = sidebarTheme.isDark !== false;
  const btnBg = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)";
  const btnBgHover = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)";
  const btnBorder = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)";
  const btnBorderHover = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)";
  const txtColor = variant === "danger" ? "#ef4444" : (isDark ? "#ffffff" : "#1e293b");

  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 px-3.5 rounded-xl flex items-center gap-2 text-[12px] font-semibold transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.03] active:scale-[0.97]"
      style={{ backgroundColor: btnBg, color: txtColor, border: `1px solid ${btnBorder}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnBgHover; e.currentTarget.style.borderColor = btnBorderHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnBg; e.currentTarget.style.borderColor = btnBorder; }}
    >
      {children}
    </button>
  );
}

/** Icon-only header button */
export function HeaderIconButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  const sidebarTheme = useSidebarTheme();
  const isDark = sidebarTheme.isDark !== false;
  const btnBg = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)";
  const btnBgHover = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)";
  const btnBorder = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)";
  const btnBorderHover = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)";
  const txtColor = isDark ? "#ffffff" : "#1e293b";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-md hover:scale-[1.05] active:scale-[0.95]"
      style={{ backgroundColor: btnBg, color: txtColor, border: `1px solid ${btnBorder}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnBgHover; e.currentTarget.style.borderColor = btnBorderHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = btnBg; e.currentTarget.style.borderColor = btnBorder; }}
    >
      {children}
    </button>
  );
}
