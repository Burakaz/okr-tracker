"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface MiniAreaChartProps {
  data: number[];
  height?: number;
  color?: string;
  className?: string;
}

export function MiniAreaChart({
  data,
  height = 60,
  color = "var(--v2-accent)",
  className = "",
}: MiniAreaChartProps) {
  const { linePath, areaPath } = useMemo(() => {
    if (data.length < 2) return { linePath: "", areaPath: "" };
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const w = 200;
    const h = height;
    const padding = 2;

    const points = data.map((val, i) => ({
      x: (i / (data.length - 1)) * w,
      y: padding + (1 - (val - min) / range) * (h - padding * 2),
    }));

    const line = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(" ");
    const area = `${line} L ${w},${h} L 0,${h} Z`;

    return { linePath: line, areaPath: area };
  }, [data, height]);

  return (
    <div className={className}>
      <svg viewBox={`0 0 200 ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <motion.path
          d={areaPath}
          fill="url(#areaGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] as const }}
        />
      </svg>
    </div>
  );
}
