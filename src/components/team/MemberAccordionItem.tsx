"use client";

import { ChevronDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { MemberDetailPanel } from "./MemberDetailPanel";
import type { TeamMemberOKRStats } from "@/types";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  avatar_url: string | null;
  status: string;
  position: string | null;
  craft_focus: string | null;
  career_level_id: string | null;
  created_at: string;
}

interface MemberAccordionItemProps {
  member: TeamMember;
  isExpanded: boolean;
  onToggle: () => void;
  okrStats?: TeamMemberOKRStats;
  canEdit: boolean;
}

const roleBadgeClass: Record<string, string> = {
  super_admin: "badge-red",
  admin: "badge-yellow",
  manager: "badge-blue",
  hr: "badge-green",
  employee: "badge-gray",
};

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  hr: "HR",
  employee: "Mitarbeiter",
};

export function MemberAccordionItem({
  member,
  isExpanded,
  onToggle,
  okrStats,
  canEdit,
}: MemberAccordionItemProps) {
  const initials = member.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className={`card overflow-hidden transition-shadow ${isExpanded ? "ring-1 ring-foreground/10 shadow-md" : ""}`}>
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center gap-3 hover:bg-cream-50 transition-colors"
      >
        {/* Avatar */}
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center flex-shrink-0">
            <span className="text-[12px] font-medium text-foreground">{initials}</span>
          </div>
        )}

        {/* Name + Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-medium text-foreground truncate">
              {member.name}
            </p>
            {member.position && (
              <span className="text-[11px] text-muted hidden sm:inline truncate max-w-[120px] sm:max-w-[200px]">
                {member.position}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[12px] text-muted truncate">
              {member.department || member.email}
            </span>
            {okrStats && okrStats.count > 0 && (
              <>
                <span className="text-cream-300">·</span>
                <span className="text-[11px] text-muted">
                  {okrStats.count} OKR{okrStats.count !== 1 ? "s" : ""}
                </span>
                <div className="w-16 hidden sm:block">
                  <ProgressBar value={okrStats.avgProgress} size="sm" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Role badge */}
        <span className={`badge text-[11px] flex-shrink-0 ${roleBadgeClass[member.role] || "badge-gray"}`}>
          {roleLabel[member.role] || member.role}
        </span>

        {/* Detail page link */}
        <Link
          href={`/team/${member.id}`}
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg hover:bg-cream-200 transition-colors flex-shrink-0"
          title="Detailseite öffnen"
        >
          <ArrowUpRight className="h-4 w-4 text-muted hover:text-foreground" />
        </Link>

        {/* Chevron */}
        <ChevronDown
          className={`h-4 w-4 text-muted flex-shrink-0 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded detail panel */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-cream-300/50">
          <MemberDetailPanel memberId={member.id} canEdit={canEdit} />
        </div>
      )}
    </div>
  );
}
