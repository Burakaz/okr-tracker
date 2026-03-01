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
    <header className="flex lg:hidden items-center gap-3 px-4 py-2.5 border-b border-[var(--v2-border)] bg-[var(--v2-bg-raised)] flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="p-1.5 -ml-1 rounded-[var(--v2-radius-md)] hover:bg-[var(--v2-bg-hover)] transition-colors"
        aria-label="Menü öffnen"
      >
        <Menu className="h-4.5 w-4.5 text-[var(--v2-text)]" />
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {orgLogo ? (
          <img src={orgLogo} alt="Logo" className="w-5 h-5 rounded object-cover" />
        ) : (
          <div className="w-5 h-5 rounded bg-[var(--v2-bg-active)] flex items-center justify-center">
            <Building2 className="h-3 w-3 text-[var(--v2-text-3)]" />
          </div>
        )}
        <span className="text-[13px] font-semibold text-[var(--v2-text)]">
          ADMKRS
        </span>
      </div>

      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.name}
          className="w-6 h-6 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-6 h-6 rounded-full bg-[var(--v2-bg-active)] flex items-center justify-center">
          <span className="text-[9px] font-medium text-[var(--v2-text)]">
            {initials}
          </span>
        </div>
      )}
    </header>
  );
}
