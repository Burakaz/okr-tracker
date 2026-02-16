"use client";

import { useState } from "react";
import {
  Settings,
  Users,
  Layers,
  Shield,
  CreditCard,
} from "lucide-react";
import { useCurrentUser } from "@/lib/queries";
import { OrgHeader } from "@/components/organization/OrgHeader";
import { OrgGeneralTab } from "@/components/organization/OrgGeneralTab";
import { OrgMembersTab } from "@/components/organization/OrgMembersTab";
import { OrgTeamsTab } from "@/components/organization/OrgTeamsTab";
import { OrgRightsTab } from "@/components/organization/OrgRightsTab";
import { OrgBillingTab } from "@/components/organization/OrgBillingTab";

type TabKey = "allgemein" | "mitglieder" | "teams" | "rechte" | "billing";

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "allgemein", label: "Allgemein", icon: <Settings className="h-3.5 w-3.5" /> },
  { key: "mitglieder", label: "Mitglieder", icon: <Users className="h-3.5 w-3.5" /> },
  { key: "teams", label: "Teams", icon: <Layers className="h-3.5 w-3.5" /> },
  { key: "rechte", label: "Rechte", icon: <Shield className="h-3.5 w-3.5" /> },
  { key: "billing", label: "Billing", icon: <CreditCard className="h-3.5 w-3.5" /> },
];

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("allgemein");
  const { data, isLoading } = useCurrentUser();

  const user = data?.user;

  // Mock org data - will be replaced with real API data
  const orgName = "ADMKRS";
  const orgDomain = "admkrs.com";
  const orgLogo: string | null = null;
  const memberCount = 1;
  const teamCount = 0;
  const inviteLink = "https://app.admkrs.com/invite/abc123";

  // Build members list from the current user for now
  const members = user ? [user] : [];

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-48 bg-cream-300 rounded" />
            <div className="h-4 w-72 bg-cream-200 rounded" />
            <div className="h-24 bg-cream-200 rounded-2xl" />
            <div className="h-10 bg-cream-200 rounded-lg" />
            <div className="h-64 bg-cream-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">
            Organisation verwalten
          </h1>
          <p className="text-sm text-muted mt-1">
            Einstellungen, Mitglieder und Teams deiner Organisation
          </p>
        </div>

        {/* Dark Header Banner */}
        <div className="mb-6">
          <OrgHeader
            orgName={orgName}
            domain={orgDomain}
            memberCount={memberCount}
            teamCount={teamCount}
            logoUrl={orgLogo}
            planLabel="Trial"
          />
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-cream-300">
          <nav className="flex gap-1 -mb-px" aria-label="Organisation Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium
                  border-b-2 transition-colors
                  ${
                    activeTab === tab.key
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted hover:text-foreground hover:border-cream-400"
                  }
                `}
                type="button"
                aria-selected={activeTab === tab.key}
                role="tab"
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div role="tabpanel">
          {activeTab === "allgemein" && (
            <OrgGeneralTab
              orgName={orgName}
              domain={orgDomain}
              logoUrl={orgLogo}
              inviteLink={inviteLink}
            />
          )}
          {activeTab === "mitglieder" && (
            <OrgMembersTab members={members} />
          )}
          {activeTab === "teams" && <OrgTeamsTab />}
          {activeTab === "rechte" && <OrgRightsTab />}
          {activeTab === "billing" && (
            <OrgBillingTab
              planName="Trial"
              seats={memberCount}
              pricePerSeat="EUR 2.00/Mo"
              isTrial={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}
