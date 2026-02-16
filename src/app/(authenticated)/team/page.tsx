"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  Loader2,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser, useOKRs } from "@/lib/queries";
import { getCurrentQuarter, progressToScore, getCategoryLabel, getCategoryClassName } from "@/lib/okr-logic";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TeamStatsBar } from "@/components/team/TeamStatsBar";
import type { OKR } from "@/types";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
}

interface TeamStats {
  totalMembers: number;
  totalOKRs: number;
  avgProgress: number;
  atRiskCount: number;
}

function useTeamData() {
  return useQuery<{ members: TeamMember[]; stats: TeamStats }>({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch("/api/team");
      if (!res.ok) throw new Error("Fehler beim Laden des Teams");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });
}

type TabId = "overview" | "development" | "okrs";

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const { data: teamData, isLoading } = useTeamData();
  const { data: userData } = useCurrentUser();
  const currentQuarter = getCurrentQuarter();
  const { data: okrData } = useOKRs(currentQuarter);

  const members = teamData?.members || [];
  const stats = teamData?.stats || { totalMembers: 0, totalOKRs: 0, avgProgress: 0, atRiskCount: 0 };
  const currentUser = userData?.user;
  const isAdmin = currentUser && ["admin", "super_admin"].includes(currentUser.role);

  // Team OKRs - all OKRs visible (for managers/admins this shows all org OKRs)
  const allOKRs: OKR[] = okrData?.okrs || [];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-cream-300/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Team</h1>
            <p className="text-[12px] text-muted">
              {stats.totalMembers} {stats.totalMembers === 1 ? "Mitglied" : "Mitglieder"}
            </p>
          </div>
          {isAdmin && (
            <Link href="/organization" className="btn-secondary text-[13px] gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              Einladen
            </Link>
          )}
        </div>

        {/* Stats Bar */}
        <TeamStatsBar
          teamCount={stats.totalMembers}
          okrCount={stats.totalOKRs}
          avgProgress={stats.avgProgress}
          atRiskCount={stats.atRiskCount}
        />

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4">
          {([
            { id: "overview" as TabId, label: "Übersicht", icon: Users },
            { id: "development" as TabId, label: "Entwicklung", icon: TrendingUp },
            { id: "okrs" as TabId, label: "OKRs", icon: Target },
          ]).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-foreground text-white"
                    : "text-muted hover:bg-cream-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "overview" && (
          <OverviewTab members={members} />
        )}
        {activeTab === "development" && (
          <DevelopmentTab members={members} />
        )}
        {activeTab === "okrs" && (
          <TeamOKRsTab members={members} />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return (
      <div className="empty-state">
        <Users className="empty-state-icon" />
        <p className="empty-state-title">Noch keine Teammitglieder</p>
        <p className="empty-state-description">
          Lade Mitglieder über die Organisationseinstellungen ein.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const initials = member.name
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "?";

        return (
          <div key={member.id} className="card p-4 flex items-center gap-4">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt={member.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center">
                <span className="text-[12px] font-medium text-foreground">{initials}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-foreground truncate">{member.name}</p>
              <p className="text-[12px] text-muted truncate">{member.department || member.email}</p>
            </div>
            <span className={`badge text-[11px] ${
              member.role === "super_admin" ? "badge-red" :
              member.role === "admin" ? "badge-yellow" :
              member.role === "manager" ? "badge-blue" :
              member.role === "hr" ? "badge-green" :
              "badge-gray"
            }`}>
              {member.role === "super_admin" ? "Super Admin" :
               member.role === "admin" ? "Admin" :
               member.role === "manager" ? "Manager" :
               member.role === "hr" ? "HR" : "Mitarbeiter"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DevelopmentTab({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return (
      <div className="empty-state">
        <TrendingUp className="empty-state-icon" />
        <p className="empty-state-title">Keine Entwicklungsdaten</p>
        <p className="empty-state-description">
          Karrierepfade werden in Kürze verfügbar sein.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const initials = member.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
        return (
          <div key={member.id} className="card p-4 flex items-center gap-4">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt={member.name} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-cream-200 flex items-center justify-center">
                <span className="text-[11px] font-medium text-foreground">{initials}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-foreground truncate">{member.name}</p>
              <p className="text-[11px] text-muted">{member.department || "Kein Department"}</p>
            </div>
            <span className="text-[12px] text-muted">Karrierepfad wird geladen...</span>
          </div>
        );
      })}
    </div>
  );
}

function TeamOKRsTab({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return (
      <div className="empty-state">
        <Target className="empty-state-icon" />
        <p className="empty-state-title">Keine Team-OKRs</p>
        <p className="empty-state-description">
          Hier werden die OKRs deines Teams angezeigt, sobald Mitglieder OKRs erstellt haben.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[12px] text-muted mb-4">
        Team-OKR-Übersicht wird in einer zukünftigen Version verfügbar sein. Nutze die Übersicht-Ansicht, um Teammitglieder zu sehen.
      </p>
      <Link href="/okrs" className="btn-secondary text-[13px] gap-1.5 inline-flex">
        Zu deinen OKRs
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
