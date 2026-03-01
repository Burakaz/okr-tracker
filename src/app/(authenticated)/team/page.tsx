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
  Building2,
  Shield,
  CreditCard,
  Layers,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser, useOKRs, useOrganization, useOrganizationMembers } from "@/lib/queries";
import { getCurrentQuarter, progressToScore, getCategoryLabel, getCategoryClassName } from "@/lib/okr-logic";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TeamStatsBar } from "@/components/team/TeamStatsBar";
import { OrgGeneralTab } from "@/components/organization/OrgGeneralTab";
import { OrgMembersTab } from "@/components/organization/OrgMembersTab";
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

type TopTabId = "team" | "org";
type TeamTabId = "overview" | "development" | "okrs";
type OrgTabId = "general" | "members" | "teams" | "rights" | "billing";

export default function TeamPage() {
  const [topTab, setTopTab] = useState<TopTabId>("team");
  const [teamTab, setTeamTab] = useState<TeamTabId>("overview");
  const [orgTab, setOrgTab] = useState<OrgTabId>("general");

  const { data: teamData, isLoading } = useTeamData();
  const { data: userData } = useCurrentUser();
  const currentQuarter = getCurrentQuarter();
  const { data: okrData } = useOKRs(currentQuarter);
  const { data: orgData } = useOrganization();

  const members = teamData?.members || [];
  const stats = teamData?.stats || { totalMembers: 0, totalOKRs: 0, avgProgress: 0, atRiskCount: 0 };
  const currentUser = userData?.user;
  const isAdmin = currentUser && ["admin", "super_admin"].includes(currentUser.role);
  const isManager = currentUser && ["admin", "super_admin", "hr", "manager"].includes(currentUser.role);
  const org = orgData?.organization;

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
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-cream-300/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Team & Organisation</h1>
            <p className="text-[12px] text-muted">
              {stats.totalMembers} {stats.totalMembers === 1 ? "Mitglied" : "Mitglieder"}
              {org ? ` · ${org.name}` : ""}
            </p>
          </div>
        </div>

        {/* Top-level tabs: Team / Organisation */}
        <div className="flex items-center gap-1 mb-4">
          <button
            onClick={() => setTopTab("team")}
            className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${
              topTab === "team"
                ? "bg-foreground text-white"
                : "text-muted hover:bg-cream-200"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Übersicht
          </button>
          {isAdmin && (
            <button
              onClick={() => setTopTab("org")}
              className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${
                topTab === "org"
                  ? "bg-foreground text-white"
                  : "text-muted hover:bg-cream-200"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Organisation
            </button>
          )}
        </div>

        {/* Sub-tabs for team view */}
        {topTab === "team" && (
          <>
            <TeamStatsBar
              teamCount={stats.totalMembers}
              okrCount={stats.totalOKRs}
              avgProgress={stats.avgProgress}
              atRiskCount={stats.atRiskCount}
            />
            <div className="flex items-center gap-1 mt-4">
              {([
                { id: "overview" as TeamTabId, label: "Mitglieder", icon: Users },
                { id: "development" as TeamTabId, label: "Entwicklung", icon: TrendingUp },
                { id: "okrs" as TeamTabId, label: "OKRs", icon: Target },
              ]).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTeamTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors ${
                      teamTab === tab.id
                        ? "bg-cream-200 text-foreground"
                        : "text-muted hover:bg-cream-100"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Sub-tabs for org view */}
        {topTab === "org" && (
          <div className="flex items-center gap-1 overflow-x-auto">
            {([
              { id: "general" as OrgTabId, label: "Allgemein", icon: Building2 },
              { id: "members" as OrgTabId, label: "Mitglieder", icon: Users },
              { id: "teams" as OrgTabId, label: "Teams", icon: Layers },
              { id: "rights" as OrgTabId, label: "Rechte", icon: Shield },
              { id: "billing" as OrgTabId, label: "Billing", icon: CreditCard },
            ]).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setOrgTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors whitespace-nowrap ${
                    orgTab === tab.id
                      ? "bg-cream-200 text-foreground"
                      : "text-muted hover:bg-cream-100"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Team tabs */}
        {topTab === "team" && (
          <>
            {teamTab === "overview" && <OverviewTab members={members} />}
            {teamTab === "development" && <DevelopmentTab members={members} />}
            {teamTab === "okrs" && <TeamOKRsTab members={members} />}
          </>
        )}

        {/* Organization tabs */}
        {topTab === "org" && (
          <>
            {orgTab === "general" && <OrgGeneralTab />}
            {orgTab === "members" && <OrgMembersTab />}
            {orgTab === "teams" && (
              <div className="empty-state">
                <Layers className="empty-state-icon" />
                <p className="empty-state-title">Teams</p>
                <p className="empty-state-description">
                  Team-Verwaltung wird in Kürze verfügbar sein.
                </p>
              </div>
            )}
            {orgTab === "rights" && (
              <div className="space-y-4">
                <h3 className="text-[15px] font-semibold text-foreground">Rollenübersicht</h3>
                <div className="space-y-3">
                  {[
                    { role: "Super Admin", desc: "Vollzugriff auf alle Funktionen, kann nicht geändert werden.", badge: "badge-red" },
                    { role: "Admin", desc: "Kann Organisation verwalten, Mitglieder einladen und Rollen ändern.", badge: "badge-yellow" },
                    { role: "HR", desc: "Kann Mitgliederprofile einsehen und Karrierepfade verwalten.", badge: "badge-green" },
                    { role: "Manager", desc: "Kann Team-OKRs einsehen und Team-Mitglieder coachen.", badge: "badge-blue" },
                    { role: "Mitarbeiter", desc: "Kann eigene OKRs verwalten und an Kursen teilnehmen.", badge: "badge-gray" },
                  ].map((item) => (
                    <div key={item.role} className="card p-4 flex items-start gap-3">
                      <span className={`badge ${item.badge} text-[11px] flex-shrink-0 mt-0.5`}>{item.role}</span>
                      <p className="text-[13px] text-muted">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {orgTab === "billing" && (
              <div className="empty-state">
                <CreditCard className="empty-state-icon" />
                <p className="empty-state-title">Billing</p>
                <p className="empty-state-description">
                  Du befindest dich im kostenlosen Trial. Billing-Optionen werden in Kürze verfügbar sein.
                </p>
              </div>
            )}
          </>
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
