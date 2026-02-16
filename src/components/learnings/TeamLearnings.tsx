"use client";

import {
  Users,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useTeamLearnings, useCurrentUser } from "@/lib/queries";
import type { TeamLearningMember } from "@/types";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function SkeletonRow() {
  return (
    <tr>
      <td>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cream-200 animate-pulse" />
          <div className="h-4 bg-cream-200 animate-pulse rounded w-28" />
        </div>
      </td>
      <td>
        <div className="h-3 bg-cream-200 animate-pulse rounded w-20" />
      </td>
      <td>
        <div className="h-3 bg-cream-200 animate-pulse rounded w-8" />
      </td>
      <td>
        <div className="h-3 bg-cream-200 animate-pulse rounded w-8" />
      </td>
      <td>
        <div className="h-2 bg-cream-200 animate-pulse rounded w-24" />
      </td>
    </tr>
  );
}

export function TeamLearnings() {
  const { data: userData } = useCurrentUser();
  const { data, isLoading } = useTeamLearnings();

  const user = userData?.user;
  const members: TeamLearningMember[] = data?.members ?? [];

  // Guard: only managers, hr, admin, super_admin
  const allowedRoles = ["manager", "hr", "admin", "super_admin"];
  if (user && !allowedRoles.includes(user.role)) {
    return (
      <div className="empty-state" role="status">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-400" aria-hidden="true" />
        </div>
        <p className="empty-state-title">Zugriff verweigert</p>
        <p className="empty-state-description">
          Diese Ansicht ist nur fuer Manager und Administratoren verfuegbar.
        </p>
      </div>
    );
  }

  // Compute stats
  const totalMembers = members.length;
  const totalEnrollments = members.reduce(
    (acc, m) => acc + m.enrollments_count,
    0
  );
  const avgProgress =
    totalMembers > 0
      ? Math.round(
          members.reduce((acc, m) => {
            const memberProgress =
              m.total_modules > 0
                ? (m.completed_modules / m.total_modules) * 100
                : 0;
            return acc + memberProgress;
          }, 0) / totalMembers
        )
      : 0;
  const totalCompleted = members.reduce(
    (acc, m) => acc + m.completed_count,
    0
  );

  const stats = [
    {
      icon: <Users className="h-4 w-4 text-blue-500" />,
      count: totalMembers,
      label: "Team-Mitglieder",
    },
    {
      icon: <BookOpen className="h-4 w-4 text-purple-500" />,
      count: totalEnrollments,
      label: "Gesamt Einschreibungen",
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-amber-500" />,
      count: `${avgProgress}%`,
      label: "Durchschnitt Fortschritt",
    },
    {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      count: totalCompleted,
      label: "Abgeschlossen",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="mb-1.5">{stat.icon}</div>
            <p className="text-2xl font-bold text-foreground">{stat.count}</p>
            <p className="text-[11px] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Mitarbeiter</th>
              <th>Abteilung</th>
              <th>Eingeschrieben</th>
              <th>Abgeschlossen</th>
              <th>Fortschritt</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="text-center py-8">
                    <p className="text-[13px] text-muted">
                      Keine Team-Learnings vorhanden
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const progress =
                  member.total_modules > 0
                    ? Math.round(
                        (member.completed_modules / member.total_modules) * 100
                      )
                    : 0;
                const initials = getInitials(member.user_name);

                return (
                  <tr key={member.user_id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.user_name}
                            className="w-8 h-8 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-cream-200 flex items-center justify-center">
                            <span className="text-[11px] font-medium text-foreground">
                              {initials}
                            </span>
                          </div>
                        )}
                        <span className="text-[13px] font-medium text-foreground">
                          {member.user_name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="text-[13px] text-muted">
                        {member.department || "-"}
                      </span>
                    </td>
                    <td>
                      <span className="text-[13px] text-foreground">
                        {member.enrollments_count}
                      </span>
                    </td>
                    <td>
                      <span className="text-[13px] text-foreground">
                        {member.completed_count}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <ProgressBar value={progress} size="sm" />
                        <span className="text-[11px] text-muted whitespace-nowrap">
                          {progress}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
