"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import type { User } from "@/types";

interface AppShellProps {
  user: User;
  orgLogo: string | null;
  children: ReactNode;
}

export function AppShell({ user, orgLogo, children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={user} orgLogo={orgLogo} />
      <main id="main-content" className="flex-1 overflow-hidden" role="main">
        {children}
      </main>
    </div>
  );
}
