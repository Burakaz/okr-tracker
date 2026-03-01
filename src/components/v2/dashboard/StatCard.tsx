"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  suffix?: string;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  suffix,
  subtitle,
  trend,
  children,
  className = "",
  onClick,
}: StatCardProps) {
  return (
    <motion.div
      className={`v2-card v2-card-interactive p-5 flex flex-col gap-3 ${className}`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-[var(--v2-text-2)] uppercase tracking-wider">
          {title}
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-[var(--v2-text-3)]" />
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        <span className="v2-stat-number">{value}</span>
        {suffix && <sup className="text-[14px] font-semibold text-[var(--v2-text-2)]">{suffix}</sup>}
      </div>

      {/* Trend + Subtitle */}
      {(trend || subtitle) && (
        <div className="flex items-center gap-2">
          {trend && (
            <span className={`text-[12px] font-medium ${trend.positive ? "text-[var(--v2-accent)]" : "text-[var(--v2-danger)]"}`}>
              {trend.positive ? "+" : ""}{trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-[12px] text-[var(--v2-text-3)]">{subtitle}</span>
          )}
        </div>
      )}

      {/* Chart area */}
      {children && <div className="mt-auto pt-1">{children}</div>}
    </motion.div>
  );
}
