"use client";

import { type ReactNode, useState, useCallback } from "react";
import { V2Sidebar } from "./V2Sidebar";
import { V2MobileHeader } from "./V2MobileHeader";
import type { User } from "@/types";

interface V2ShellProps {
  user: User;
  orgLogo: string | null;
  children: ReactNode;
}

export function V2Shell({ user, orgLogo, children }: V2ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <V2Sidebar user={user} orgLogo={orgLogo} />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden v2-slide-in-left">
            <V2Sidebar user={user} orgLogo={orgLogo} onNavClick={closeSidebar} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <V2MobileHeader user={user} orgLogo={orgLogo} onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
