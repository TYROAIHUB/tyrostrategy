import type { ReactNode } from "react";

interface InfoCell {
  label: string;
  value: string | ReactNode;
  mono?: boolean;
  color?: string;
}

interface InfoGridProps {
  rows: InfoCell[][];
}

export default function InfoGrid({ rows }: InfoGridProps) {
  return (
    <div className="rounded-xl bg-tyro-surface/60 border border-tyro-border/20 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-sm overflow-hidden divide-y divide-tyro-border/20">
      {rows.map((cells, rowIdx) => (
        <div key={rowIdx} className={`grid grid-cols-${cells.length} divide-x divide-tyro-border/20`}>
          {cells.map((cell, cellIdx) => (
            <div key={cellIdx} className="px-3 py-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-tyro-text-muted block mb-0.5">
                {cell.label}
              </span>
              {typeof cell.value === "string" ? (
                <p
                  className={`text-[12px] font-medium truncate ${cell.mono ? "font-mono text-tyro-text-secondary tabular-nums" : "text-tyro-text-primary"}`}
                  style={cell.color ? { color: cell.color } : undefined}
                >
                  {cell.value || "—"}
                </p>
              ) : (
                cell.value
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
