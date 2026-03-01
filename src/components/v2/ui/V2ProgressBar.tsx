"use client";

import { motion } from "framer-motion";

interface V2ProgressBarProps {
  value: number; // 0-100
  height?: number;
  color?: string;
  bgColor?: string;
  className?: string;
}

export function V2ProgressBar({
  value,
  height = 2,
  color = "var(--v2-accent)",
  bgColor = "var(--v2-bg-active)",
  className = "",
}: V2ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`w-full overflow-hidden rounded-full ${className}`}
      style={{ height, backgroundColor: bgColor }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1] as const,
        }}
      />
    </div>
  );
}
