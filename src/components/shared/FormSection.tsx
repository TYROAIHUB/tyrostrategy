import type { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  children: ReactNode;
}

export default function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="rounded-xl bg-tyro-surface/60 border border-tyro-border/20 p-4 space-y-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-tyro-text-muted">
        {title}
      </h4>
      {children}
    </div>
  );
}
