import type { ReactNode } from "react";

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

export function MetricCard({ icon, label, children }: MetricCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
