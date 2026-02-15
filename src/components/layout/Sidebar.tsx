"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  TrendingUp,
  Wrench,
  BookOpen,
  Briefcase,
  Star,
  Archive,
  Building2,
  Trash2,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import type { User, OKRFilterType } from "@/types";
import { getPrevQuarter, getNextQuarter } from "./DashboardClientWrapper";

interface SidebarProps {
  user: User;
  orgLogo?: string | null;
  activeFilter?: OKRFilterType;
  onFilterChange?: (filter: OKRFilterType) => void;
  currentQuarter: string;
  onQuarterChange: (quarter: string) => void;
}

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={
      <aside className="sidebar-container w-52">
        <div className="px-4 py-5">
          <div className="animate-pulse h-8 bg-cream-200 rounded" />
        </div>
      </aside>
    }>
      <SidebarContent {...props} />
    </Suspense>
  );
}

// Filter-Button Komponente - kein Link, nur onClick
function FilterButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`sidebar-item w-full ${active ? "active" : ""}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SidebarContent({
  user,
  orgLogo,
  activeFilter = "all",
  onFilterChange,
  currentQuarter,
  onQuarterChange,
}: SidebarProps) {
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleFilterChange = (filter: OKRFilterType) => {
    if (onFilterChange) {
      onFilterChange(filter);
    }
  };

  const isAdmin = user.role === "admin" || user.role === "super_admin";

  // Get user initials
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Get role display name
  const roleDisplay = user.role === "super_admin"
    ? "Super Admin"
    : user.role === "admin"
      ? "Administrator"
      : user.role === "manager"
        ? "Manager"
        : user.role === "hr"
          ? "HR"
          : "Mitarbeiter";

  const prevQ = getPrevQuarter(currentQuarter);
  const nextQ = getNextQuarter(currentQuarter);

  return (
    <aside className="sidebar-container w-52" aria-label="Seitenleiste">
      {/* Logo / Org Header */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          {orgLogo ? (
            <img
              src={orgLogo}
              alt="ADMKRS"
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-cream-200 rounded-lg flex items-center justify-center border border-cream-300">
              <Building2 className="h-4 w-4 text-muted" />
            </div>
          )}
          <div>
            <span className="text-sm font-semibold text-foreground">ADMKRS</span>
            <p className="text-[10px] text-muted">OKR Tracker</p>
          </div>
        </div>
      </div>

      {/* Quarter Selector */}
      <div className="px-3 pb-3">
        <p className="text-[10px] text-muted uppercase tracking-wider mb-1.5 px-1">Quartal</p>
        <div className="flex gap-0.5 p-0.5 bg-cream-200 rounded-lg items-center">
          <button
            onClick={() => onQuarterChange(prevQ)}
            className="flex items-center justify-center px-1.5 py-1.5 rounded-md text-muted hover:text-foreground transition-all"
            title={prevQ}
            aria-label={`Vorheriges Quartal: ${prevQ}`}
          >
            <ChevronLeft className="h-3 w-3" aria-hidden="true" />
          </button>
          <div className="flex-1 flex items-center justify-center px-2 py-1.5 rounded-md text-[11px] font-medium bg-white text-foreground shadow-sm">
            {currentQuarter}
          </div>
          <button
            onClick={() => onQuarterChange(nextQ)}
            className="flex items-center justify-center px-1.5 py-1.5 rounded-md text-muted hover:text-foreground transition-all"
            title={nextQ}
            aria-label={`Nächstes Quartal: ${nextQ}`}
          >
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-1" aria-label="Hauptnavigation">
        <div className="space-y-0.5">
          <FilterButton
            icon={<LayoutGrid className="h-4 w-4" />}
            label="Übersicht"
            active={pathname === "/dashboard" && activeFilter === "all"}
            onClick={() => handleFilterChange("all")}
          />
          <FilterButton
            icon={<TrendingUp className="h-4 w-4" />}
            label="Performance"
            active={activeFilter === "performance"}
            onClick={() => handleFilterChange("performance")}
          />
          <FilterButton
            icon={<Wrench className="h-4 w-4" />}
            label="Skill"
            active={activeFilter === "skill"}
            onClick={() => handleFilterChange("skill")}
          />
          <FilterButton
            icon={<BookOpen className="h-4 w-4" />}
            label="Learning"
            active={activeFilter === "learning"}
            onClick={() => handleFilterChange("learning")}
          />
          <FilterButton
            icon={<Briefcase className="h-4 w-4" />}
            label="Karriere"
            active={activeFilter === "career"}
            onClick={() => handleFilterChange("career")}
          />
          <FilterButton
            icon={<Star className="h-4 w-4" />}
            label="Fokus"
            active={activeFilter === "focus"}
            onClick={() => handleFilterChange("focus")}
          />
          <FilterButton
            icon={<Archive className="h-4 w-4" />}
            label="Archiv"
            active={activeFilter === "archive"}
            onClick={() => handleFilterChange("archive")}
          />
        </div>

        {/* Admin-Bereich - nur für Admins */}
        {isAdmin && (
          <div>
            <h3 className="section-header">Admin</h3>
            <div className="space-y-0.5">
              <NavItem
                href="/admin/organisation"
                icon={<Building2 className="h-4 w-4" />}
                label="Organisation"
                active={pathname === "/admin/organisation"}
              />
              <NavItem
                href="/admin/trash"
                icon={<Trash2 className="h-4 w-4" />}
                label="Papierkorb"
                active={pathname === "/admin/trash"}
              />
            </div>
          </div>
        )}
      </nav>

      {/* Footer mit Settings */}
      <div className="px-3 py-2 border-t border-cream-300/50">
        <NavItem
          href="/dashboard/settings"
          icon={<Settings className="h-4 w-4" />}
          label="Einstellungen"
          active={pathname === "/dashboard/settings"}
        />
      </div>

      {/* User Profile with Dropdown */}
      <div className="p-3 border-t border-cream-300/50 relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/[0.04] cursor-pointer transition-colors"
          aria-label="Profil-Menü"
          aria-expanded={showProfileMenu}
          aria-haspopup="true"
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-cream-300 flex items-center justify-center">
              <span className="text-[11px] font-medium text-foreground">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="font-medium text-[13px] text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted truncate">{roleDisplay}</p>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-muted flex-shrink-0 transition-transform ${showProfileMenu ? "rotate-180" : ""}`} />
        </button>

        {showProfileMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowProfileMenu(false)}
              aria-hidden="true"
            />
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-white rounded-xl shadow-lg border border-cream-300 py-1 z-50" role="menu" aria-label="Profil-Menü">
              <Link
                href="/dashboard/settings"
                onClick={() => setShowProfileMenu(false)}
                className="dropdown-item text-[13px]"
                role="menuitem"
              >
                <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                Einstellungen
              </Link>
              <div className="border-t border-cream-300/50 my-0.5" role="separator" />
              <form action="/auth/signout" method="POST">
                <button type="submit" className="dropdown-item-danger w-full text-[13px]" role="menuitem">
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  Abmelden
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link href={href} className={`sidebar-item ${active ? "active" : ""}`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}
