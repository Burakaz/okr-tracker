"use client";

import { useState } from "react";
import { ChevronDown, Mail } from "lucide-react";
import type { User, UserRole } from "@/types";

interface OrgMembersTabProps {
  members: User[];
}

const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  hr: "HR",
  manager: "Manager",
  employee: "Mitarbeiter",
};

const roleOptions: UserRole[] = ["admin", "hr", "manager", "employee"];

function MemberRoleDropdown({
  currentRole,
  memberId,
}: {
  currentRole: UserRole;
  memberId: string;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(currentRole);

  const handleSelect = (newRole: UserRole) => {
    setRole(newRole);
    setOpen(false);
    // Future: call API to update role
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost text-xs flex items-center gap-1 px-2 py-1"
        type="button"
        aria-label={`Rolle aendern fuer Mitglied ${memberId}`}
      >
        <span className="badge badge-gray">{roleLabels[role]}</span>
        <ChevronDown className="h-3 w-3 text-muted" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="dropdown-menu z-50 w-40">
            {roleOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`dropdown-item w-full text-left text-xs ${
                  opt === role ? "font-semibold" : ""
                }`}
                type="button"
              >
                {roleLabels[opt]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function OrgMembersTab({ members }: OrgMembersTabProps) {
  return (
    <div className="space-y-8">
      {/* Members Section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Mitglieder ({members.length})
        </h3>
        <p className="text-xs text-muted mb-4">
          Verwalte Rollen und Manager-Zuweisungen
        </p>

        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Beigetreten</th>
                <th>Rolle</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.name}
                          className="w-7 h-7 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-cream-200 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-foreground">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </span>
                        </div>
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {member.name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-muted">
                      {formatDate(member.created_at)}
                    </span>
                  </td>
                  <td>
                    <MemberRoleDropdown
                      currentRole={member.role}
                      memberId={member.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Ausstehende Einladungen
        </h3>
        <div className="card p-6">
          <p className="text-xs text-muted text-center">
            Keine ausstehenden Einladungen.
          </p>
        </div>
      </div>
    </div>
  );
}
