"use client";

import { Loader2, Shield, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { useOrganizationMembers, useUpdateMemberRole, useCurrentUser } from "@/lib/queries";
import type { UserRole } from "@/types";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "employee", label: "Mitarbeiter" },
  { value: "manager", label: "Manager" },
  { value: "hr", label: "HR" },
  { value: "admin", label: "Admin" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function OrgMembersTab() {
  const { data: membersData, isLoading } = useOrganizationMembers();
  const { data: userData } = useCurrentUser();
  const updateRole = useUpdateMemberRole();

  const members = membersData?.members || [];
  const currentUser = userData?.user;
  const isAdmin = currentUser && ["admin", "super_admin"].includes(currentUser.role);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await updateRole.mutateAsync({ memberId, role: newRole });
      toast.success("Rolle aktualisiert");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Aktualisieren");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="empty-state">
        <Users className="empty-state-icon" />
        <p className="empty-state-title">Noch keine Mitglieder</p>
        <p className="empty-state-description">
          Lade Mitglieder über den Einladungslink in den Allgemein-Einstellungen ein.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center gap-1.5 text-[12px] text-muted">
          <UserCheck className="h-3.5 w-3.5" />
          {members.length} Mitglieder
        </span>
        <span className="flex items-center gap-1.5 text-[12px] text-muted">
          <Shield className="h-3.5 w-3.5" />
          {members.filter((m) => ["admin", "super_admin"].includes(m.role)).length} Admins
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cream-200">
              <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-wider py-2 px-3">Name</th>
              <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-wider py-2 px-3 hidden sm:table-cell">E-Mail</th>
              <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-wider py-2 px-3 hidden md:table-cell">Beitritt</th>
              <th className="text-left text-[11px] font-semibold text-muted uppercase tracking-wider py-2 px-3">Rolle</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const initials = member.name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "?";

              const isSelf = member.id === currentUser?.id;
              const isSuperAdmin = member.role === "super_admin";
              const canEditRole = isAdmin && !isSelf && !isSuperAdmin;

              return (
                <tr key={member.id} className="border-b border-cream-100 last:border-0">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.name} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-cream-200 flex items-center justify-center">
                          <span className="text-[11px] font-medium text-foreground">{initials}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-[13px] font-medium text-foreground">
                          {member.name}
                          {isSelf && <span className="text-[11px] text-muted ml-1">(Du)</span>}
                        </p>
                        <p className="text-[11px] text-muted sm:hidden">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 hidden sm:table-cell">
                    <span className="text-[12px] text-muted">{member.email}</span>
                  </td>
                  <td className="py-3 px-3 hidden md:table-cell">
                    <span className="text-[12px] text-muted">{formatDate(member.created_at)}</span>
                  </td>
                  <td className="py-3 px-3">
                    {canEditRole ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="input text-[12px] py-1 px-2 w-auto"
                        disabled={updateRole.isPending}
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`badge text-[11px] ${
                        member.role === "super_admin" ? "badge-red" :
                        member.role === "admin" ? "badge-yellow" :
                        member.role === "manager" ? "badge-blue" :
                        member.role === "hr" ? "badge-green" :
                        "badge-gray"
                      }`}>
                        {member.role === "super_admin" ? "Super Admin" :
                         member.role === "admin" ? "Admin" :
                         member.role === "manager" ? "Manager" :
                         member.role === "hr" ? "HR" : "Mitarbeiter"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
