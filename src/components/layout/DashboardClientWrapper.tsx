"use client";

import { useState, createContext, useContext, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import type { User, Organization, OKRFilterType } from "@/types";

interface DashboardContextType {
  activeFilter: OKRFilterType;
  setActiveFilter: (filter: OKRFilterType) => void;
  currentQuarter: string;
  setCurrentQuarter: (quarter: string) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboardFilter() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardFilter must be used within DashboardClientWrapper");
  }
  return context;
}

/** Get the current quarter string, e.g. "Q1 2026" */
function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

/** Get the previous quarter */
function getPrevQuarter(quarter: string): string {
  const match = quarter.match(/Q(\d) (\d{4})/);
  if (!match) return quarter;
  let q = parseInt(match[1]);
  let y = parseInt(match[2]);
  q -= 1;
  if (q < 1) {
    q = 4;
    y -= 1;
  }
  return `Q${q} ${y}`;
}

/** Get the next quarter */
function getNextQuarter(quarter: string): string {
  const match = quarter.match(/Q(\d) (\d{4})/);
  if (!match) return quarter;
  let q = parseInt(match[1]);
  let y = parseInt(match[2]);
  q += 1;
  if (q > 4) {
    q = 1;
    y += 1;
  }
  return `Q${q} ${y}`;
}

interface DashboardClientWrapperProps {
  user: User;
  orgLogo: string | null;
  children: ReactNode;
}

export function DashboardClientWrapper({
  user,
  orgLogo,
  children,
}: DashboardClientWrapperProps) {
  const [activeFilter, setActiveFilter] = useState<OKRFilterType>("all");
  const [currentQuarter, setCurrentQuarter] = useState<string>(getCurrentQuarter());

  return (
    <DashboardContext.Provider value={{
      activeFilter,
      setActiveFilter,
      currentQuarter,
      setCurrentQuarter,
    }}>
      <div className="flex h-screen bg-background">
        <Sidebar
          user={user}
          orgLogo={orgLogo}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          currentQuarter={currentQuarter}
          onQuarterChange={setCurrentQuarter}
        />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </DashboardContext.Provider>
  );
}

export { getCurrentQuarter, getPrevQuarter, getNextQuarter };
