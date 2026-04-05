"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  BookOpen,
  Trophy,
  Users,
  Building2,
  Settings,
  X,
} from "lucide-react";
import type { User } from "@/types";

interface SidebarProps {
  user: User;
  orgLogo?: string | null;
  onNavClick?: () => void;
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="px-3 pt-5 pb-1 text-[11px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted">
      {children}
    </h3>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
  variant = "primary",
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  variant?: "primary" | "secondary";
  onClick?: () => void;
}) {
  const isPrimary = variant === "primary";
  return (
    <Link
      href={href}
      className={`sidebar-item ${active ? "active" : ""} ${!isPrimary ? "text-muted" : ""}`}
      onClick={onClick}
      style={{ fontSize: isPrimary ? 13 : 12 }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function SidebarContent({ user, orgLogo, onNavClick }: SidebarProps) {
  const pathname = usePathname();

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const isManager = ["admin", "super_admin", "hr", "manager"].includes(
    user.role,
  );

  return (
    <aside
      className="sidebar-container w-52 flex flex-col"
      aria-label="Seitenleiste"
    >
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
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-foreground">
              ADMKRS
            </span>
            <p className="text-[11px] sm:text-[10px] text-muted">Personal Development OS</p>
          </div>
          {/* Close button - only visible on mobile overlay */}
          {onNavClick && (
            <button
              onClick={onNavClick}
              className="lg:hidden p-2.5 rounded-lg hover:bg-black/[0.04] transition-colors"
              aria-label="Menu schließen"
            >
              <X className="h-4 w-4 text-muted" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-1"
        aria-label="Hauptnavigation"
      >
        {/* HAUPTMENU */}
        <SectionLabel>Hauptmenu</SectionLabel>
        <div className="space-y-0.5">
          <NavItem
            href="/dashboard"
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Mein Quartal"
            active={isActive("/dashboard")}
            variant="primary"
            onClick={onNavClick}
          />
          <NavItem
            href="/okrs"
            icon={<Target className="h-4 w-4" />}
            label="Ziele"
            active={isActive("/okrs")}
            variant="primary"
            onClick={onNavClick}
          />
          <NavItem
            href="/learnings"
            icon={<BookOpen className="h-4 w-4" />}
            label="Lernen"
            active={isActive("/learnings")}
            variant="primary"
            onClick={onNavClick}
          />
        </div>

        {/* EINBLICKE */}
        <SectionLabel>Einblicke</SectionLabel>
        <div className="space-y-0.5">
          <NavItem
            href="/review"
            icon={<Trophy className="h-3.5 w-3.5" />}
            label="Rückblick"
            active={isActive("/review")}
            variant="secondary"
            onClick={onNavClick}
          />
        </div>

        {/* VERWALTUNG - only for manager/admin/hr/super_admin */}
        {isManager && (
          <>
            <SectionLabel>Verwaltung</SectionLabel>
            <div className="space-y-0.5">
              <NavItem
                href="/team"
                icon={<Users className="h-3.5 w-3.5" />}
                label="Team & Orga"
                active={isActive("/team")}
                variant="secondary"
                onClick={onNavClick}
              />
            </div>
          </>
        )}
      </nav>

      {/* Bottom Profile Link */}
      <div className="p-3 border-t border-cream-300/50">
        <Link
          href="/settings"
          onClick={onNavClick}
          className={`group flex items-center gap-2.5 p-2 rounded-lg transition-colors ${
            pathname.startsWith("/settings")
              ? "bg-black/[0.06]"
              : "hover:bg-black/[0.04]"
          }`}
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
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[13px] text-foreground truncate">
              {user.name}
            </p>
            <p className="text-[10px] text-muted truncate">
              Profil & Settings
            </p>
          </div>
          <Settings className="h-3.5 w-3.5 text-muted flex-shrink-0 transition-transform duration-300 group-hover:rotate-90" />
        </Link>
      </div>
    </aside>
  );
}
