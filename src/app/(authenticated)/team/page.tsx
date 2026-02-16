"use client";

import { useState } from "react";
import {
  UserPlus,
  Users,
  BookOpen,
  Target,
  Loader2,
} from "lucide-react";
import { useCurrentUser } from "@/lib/queries";
import { TeamStatsBar } from "@/components/team/TeamStatsBar";

type TeamTab = "overview" | "development" | "okrs";

const TABS: { id: TeamTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Ubersicht", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "development", label: "Entwicklung", icon: <BookOpen className="h-3.5 w-3.5" /> },
  { id: "okrs", label: "OKRs", icon: <Target className="h-3.5 w-3.5" /> },
];

export default function TeamPage() {
  const { data: userData, isLoading: isLoadingUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TeamTab>("overview");

  const user = userData?.user ?? null;

  // Placeholder stats (no team data yet)
  const teamCount = 0;
  const okrCount = 0;
  const avgProgress = 0;
  const atRiskCount = 0;

  if (isLoadingUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-cream-300/50">
        <div>
          <h1 className="text-[15px] font-semibold text-foreground">
            Team Management
          </h1>
          <p className="text-[11px] text-muted">
            Verwalte dein Team und gib Entwicklungsziele frei
          </p>
        </div>
        <button className="btn-primary text-[13px] gap-1.5" disabled>
          <UserPlus className="h-3.5 w-3.5" />
          Mitarbeiter einladen
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Stats Bar */}
          <TeamStatsBar
            teamCount={teamCount}
            okrCount={okrCount}
            avgProgress={avgProgress}
            atRiskCount={atRiskCount}
          />

          {/* Tab Navigation */}
          <div className="flex gap-1 border-b border-cream-300/50">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-[1px] ${
                  activeTab === tab.id
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "development" && <DevelopmentTab />}
            {activeTab === "okrs" && <OKRsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="card">
      <div className="empty-state">
        <Users className="empty-state-icon" />
        <p className="empty-state-title">Keine Team-Mitglieder</p>
        <p className="empty-state-description">
          Dir sind noch keine Mitarbeiter zugewiesen.
        </p>
      </div>
    </div>
  );
}

function DevelopmentTab() {
  return (
    <div className="card">
      <div className="empty-state">
        <BookOpen className="empty-state-icon" />
        <p className="empty-state-title">Keine Entwicklungsziele</p>
        <p className="empty-state-description">
          Sobald Team-Mitglieder zugewiesen sind, erscheinen hier ihre
          Entwicklungsziele.
        </p>
      </div>
    </div>
  );
}

function OKRsTab() {
  return (
    <div className="card">
      <div className="empty-state">
        <Target className="empty-state-icon" />
        <p className="empty-state-title">Keine Team-OKRs</p>
        <p className="empty-state-description">
          Sobald Team-Mitglieder zugewiesen sind, erscheinen hier ihre OKRs.
        </p>
      </div>
    </div>
  );
}
