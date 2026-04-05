"use client";

import { type ReactNode, useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import type { User } from "@/types";

interface AppShellProps {
  user: User;
  orgLogo: string | null;
  children: ReactNode;
}

export function AppShell({ user, orgLogo, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar - always visible on lg+ */}
      <div className="hidden lg:block">
        <Sidebar user={user} orgLogo={orgLogo} />
      </div>

      {/* Mobile/Tablet sidebar - overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden animate-slide-in-left">
            <Sidebar user={user} orgLogo={orgLogo} onNavClick={closeSidebar} />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header with hamburger - only visible below lg */}
        <MobileHeader
          user={user}
          orgLogo={orgLogo}
          onMenuClick={toggleSidebar}
        />

        <main id="main-content" className="flex-1 overflow-hidden pb-[env(safe-area-inset-bottom)]" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
