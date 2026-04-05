"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Loader2,
  Building2,
  Shield,
  CreditCard,
  Layers,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/queries";
import { Tabs } from "@/components/ui/Tabs";
import { TeamStatsBar } from "@/components/team/TeamStatsBar";
import { MemberAccordionItem } from "@/components/team/MemberAccordionItem";
import { OrgGeneralTab } from "@/components/organization/OrgGeneralTab";
import { OrgMembersTab } from "@/components/organization/OrgMembersTab";
import type { TeamMemberOKRStats } from "@/types";
import type { TabItem } from "@/components/ui/Tabs";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  avatar_url: string | null;
  status: string;
  position: string | null;
  craft_focus: string | null;
  career_level_id: string | null;
  created_at: string;
}

interface TeamStats {
  totalMembers: number;
  totalOKRs: number;
  avgProgress: number;
  atRiskCount: number;
}

interface TeamData {
  members: TeamMember[];
  memberOKRStats: Record<string, TeamMemberOKRStats>;
  stats: TeamStats;
}

function useTeamData() {
  return useQuery<TeamData>({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch("/api/team");
      if (!res.ok) throw new Error("Fehler beim Laden des Teams");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });
}

function useOrganization() {
  return useQuery<{ organization: { id: string; name: string; slug: string; domain?: string; logo_url: string | null; created_at: string } }>({
    queryKey: ["organization"],
    queryFn: async () => {
      const res = await fetch("/api/organization");
      if (!res.ok) throw new Error("Fehler beim Laden der Organisation");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

type TopTabId = "team" | "org";
type OrgTabId = "general" | "members" | "teams" | "rights" | "billing";

export default function TeamPage() {
  const [topTab, setTopTab] = useState<TopTabId>("team");
  const [orgTab, setOrgTab] = useState<OrgTabId>("general");
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const { data: teamData, isLoading } = useTeamData();
  const { data: userData } = useCurrentUser();
  const { data: orgData } = useOrganization();

  const members = teamData?.members || [];
  const memberOKRStats = teamData?.memberOKRStats || {};
  const stats = teamData?.stats || { totalMembers: 0, totalOKRs: 0, avgProgress: 0, atRiskCount: 0 };
  const currentUser = userData?.user;
  const isAdmin = currentUser && ["admin", "super_admin"].includes(currentUser.role);
  const isManager = currentUser && ["admin", "super_admin", "hr", "manager"].includes(currentUser.role);
  const org = orgData?.organization;

  // Determine if the current user can edit a specific member
  const canEditMember = (member: TeamMember): boolean => {
    if (!currentUser) return false;
    if (["hr", "admin", "super_admin"].includes(currentUser.role)) return true;
    if (currentUser.role === "manager") return true;
    return false;
  };

  const topTabs = useMemo(() => {
    const t: TabItem<TopTabId>[] = [
      { key: "team", label: "Übersicht", icon: Users },
    ];
    if (isAdmin) t.push({ key: "org", label: "Organisation", icon: Building2 });
    return t;
  }, [isAdmin]);

  const orgTabs = useMemo((): TabItem<OrgTabId>[] => [
    { key: "general", label: "Allgemein", icon: Building2 },
    { key: "members", label: "Mitglieder", icon: Users },
    { key: "teams", label: "Teams", icon: Layers },
    { key: "rights", label: "Rechte", icon: Shield },
    { key: "billing", label: "Billing", icon: CreditCard },
  ], []);

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
      <div className="border-b border-cream-300/50">
       <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 max-w-[1400px] mx-auto">
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
        <div className="mb-4">
          <Tabs
            tabs={topTabs}
            activeTab={topTab}
            onTabChange={setTopTab}
            variant="pill"
            ariaLabel="Team und Organisation"
          />
        </div>

        {/* Team stats bar */}
        {topTab === "team" && (
          <TeamStatsBar
            teamCount={stats.totalMembers}
            okrCount={stats.totalOKRs}
            avgProgress={stats.avgProgress}
            atRiskCount={stats.atRiskCount}
          />
        )}

        {/* Sub-tabs for org view */}
        {topTab === "org" && (
          <Tabs
            tabs={orgTabs}
            activeTab={orgTab}
            onTabChange={setOrgTab}
            variant="pill"
            ariaLabel="Organisationseinstellungen"
          />
        )}
       </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
       <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
        {/* Team view — unified accordion */}
        {topTab === "team" && (
          <div role="tabpanel" id="panel-top-team" aria-labelledby="tab-top-team">
          <TeamMembersAccordion
            members={members}
            memberOKRStats={memberOKRStats}
            expandedMemberId={expandedMemberId}
            onToggle={(id) => setExpandedMemberId(expandedMemberId === id ? null : id)}
            canEditMember={canEditMember}
          />
          </div>
        )}

        {/* Organization tabs */}
        {topTab === "org" && (
          <>
            {orgTab === "general" && <div role="tabpanel" id="panel-org-general" aria-labelledby="tab-org-general"><OrgGeneralTab /></div>}
            {orgTab === "members" && <div role="tabpanel" id="panel-org-members" aria-labelledby="tab-org-members"><OrgMembersTab /></div>}
            {orgTab === "teams" && (
              <div role="tabpanel" id="panel-org-teams" aria-labelledby="tab-org-teams">
              <div className="empty-state">
                <Layers className="empty-state-icon" />
                <p className="empty-state-title">Teams</p>
                <p className="empty-state-description">
                  Team-Verwaltung wird in Kürze verfügbar sein.
                </p>
              </div>
              </div>
            )}
            {orgTab === "rights" && (
              <div role="tabpanel" id="panel-org-rights" aria-labelledby="tab-org-rights">
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
              </div>
            )}
            {orgTab === "billing" && (
              <div role="tabpanel" id="panel-org-billing" aria-labelledby="tab-org-billing">
              <div className="empty-state">
                <CreditCard className="empty-state-icon" />
                <p className="empty-state-title">Billing</p>
                <p className="empty-state-description">
                  Du befindest dich im kostenlosen Trial. Billing-Optionen werden in Kürze verfügbar sein.
                </p>
              </div>
              </div>
            )}
          </>
        )}
       </div>
      </div>
    </div>
  );
}

// ─── Team Members Accordion ─────────────────────────────────────────────────

function TeamMembersAccordion({
  members,
  memberOKRStats,
  expandedMemberId,
  onToggle,
  canEditMember,
}: {
  members: TeamMember[];
  memberOKRStats: Record<string, TeamMemberOKRStats>;
  expandedMemberId: string | null;
  onToggle: (id: string) => void;
  canEditMember: (member: TeamMember) => boolean;
}) {
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
    <div className="space-y-3 mt-4">
      {members.map((member) => (
        <MemberAccordionItem
          key={member.id}
          member={member}
          isExpanded={expandedMemberId === member.id}
          onToggle={() => onToggle(member.id)}
          okrStats={memberOKRStats[member.id]}
          canEdit={canEditMember(member)}
        />
      ))}
    </div>
  );
}
