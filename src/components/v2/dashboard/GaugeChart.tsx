"use client";

import { motion } from "framer-motion";

interface GaugeChartProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function GaugeChart({
  value,
  size = 120,
  strokeWidth = 10,
  className = "",
}: GaugeChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const progress = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size / 2 + 10 }}>
      <svg
        width={size}
        height={size / 2 + strokeWidth}
        viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="var(--v2-bg-active)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <motion.path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="var(--v2-accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 1.2,
            ease: [0.22, 1, 0.36, 1] as const,
          }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <span className="text-[20px] font-bold text-[var(--v2-text)]" style={{ letterSpacing: "-0.03em" }}>
          {value.toFixed(1)}
        </span>
        <span className="text-[11px] font-semibold text-[var(--v2-text-2)]">%</span>
      </div>
    </div>
  );
}
