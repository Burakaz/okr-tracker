"use client";

import { Building2, Globe, Users, Layers } from "lucide-react";

interface OrgHeaderProps {
  orgName: string;
  domain: string;
  memberCount: number;
  teamCount: number;
  logoUrl: string | null;
  planLabel: string;
}

export function OrgHeader({
  orgName,
  domain,
  memberCount,
  teamCount,
  logoUrl,
  planLabel,
}: OrgHeaderProps) {
  return (
    <div className="rounded-2xl bg-foreground text-white p-6">
      <div className="flex items-center gap-5">
        {/* Logo */}
        <div className="flex-shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={orgName}
              className="w-14 h-14 rounded-xl object-cover border border-white/20"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-white/70" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">{orgName}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-white/60">
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              {domain}
            </span>
            <span className="text-white/30">-</span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {memberCount} Mitglieder
            </span>
            <span className="text-white/30">-</span>
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {teamCount} Teams
            </span>
          </div>
        </div>

        {/* Plan Badge */}
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-400/20 text-amber-300 border border-amber-400/30">
            {planLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
