"use client";

import { Menu, Building2 } from "lucide-react";
import type { User } from "@/types";

interface V2MobileHeaderProps {
  user: User;
  orgLogo?: string | null;
  onMenuClick: () => void;
}

export function V2MobileHeader({ user, orgLogo, onMenuClick }: V2MobileHeaderProps) {
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <header className="flex lg:hidden items-center gap-3 px-4 py-3 border-b border-[var(--v2-border)] bg-white flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="p-1.5 -ml-1 rounded-lg hover:bg-[var(--v2-bg-hover)] transition-colors"
        aria-label="Menü öffnen"
      >
        <Menu className="h-5 w-5 text-[var(--v2-text)]" />
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {orgLogo ? (
          <img src={orgLogo} alt="Logo" className="w-6 h-6 rounded-lg object-cover" />
        ) : (
          <div className="w-6 h-6 rounded-lg bg-[var(--v2-accent)] flex items-center justify-center">
            <Building2 className="h-3 w-3 text-white" />
          </div>
        )}
        <span className="text-[14px] font-semibold text-[var(--v2-text)]">ADMKRS</span>
      </div>

      {user.avatar_url ? (
        <img src={user.avatar_url} alt={user.name} className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-[var(--v2-accent-muted)] flex items-center justify-center">
          <span className="text-[10px] font-semibold text-[var(--v2-accent)]">{initials}</span>
        </div>
      )}
    </header>
  );
}
