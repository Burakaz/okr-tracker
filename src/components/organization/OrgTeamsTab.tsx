"use client";

import { Users } from "lucide-react";

export function OrgTeamsTab() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-1">Teams (0)</h2>
      <p className="text-xs text-muted mb-4">
        Erstelle und verwalte Teams in deiner Organisation.
      </p>

      <div className="card">
        <div className="empty-state">
          <Users className="empty-state-icon" />
          <p className="empty-state-title">Noch keine Teams erstellt</p>
          <p className="empty-state-description">
            Erstelle ein Team, um OKRs und Mitglieder zu gruppieren.
          </p>
          <button className="btn-primary mt-4 opacity-50 cursor-not-allowed" type="button" disabled title="Kommt bald">
            Team erstellen
          </button>
        </div>
      </div>
    </div>
  );
}
