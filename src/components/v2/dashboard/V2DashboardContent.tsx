"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  TrendingUp,
  Zap,
  BookOpen,
  Target,
  Clock,
  CheckCircle2,
  Send,
} from "lucide-react";
import { PageTransition } from "../motion/PageTransition";
import { StaggerChildren, StaggerItem } from "../motion/StaggerChildren";
import { AnimatedNumber } from "../motion/AnimatedNumber";
import { StatCard } from "./StatCard";
import { InsightBanner } from "./InsightBanner";
import { MiniBarChart } from "./MiniBarChart";
import { GaugeChart } from "./GaugeChart";
import { MiniAreaChart } from "./MiniAreaChart";

// Dummy data
const PROGRESS_DATA = [35, 42, 38, 55, 48, 62, 58, 72, 68, 78, 85, 92];
const LEARNING_DATA = [10, 15, 12, 20, 18, 25, 30, 28, 35, 42, 38, 45];
const UTILIZATION_DATA = [40, 45, 52, 48, 55, 60, 58, 65, 62, 68, 72, 75, 70, 78, 82, 80];
const COMPLETION_DATA = [55, 60, 58, 65, 70, 68, 75, 78, 80, 82, 85, 88, 90, 87, 92, 95];

const RECENT_ACTIVITY = [
  { icon: Target, label: "OKR aktualisiert", detail: "Design System aufbauen — 78%", time: "vor 2h", color: "text-[var(--v2-accent)]" },
  { icon: CheckCircle2, label: "Modul abgeschlossen", detail: "React Hooks Deep Dive", time: "vor 5h", color: "text-[var(--v2-info)]" },
  { icon: TrendingUp, label: "Check-in erstellt", detail: "React Testing Library — +12%", time: "gestern", color: "text-[var(--v2-accent)]" },
  { icon: BookOpen, label: "Kurs gestartet", detail: "Design Grundlagen: Farbe & Layout", time: "vor 2 Tagen", color: "text-[var(--v2-warning)]" },
];

export function V2DashboardContent() {
  const [aiMessage, setAiMessage] = useState("");

  return (
    <PageTransition className="h-full overflow-y-auto">
      <div className="px-6 lg:px-8 py-6 lg:py-8 max-w-[1200px]">
        <StaggerChildren className="space-y-6">

          {/* Header */}
          <StaggerItem>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-[24px] font-bold text-[var(--v2-text)]" style={{ letterSpacing: "var(--v2-tracking-h)" }}>
                  Overview Panel
                </h1>
                <p className="text-[13px] text-[var(--v2-text-2)] mt-1">
                  Q1 2026 · Basierend auf deinen aktuellen Daten
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="v2-btn v2-btn-ghost text-[12px]">
                  <Calendar className="h-3.5 w-3.5" />
                  Jan – Mar 2026
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Insight Banner */}
          <StaggerItem>
            <InsightBanner
              title="Account Insights"
              description="Du bist 12% über dem Teamdurchschnitt. 2 Ziele sind auf Kurs, 1 Kurs steht kurz vor Abschluss."
            />
          </StaggerItem>

          {/* Stat Cards Grid */}
          <StaggerItem>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="OKR Fortschritt"
                value="97"
                suffix=",22%"
                trend={{ value: "8.3%", positive: true }}
                subtitle="vs. letztes Quartal"
              >
                <MiniBarChart data={PROGRESS_DATA} height={36} />
              </StatCard>

              <StatCard title="Ziel-Erreichung" value="" className="items-center">
                <GaugeChart value={71.74} size={140} strokeWidth={12} />
              </StatCard>

              <StatCard
                title="Lernfortschritt"
                value="10"
                suffix=",12%"
                trend={{ value: "3.1%", positive: true }}
                subtitle="Module abgeschlossen"
              >
                <MiniBarChart data={LEARNING_DATA} color="var(--v2-info)" height={36} />
              </StatCard>

              {/* AI Assistant Card */}
              <motion.div
                className="v2-card p-5 flex flex-col gap-3"
                whileHover={{ y: -2, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[var(--v2-accent-muted)] flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-[var(--v2-accent)]" />
                  </div>
                  <span className="text-[12px] font-medium text-[var(--v2-text-2)] uppercase tracking-wider">
                    KI Assistent
                  </span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[13px] text-[var(--v2-text-2)] leading-relaxed">
                    Fokussiere dich auf &ldquo;Design System&rdquo; — es hat die höchste Priorität.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    placeholder="Frage stellen..."
                    className="v2-input text-[12px] !py-1.5 !px-2.5"
                  />
                  <motion.button
                    className="p-1.5 rounded-lg bg-[var(--v2-accent)] text-white flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send className="h-3 w-3" />
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </StaggerItem>

          {/* Second Row: Charts + Activity */}
          <StaggerItem>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Utilization Chart */}
              <motion.div
                className="v2-card v2-card-interactive p-5 flex flex-col gap-3"
                whileHover={{ y: -1 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[var(--v2-text-2)] uppercase tracking-wider">Auslastung</span>
                  <span className="text-[12px] text-[var(--v2-text-3)]">Letzte 4 Wochen</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[28px] font-bold text-[var(--v2-text)]" style={{ letterSpacing: "-0.03em" }}>
                    <AnimatedNumber value={56} />
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--v2-text-2)]">,1%</span>
                </div>
                <MiniAreaChart data={UTILIZATION_DATA} height={50} />
              </motion.div>

              {/* Timely Closures */}
              <motion.div
                className="v2-card v2-card-interactive p-5 flex flex-col gap-3"
                whileHover={{ y: -1 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[var(--v2-text-2)] uppercase tracking-wider">Pünktliche Abschlüsse</span>
                  <span className="text-[12px] text-[var(--v2-text-3)]">Q1 2026</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[28px] font-bold text-[var(--v2-text)]" style={{ letterSpacing: "-0.03em" }}>
                    <AnimatedNumber value={82} />
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--v2-text-2)]">,6%</span>
                </div>
                <MiniAreaChart data={COMPLETION_DATA} height={50} color="var(--v2-info)" />
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                className="v2-card p-5 flex flex-col gap-3"
                whileHover={{ y: -1, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[var(--v2-text-2)] uppercase tracking-wider">Letzte Aktivität</span>
                  <Clock className="h-3.5 w-3.5 text-[var(--v2-text-3)]" />
                </div>
                <div className="flex-1 space-y-1">
                  {RECENT_ACTIVITY.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={i}
                        className="flex items-start gap-2.5 py-1.5 px-1 rounded-lg hover:bg-[var(--v2-bg-hover)] transition-colors cursor-pointer"
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] as const }}
                      >
                        <Icon className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${item.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-[var(--v2-text)] truncate">{item.detail}</p>
                          <p className="text-[11px] text-[var(--v2-text-3)]">{item.time}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </StaggerItem>

          {/* Third Row: Focus Goals */}
          <StaggerItem>
            <div className="v2-card p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[12px] font-medium text-[var(--v2-text-2)] uppercase tracking-wider">Fokus-Ziele</span>
                <motion.button className="v2-btn v2-btn-ghost text-[12px]" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  Alle anzeigen
                </motion.button>
              </div>
              <div className="space-y-2">
                {[
                  { title: "Design System aufbauen", category: "Performance", progress: 78, status: "on_track" },
                  { title: "React Testing Library meistern", category: "Learning", progress: 45, status: "at_risk" },
                  { title: "Team-Onboarding optimieren", category: "Skill", progress: 62, status: "on_track" },
                ].map((goal, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-4 py-3 px-3 rounded-[var(--v2-radius-md)] hover:bg-[var(--v2-bg-hover)] transition-colors cursor-pointer"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.08, ease: [0.22, 1, 0.36, 1] as const }}
                    whileHover={{ x: 2 }}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${goal.status === "on_track" ? "bg-[var(--v2-accent)]" : "bg-[var(--v2-warning)]"}`} />
                    <span className="text-[13px] font-medium text-[var(--v2-text)] flex-1 min-w-0 truncate">{goal.title}</span>
                    <span className="text-[11px] text-[var(--v2-text-3)] flex-shrink-0 hidden sm:block">{goal.category}</span>
                    <div className="w-24 h-1.5 bg-[var(--v2-bg-active)] rounded-full overflow-hidden flex-shrink-0">
                      <motion.div
                        className={`h-full rounded-full ${goal.status === "on_track" ? "bg-[var(--v2-accent)]" : "bg-[var(--v2-warning)]"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${goal.progress}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: [0.22, 1, 0.36, 1] as const }}
                      />
                    </div>
                    <span className="text-[13px] font-medium text-[var(--v2-text)] tabular-nums w-10 text-right flex-shrink-0">{goal.progress}%</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </StaggerItem>

        </StaggerChildren>
      </div>
    </PageTransition>
  );
}
