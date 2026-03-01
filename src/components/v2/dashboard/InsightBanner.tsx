"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

interface InsightBannerProps {
  title: string;
  description: string;
  className?: string;
}

export function InsightBanner({ title, description, className = "" }: InsightBannerProps) {
  return (
    <motion.div
      className={`v2-accent-gradient rounded-[var(--v2-radius-xl)] p-6 relative overflow-hidden cursor-pointer ${className}`}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/5" />

      <div className="relative z-10 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-white mb-1">{title}</h3>
          <p className="text-[13px] text-white/70 leading-relaxed">{description}</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <ArrowRight className="h-4 w-4 text-white" />
        </div>
      </div>
    </motion.div>
  );
}
