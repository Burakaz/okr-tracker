"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Target,
  BookOpen,
  Trophy,
  Users,
  ChevronDown,
  LogOut,
  Settings,
  X,
  Building2,
} from "lucide-react";
import type { User, UserRole } from "@/types";

const MANAGER_ROLES: UserRole[] = ["manager", "hr", "admin", "super_admin"];

const NAV_ITEMS = [
  { href: "/v2/dashboard", label: "Mein Quartal", icon: LayoutDashboard },
  { href: "/v2/okrs", label: "Ziele", icon: Target },
  { href: "/v2/learnings", label: "Lernen", icon: BookOpen },
  { href: "/v2/review", label: "Rückblick", icon: Trophy },
];

const MANAGEMENT_ITEMS = [
  { href: "/v2/team", label: "Team & Orga", icon: Users },
];

interface V2SidebarProps {
  user: User;
  orgLogo?: string | null;
  onNavClick?: () => void;
}

export function V2Sidebar({ user, orgLogo, onNavClick }: V2SidebarProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const isManager = MANAGER_ROLES.includes(user.role);

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const toggleProfile = useCallback(() => {
    setProfileOpen((v) => !v);
  }, []);

  const handleSignOut = useCallback(async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/auth/login";
  }, []);

  return (
    <aside className="w-[220px] h-full flex flex-col bg-[var(--v2-bg-sidebar)] border-r border-[var(--v2-border)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5 min-w-0">
          {orgLogo ? (
            <img src={orgLogo} alt="Logo" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-[var(--v2-accent)] flex items-center justify-center flex-shrink-0">
              <Building2 className="h-3.5 w-3.5 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[var(--v2-text)] truncate leading-tight">ADMKRS</p>
            <p className="text-[11px] text-[var(--v2-text-3)] truncate leading-tight">Personal Dev OS</p>
          </div>
        </div>
        {onNavClick && (
          <button onClick={onNavClick} className="lg:hidden p-1 rounded-lg hover:bg-[var(--v2-bg-hover)] transition-colors" aria-label="Menü schließen">
            <X className="h-4 w-4 text-[var(--v2-text-2)]" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-1">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={onNavClick} className={`v2-nav-item ${isActive ? "active" : ""}`}>
                {isActive && (
                  <motion.div
                    layoutId="v2-sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[var(--v2-accent)]"
                    transition={{ type: "spring" as const, stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className="h-[16px] w-[16px] flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {isManager && (
          <div className="mt-6">
            <p className="v2-section-label px-3 mb-1.5">Management</p>
            <div className="space-y-0.5">
              {MANAGEMENT_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={onNavClick} className={`v2-nav-item ${isActive ? "active" : ""}`}>
                    {isActive && (
                      <motion.div
                        layoutId="v2-sidebar-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[var(--v2-accent)]"
                        transition={{ type: "spring" as const, stiffness: 350, damping: 30 }}
                      />
                    )}
                    <Icon className="h-[16px] w-[16px] flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Profile */}
      <div className="relative border-t border-[var(--v2-border)] p-3">
        <button onClick={toggleProfile} className="w-full flex items-center gap-2.5 px-2 py-2 rounded-[var(--v2-radius-md)] hover:bg-[var(--v2-bg-hover)] transition-colors">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--v2-accent-muted)] flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-semibold text-[var(--v2-accent)]">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[13px] font-medium text-[var(--v2-text)] truncate leading-tight">{user.name}</p>
            <p className="text-[11px] text-[var(--v2-text-3)] truncate leading-tight">
              {user.role === "super_admin" ? "Super Admin" : user.role === "admin" ? "Admin" : user.role === "manager" ? "Manager" : user.role === "hr" ? "HR" : "Mitarbeiter"}
            </p>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-[var(--v2-text-3)] flex-shrink-0 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] as const }}
              className="absolute bottom-full left-3 right-3 mb-1.5 bg-white border border-[var(--v2-border)] rounded-[var(--v2-radius-lg)] shadow-[var(--v2-shadow-lg)] overflow-hidden z-50"
            >
              <div className="px-3 py-2.5 border-b border-[var(--v2-border)]">
                <p className="text-[12px] text-[var(--v2-text-2)] truncate">{user.email}</p>
              </div>
              <div className="p-1">
                <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-2.5 py-2 text-[13px] text-[var(--v2-text-2)] rounded-[var(--v2-radius-sm)] hover:bg-[var(--v2-bg-hover)] hover:text-[var(--v2-text)] transition-colors">
                  <Settings className="h-3.5 w-3.5" />
                  Einstellungen
                </Link>
                <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-2.5 py-2 text-[13px] text-red-500 rounded-[var(--v2-radius-sm)] hover:bg-red-50 transition-colors">
                  <LogOut className="h-3.5 w-3.5" />
                  Abmelden
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
