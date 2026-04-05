"use client";

import { Menu, Building2 } from "lucide-react";
import type { User } from "@/types";

interface MobileHeaderProps {
  user: User;
  orgLogo?: string | null;
  onMenuClick: () => void;
}

export function MobileHeader({ user, orgLogo, onMenuClick }: MobileHeaderProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex lg:hidden items-center gap-3 px-4 py-3 border-b border-cream-300/50 bg-white flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 rounded-lg hover:bg-cream-100 transition-colors"
        aria-label="Menu öffnen"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {orgLogo ? (
          <img
            src={orgLogo}
            alt="ADMKRS"
            className="w-6 h-6 rounded-md object-cover"
          />
        ) : (
          <div className="w-6 h-6 bg-cream-200 rounded-md flex items-center justify-center border border-cream-300">
            <Building2 className="h-3 w-3 text-muted" />
          </div>
        )}
        <span className="text-sm font-semibold text-foreground">ADMKRS</span>
      </div>

      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.name}
          className="w-7 h-7 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-cream-300 flex items-center justify-center">
          <span className="text-[10px] font-medium text-foreground">{initials}</span>
        </div>
      )}
    </header>
  );
}
