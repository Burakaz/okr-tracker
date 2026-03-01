interface V2BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "warning" | "danger" | "info";
  className?: string;
}

const VARIANTS: Record<string, string> = {
  default: "bg-[var(--v2-bg-active)] text-[var(--v2-text-2)]",
  accent: "bg-[var(--v2-accent-muted)] text-[var(--v2-accent)]",
  warning: "bg-[rgba(245,158,11,0.08)] text-[var(--v2-warning)]",
  danger: "bg-[rgba(239,68,68,0.08)] text-[var(--v2-danger)]",
  info: "bg-[rgba(59,130,246,0.08)] text-[var(--v2-info)]",
};

export function V2Badge({ children, variant = "default", className = "" }: V2BadgeProps) {
  return (
    <span className={`v2-badge ${VARIANTS[variant] || VARIANTS.default} ${className}`}>
      {children}
    </span>
  );
}
