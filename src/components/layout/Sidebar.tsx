"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Target,
  BookOpen,
  TrendingUp,
  Users,
  Building2,
  Settings,
  ChevronDown,
  LogOut,
} from "lucide-react";
import type { User } from "@/types";

interface SidebarProps {
  user: User;
  orgLogo?: string | null;
}

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense
      fallback={
        <aside className="sidebar-container w-52">
          <div className="px-4 py-5">
            <div className="animate-pulse h-8 bg-cream-200 rounded" />
          </div>
        </aside>
      }
    >
      <SidebarContent {...props} />
    </Suspense>
  );
}

const navItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "Startseite" },
  { href: "/okrs", icon: Target, label: "OKRs" },
  { href: "/learnings", icon: BookOpen, label: "Learnings" },
  { href: "/career", icon: TrendingUp, label: "Karriere" },
];

const managementItems = [
  { href: "/team", icon: Users, label: "Team" },
  { href: "/organization", icon: Building2, label: "Organisation" },
];

function SidebarContent({ user, orgLogo }: SidebarProps) {
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleDisplay =
    user.role === "super_admin"
      ? "Super Admin"
      : user.role === "admin"
        ? "Administrator"
        : user.role === "manager"
          ? "Manager"
          : user.role === "hr"
            ? "HR"
            : "Mitarbeiter";

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

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
            <span className="text-sm font-semibold text-foreground">
              ADMKRS
            </span>
            <p className="text-[10px] text-muted">Personal Development OS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-1"
        aria-label="Hauptnavigation"
      >
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={<item.icon className="h-4 w-4" />}
              label={item.label}
              active={isActive(item.href)}
            />
          ))}
        </div>

        {/* Management Section - only for admin/manager/hr/super_admin */}
        {["admin", "super_admin", "hr", "manager"].includes(user.role) && (
          <div>
            <h3 className="section-header">Management</h3>
            <div className="space-y-0.5">
              {managementItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={<item.icon className="h-4 w-4" />}
                  label={item.label}
                  active={isActive(item.href)}
                />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer mit Settings */}
      <div className="px-3 py-2 border-t border-cream-300/50">
        <NavItem
          href="/settings"
          icon={<Settings className="h-4 w-4" />}
          label="Einstellungen"
          active={pathname === "/settings"}
        />
      </div>

      {/* User Profile with Dropdown */}
      <div className="p-3 border-t border-cream-300/50 relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/[0.04] cursor-pointer transition-colors"
          aria-label="Profil-Menu"
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
              <span className="text-[11px] font-medium text-foreground">
                {initials}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="font-medium text-[13px] text-foreground truncate">
              {user.name}
            </p>
            <p className="text-[10px] text-muted truncate">{roleDisplay}</p>
          </div>
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted flex-shrink-0 transition-transform ${showProfileMenu ? "rotate-180" : ""}`}
          />
        </button>

        {showProfileMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowProfileMenu(false)}
              aria-hidden="true"
            />
            <div
              className="absolute bottom-full left-3 right-3 mb-1 bg-white rounded-xl shadow-lg border border-cream-300 py-1 z-50"
              role="menu"
              aria-label="Profil-Menu"
            >
              <Link
                href="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="dropdown-item text-[13px]"
                role="menuitem"
              >
                <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                Einstellungen
              </Link>
              <div
                className="border-t border-cream-300/50 my-0.5"
                role="separator"
              />
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className="dropdown-item-danger w-full text-[13px]"
                  role="menuitem"
                >
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
