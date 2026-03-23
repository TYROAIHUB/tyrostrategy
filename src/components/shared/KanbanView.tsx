import type { ReactNode } from "react";

export interface KanbanColumn {
  key: string;
  label: string;
  color: string;
}

interface KanbanViewProps<T> {
  columns: KanbanColumn[];
  items: T[];
  getStatus: (item: T) => string;
  renderCard: (item: T) => ReactNode;
}

export const statusColumns: KanbanColumn[] = [
  { key: "On Track", label: "Yolunda", color: "bg-tyro-success" },
  { key: "At Risk", label: "Risk Altında", color: "bg-tyro-warning" },
  { key: "Behind", label: "Gecikmiş", color: "bg-tyro-danger" },
  { key: "Not Started", label: "Başlanmadı", color: "bg-tyro-text-muted" },
  { key: "Achieved", label: "Tamamlandı", color: "bg-tyro-navy" },
];

export default function KanbanView<T>({
  columns,
  items,
  getStatus,
  renderCard,
}: KanbanViewProps<T>) {
  const grouped = new Map<string, T[]>();
  for (const col of columns) {
    grouped.set(col.key, []);
  }
  for (const item of items) {
    const status = getStatus(item);
    const list = grouped.get(status);
    if (list) {
      list.push(item);
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const colItems = grouped.get(col.key) ?? [];
        return (
          <div key={col.key} className="min-w-[280px] flex-1">
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
              <span className="text-sm font-semibold text-tyro-text-primary">
                {col.label}
              </span>
              <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-tyro-surface px-1.5 text-[10px] font-semibold text-tyro-text-muted">
                {colItems.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {colItems.length === 0 && (
                <div className="rounded-card border border-dashed border-tyro-border p-4 text-center text-xs text-tyro-text-muted">
                  Kayıt yok
                </div>
              )}
              {colItems.map((item, idx) => (
                <div key={idx}>{renderCard(item)}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
