"use client";

import { Users, Target, TrendingUp, AlertTriangle } from "lucide-react";

interface TeamStat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

interface TeamStatsBarProps {
  teamCount: number;
  okrCount: number;
  avgProgress: number;
  atRiskCount: number;
}

export function TeamStatsBar({
  teamCount,
  okrCount,
  avgProgress,
  atRiskCount,
}: TeamStatsBarProps) {
  const stats: TeamStat[] = [
    {
      label: "TEAM",
      value: teamCount,
      icon: <Users className="h-4 w-4" />,
      color: "bg-accent-greenLight text-accent-green",
    },
    {
      label: "OKRS",
      value: okrCount,
      icon: <Target className="h-4 w-4" />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "\u00D8 FORTSCHRITT",
      value: `${avgProgress}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "AT RISK",
      value: atRiskCount,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: atRiskCount > 0 ? "bg-red-50 text-red-600" : "bg-cream-200 text-muted",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="card p-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${stat.color}`}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                {stat.label}
              </p>
              <p className="text-[18px] font-bold text-foreground leading-tight">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
