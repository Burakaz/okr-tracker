"use client";

import { useState } from "react";
import {
  User as UserIcon,
  Mail,
  Shield,
  Building2,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  hr: "HR",
  manager: "Manager",
  employee: "Mitarbeiter",
};

export default function SettingsPage() {
  const { data: userData, isLoading: isLoadingUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const user = userData?.user;

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize form with user data once loaded
  if (user && !hasInitialized) {
    setName(user.name || "");
    setDepartment(user.department || "");
    setHasInitialized(true);
  }

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, department }),
      });

      if (res.ok) {
        toast.success("Profil aktualisiert");
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      } else {
        toast.error("Fehler beim Speichern");
      }
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = user && (name !== user.name || department !== (user.department || ""));

  if (isLoadingUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 flex items-center px-6 border-b border-cream-300/50">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="text-foreground font-medium">Einstellungen</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          {/* Profile Card */}
          <div className="card p-6 mb-6">
            <h1 className="text-lg font-semibold text-foreground mb-6">Profil</h1>

            {/* Avatar + Info */}
            <div className="flex items-center gap-4 mb-8 p-4 bg-cream-50 rounded-xl">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-16 h-16 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-cream-300 flex items-center justify-center">
                  <span className="text-lg font-medium text-foreground">
                    {user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </span>
                </div>
              )}
              <div>
                <p className="font-semibold text-foreground">{user.name}</p>
                <p className="text-sm text-muted">{user.email}</p>
                <span className="badge badge-blue text-[11px] mt-1 inline-block">
                  {roleLabels[user.role] || user.role}
                </span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-muted" />
                    Name
                  </div>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input w-full"
                  placeholder="Dein Name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted" />
                    E-Mail
                  </div>
                </label>
                <input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="input w-full opacity-60 cursor-not-allowed"
                />
                <p className="text-[11px] text-muted mt-1">
                  E-Mail wird durch Google OAuth verwaltet
                </p>
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-foreground mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted" />
                    Abteilung
                  </div>
                </label>
                <input
                  id="department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="input w-full"
                  placeholder="z.B. Performance Marketing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-muted" />
                    Rolle
                  </div>
                </label>
                <input
                  type="text"
                  value={roleLabels[user.role] || user.role}
                  disabled
                  className="input w-full opacity-60 cursor-not-allowed"
                />
                <p className="text-[11px] text-muted mt-1">
                  Rollen werden von Administratoren verwaltet
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="btn-primary text-[13px] gap-1.5"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Speichern
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Account</h2>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted">Account-Status</span>
                <span className="badge badge-green text-[11px]">Aktiv</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Anmeldung via</span>
                <span className="text-foreground">Google OAuth</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Erstellt am</span>
                <span className="text-foreground">
                  {new Date(user.created_at).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
