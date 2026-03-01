"use client";

import { motion } from "framer-motion";

interface MiniBarChartProps {
  data: number[];
  color?: string;
  secondaryColor?: string;
  height?: number;
  className?: string;
}

export function MiniBarChart({
  data,
  color = "var(--v2-accent)",
  secondaryColor = "var(--v2-bg-active)",
  height = 40,
  className = "",
}: MiniBarChartProps) {
  const max = Math.max(...data, 1);
  const barWidth = 100 / data.length;

  return (
    <div className={`flex items-end gap-[2px] ${className}`} style={{ height }}>
      {data.map((value, i) => {
        const barHeight = (value / max) * 100;
        const isHighlighted = i >= data.length - 3;
        return (
          <motion.div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              backgroundColor: isHighlighted ? color : secondaryColor,
              minWidth: 3,
            }}
            initial={{ height: 0 }}
            animate={{ height: `${barHeight}%` }}
            transition={{
              duration: 0.5,
              delay: i * 0.03,
              ease: [0.22, 1, 0.36, 1] as const,
            }}
          />
        );
      })}
    </div>
  );
}
