"use client";

import { Shield, UserCog, Users, User, Lock, Eye, Bell } from "lucide-react";

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badgeClass: string;
}

function RoleCard({ icon, title, description, badgeClass }: RoleCardProps) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${badgeClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted mt-0.5">{description}</p>
      </div>
    </div>
  );
}

const roles: RoleCardProps[] = [
  {
    icon: <Shield className="h-4 w-4 text-red-600" />,
    title: "Admin",
    description:
      "Vollzugriff auf alle Funktionen, Billing, Org-Einstellungen",
    badgeClass: "bg-red-50",
  },
  {
    icon: <UserCog className="h-4 w-4 text-blue-600" />,
    title: "HR",
    description:
      "Alle Mitarbeiter sehen, Karriere-Pfade verwalten, private Notizen",
    badgeClass: "bg-blue-50",
  },
  {
    icon: <Users className="h-4 w-4 text-amber-600" />,
    title: "Manager",
    description:
      "Direkte Mitarbeiter sehen, OKRs zuweisen, Kurse zuweisen",
    badgeClass: "bg-amber-50",
  },
  {
    icon: <User className="h-4 w-4 text-green-600" />,
    title: "Mitarbeiter",
    description: "Eigene Daten verwalten",
    badgeClass: "bg-green-50",
  },
];

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function SettingRow({ icon, title, description }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-cream-300/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cream-100 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
      <span className="badge badge-gray">Coming Soon</span>
    </div>
  );
}

export function OrgRightsTab() {
  return (
    <div className="space-y-8">
      {/* Rollen-Ubersicht */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Rollen-Ubersicht
        </h3>
        <p className="text-xs text-muted mb-4">
          Jede Rolle hat vordefinierte Berechtigungen.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {roles.map((role) => (
            <RoleCard key={role.title} {...role} />
          ))}
        </div>
      </div>

      {/* Erweiterte Einstellungen */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Erweiterte Einstellungen
        </h3>
        <p className="text-xs text-muted mb-4">
          Detaillierte Berechtigungssteuerung.
        </p>

        <div className="card p-4">
          <SettingRow
            icon={<Lock className="h-4 w-4 text-muted" />}
            title="OKR-Sichtbarkeit"
            description="Bestimme, wer OKRs anderer Mitarbeiter sehen kann"
          />
          <SettingRow
            icon={<Eye className="h-4 w-4 text-muted" />}
            title="Karriere-Daten"
            description="Zugriff auf Karriere-Fortschritte und Level-Informationen"
          />
          <SettingRow
            icon={<Bell className="h-4 w-4 text-muted" />}
            title="Benachrichtigungen"
            description="Wer erhaelt Check-in-Erinnerungen und Updates"
          />
        </div>
      </div>
    </div>
  );
}
