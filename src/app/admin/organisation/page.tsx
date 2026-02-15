"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Shield,
  Mail,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useCurrentUser } from "@/lib/queries";

interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar_url: string | null;
  department: string | null;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  hr: "HR",
  manager: "Manager",
  employee: "Mitarbeiter",
};

const statusLabels: Record<string, { label: string; className: string }> = {
  active: { label: "Aktiv", className: "badge-green" },
  inactive: { label: "Inaktiv", className: "badge-gray" },
  suspended: { label: "Gesperrt", className: "badge-red" },
};

export default function OrganisationPage() {
  const { data: userData } = useCurrentUser();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        // For now we show the current user as the only member
        // In a full implementation, this would fetch all org members
        if (data.user) {
          setMembers([{
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            status: data.user.status,
            avatar_url: data.user.avatar_url,
            department: data.user.department,
          }]);
        }
      } catch {
        // Ignore errors
      } finally {
        setIsLoading(false);
      }
    }
    loadMembers();
  }, []);

  const user = userData?.user;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 flex items-center px-6 border-b border-cream-300/50">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>Admin</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Organisation</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl">
          {/* Org Info Card */}
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-cream-200 rounded-xl flex items-center justify-center border border-cream-300">
                <Building2 className="h-7 w-7 text-muted" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">ADMKRS</h1>
                <p className="text-sm text-muted">Digital Marketing Agentur</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-cream-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted" />
                  <span className="text-xs text-muted uppercase tracking-wider">Mitglieder</span>
                </div>
                <p className="text-2xl font-semibold text-foreground">{members.length}</p>
              </div>
              <div className="p-4 bg-cream-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-muted" />
                  <span className="text-xs text-muted uppercase tracking-wider">Admins</span>
                </div>
                <p className="text-2xl font-semibold text-foreground">
                  {members.filter(m => m.role === "admin" || m.role === "super_admin").length}
                </p>
              </div>
              <div className="p-4 bg-cream-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4 text-muted" />
                  <span className="text-xs text-muted uppercase tracking-wider">Domain</span>
                </div>
                <p className="text-sm font-medium text-foreground mt-1">admkrs.com</p>
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-cream-300/50">
              <h2 className="text-sm font-semibold text-foreground">Teammitglieder</h2>
            </div>

            {isLoading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted" />
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Rolle</th>
                    <th scope="col">Abteilung</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-8 h-8 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-cream-300 flex items-center justify-center">
                              <span className="text-[11px] font-medium text-foreground">
                                {member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-foreground text-[13px]">{member.name}</p>
                            <p className="text-[11px] text-muted">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-blue text-[11px]">
                          {roleLabels[member.role] || member.role}
                        </span>
                      </td>
                      <td>
                        <span className="text-[13px] text-muted">
                          {member.department || "—"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${statusLabels[member.status]?.className || "badge-gray"} text-[11px]`}>
                          {statusLabels[member.status]?.label || member.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
