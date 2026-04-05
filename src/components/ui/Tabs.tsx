"use client";

import { useId } from "react";

export interface TabItem<T extends string = string> {
  key: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  /** "underline" = border-bottom style, "pill" = filled background style */
  variant?: "underline" | "pill";
  ariaLabel: string;
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  variant = "underline",
  ariaLabel,
}: TabsProps<T>) {
  const idPrefix = useId();

  if (variant === "pill") {
    return (
      <div
        className="flex items-center gap-1 overflow-x-auto"
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${idPrefix}-panel-${tab.key}`}
              id={`${idPrefix}-tab-${tab.key}`}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-foreground text-white"
                  : "text-muted hover:bg-cream-200"
              }`}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 text-[11px] opacity-70">
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1 border-b border-cream-200"
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${idPrefix}-panel-${tab.key}`}
            id={`${idPrefix}-tab-${tab.key}`}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border-b-2 transition-colors ${
              isActive
                ? "border-accent-green text-accent-green"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-[11px] opacity-70">
                ({tab.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  labelledBy,
  children,
  active = true,
}: {
  id: string;
  labelledBy: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  if (!active) return null;
  return (
    <div role="tabpanel" id={id} aria-labelledby={labelledBy}>
      {children}
    </div>
  );
}
