"use client";

import { useState, useMemo } from "react";
import { Building2, Users, Shield, CreditCard, Loader2, Layers } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { OrgGeneralTab } from "@/components/organization/OrgGeneralTab";
import { OrgMembersTab } from "@/components/organization/OrgMembersTab";
import { useOrganization, useOrganizationMembers } from "@/lib/queries";
import type { TabItem } from "@/components/ui/Tabs";

type TabId = "general" | "members" | "teams" | "rights" | "billing";

const tabItems: TabItem<TabId>[] = [
  { key: "general", label: "Allgemein", icon: Building2 },
  { key: "members", label: "Mitglieder", icon: Users },
  { key: "teams", label: "Teams", icon: Layers },
  { key: "rights", label: "Rechte", icon: Shield },
  { key: "billing", label: "Billing", icon: CreditCard },
];

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const { data: orgData, isLoading: isLoadingOrg } = useOrganization();
  const { data: membersData } = useOrganizationMembers();

  const org = orgData?.organization;
  const memberCount = membersData?.members?.length ?? 0;

  if (isLoadingOrg) {
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
       <div className="px-6 pt-6 pb-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-cream-200 rounded-xl flex items-center justify-center border border-cream-300">
            {org?.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Building2 className="h-6 w-6 text-muted" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{org?.name || "Organisation"}</h1>
            <p className="text-[12px] text-muted">
              {memberCount} {memberCount === 1 ? "Mitglied" : "Mitglieder"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={tabItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="pill"
          ariaLabel="Organisationseinstellungen"
        />
       </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
       <div className="p-6 max-w-5xl mx-auto">
        {activeTab === "general" && <div role="tabpanel" id="panel-general" aria-labelledby="tab-general"><OrgGeneralTab /></div>}
        {activeTab === "members" && <div role="tabpanel" id="panel-members" aria-labelledby="tab-members"><OrgMembersTab /></div>}
        {activeTab === "teams" && (
          <div role="tabpanel" id="panel-teams" aria-labelledby="tab-teams">
          <div className="empty-state">
            <Layers className="empty-state-icon" />
            <p className="empty-state-title">Teams</p>
            <p className="empty-state-description">
              Team-Verwaltung wird in Kürze verfügbar sein.
            </p>
          </div>
          </div>
        )}
        {activeTab === "rights" && (
          <div role="tabpanel" id="panel-rights" aria-labelledby="tab-rights">
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
        {activeTab === "billing" && (
          <div role="tabpanel" id="panel-billing" aria-labelledby="tab-billing">
          <div className="empty-state">
            <CreditCard className="empty-state-icon" />
            <p className="empty-state-title">Billing</p>
            <p className="empty-state-description">
              Du befindest dich im kostenlosen Trial. Billing-Optionen werden in Kürze verfügbar sein.
            </p>
          </div>
          </div>
        )}
       </div>
      </div>
    </div>
  );
}
