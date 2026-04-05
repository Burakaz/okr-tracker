"use client";

import { ArrowLeft, Mail, Calendar } from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/types";
import { getCareerPath } from "@/lib/career-paths";

interface MemberDetailHeaderProps {
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  position: string | null;
  department: string | null;
  craftFocus: string | null;
  careerLevelName: string | null;
  createdAt: string;
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

export function MemberDetailHeader({
  name,
  email,
  avatarUrl,
  role,
  position,
  department,
  craftFocus,
  careerLevelName,
  createdAt,
}: MemberDetailHeaderProps) {
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const memberSince = new Date(createdAt).toLocaleDateString("de-DE", {
    month: "short",
    year: "numeric",
  });

  const careerPathName = craftFocus ? getCareerPath(craftFocus)?.name : null;

  // Build subtitle parts
  const subtitleParts: string[] = [];
  if (position) subtitleParts.push(position);
  if (department) subtitleParts.push(department);
  if (careerPathName && careerLevelName) {
    subtitleParts.push(`${careerLevelName}`);
  } else if (careerLevelName) {
    subtitleParts.push(careerLevelName);
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/team"
        className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Zurück zum Team
      </Link>

      {/* Header card */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          {/* Large Avatar */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-cream-200 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-semibold text-foreground">{initials}</span>
            </div>
          )}

          {/* Name + Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold text-foreground truncate">
                {name}
              </h1>
              <span className={`badge text-[11px] flex-shrink-0 ${roleBadgeClass[role] || "badge-gray"}`}>
                {roleLabel[role] || role}
              </span>
            </div>

            {subtitleParts.length > 0 && (
              <p className="text-[13px] text-muted mb-1.5">
                {subtitleParts.join(" · ")}
              </p>
            )}

            <div className="flex items-center gap-3 text-[12px] text-muted">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Mitglied seit {memberSince}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
