"use client";

import { useState } from "react";
import { Search, Plus, Bell, ChevronDown, LogOut, User as UserIcon, ClipboardCheck, Calendar } from "lucide-react";
import type { User } from "@/types";

interface HeaderProps {
  user: User;
  currentQuarter: string;
  onSearch: (query: string) => void;
  onNewItem: () => void;
  onCheckin?: () => void;
}

export function Header({ user, currentQuarter, onSearch, onNewItem, onCheckin }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-cream-300/50">
      {/* Linke Seite: Quarter badge + Suche */}
      <div className="flex items-center gap-4 flex-1">
        {/* Quarter Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-accent-greenLight text-accent-green">
          <Calendar className="h-3.5 w-3.5" />
          <span>{currentQuarter}</span>
        </div>

        {/* Suche */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="OKRs durchsuchen..."
              className="w-full py-2 pl-10 pr-4 bg-cream-100/50 border border-cream-300/50 rounded-lg text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:border-cream-400"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Rechte Seite */}
      <div className="flex items-center gap-2">
        {/* Check-in Button */}
        {onCheckin && (
          <button onClick={onCheckin} className="btn-success text-[13px] gap-1.5 py-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Check-in</span>
          </button>
        )}

        {/* Neues OKR Button */}
        <button onClick={onNewItem} className="btn-primary text-[13px] gap-1.5 py-1.5">
          <Plus className="h-3.5 w-3.5" />
          <span>Neues OKR</span>
        </button>

        {/* Benachrichtigungen */}
        <button
          className="p-2 hover:bg-cream-200/50 rounded-lg transition-colors"
          aria-label="Benachrichtigungen"
        >
          <Bell className="h-4 w-4 text-muted" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-cream-200/50 transition-colors"
            aria-label="Benutzermenue"
            aria-expanded={showUserMenu}
            aria-haspopup="true"
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-cream-300 flex items-center justify-center">
                <span className="text-xs font-medium text-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted" />
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
                onKeyDown={(e) => e.key === "Escape" && setShowUserMenu(false)}
              />
              <div className="dropdown-menu" role="menu" aria-label="Benutzermenue">
                <div className="px-3 py-2.5 border-b border-cream-300/50">
                  <p className="text-[13px] font-medium text-foreground">{user.name}</p>
                  <p className="text-[11px] text-muted">{user.email}</p>
                </div>
                <a href="/dashboard/settings" className="dropdown-item text-[13px]">
                  <UserIcon className="h-3.5 w-3.5" />
                  Profil
                </a>
                <form action="/auth/signout" method="POST">
                  <button type="submit" className="dropdown-item-danger w-full text-[13px]">
                    <LogOut className="h-3.5 w-3.5" />
                    Abmelden
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
