"use client";

import { useState, useEffect } from "react";
import { Building2, Copy, Check, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useOrganization, useUpdateOrganization } from "@/lib/queries";

export function OrgGeneralTab() {
  const { data, isLoading } = useOrganization();
  const updateOrg = useUpdateOrganization();

  const org = data?.organization;
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (org) {
      setName(org.name || "");
      setDomain(org.domain || "");
    }
  }, [org]);

  const handleSave = async () => {
    try {
      await updateOrg.mutateAsync({ name: name.trim(), domain: domain.trim() });
      toast.success("Organisation aktualisiert");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern");
    }
  };

  const handleCopy = async () => {
    const inviteLink = `${window.location.origin}/auth/invite?org=${org?.slug || ""}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopieren fehlgeschlagen");
    }
  };

  const hasChanges = org && (name !== org.name || domain !== (org.domain || ""));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Org Name */}
      <div>
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
          Organisationsname
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="z.B. ADMKRS GmbH"
        />
      </div>

      {/* Domain */}
      <div>
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
          Domain
        </label>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="input"
          placeholder="z.B. admkrs.com"
        />
      </div>

      {/* Logo */}
      <div>
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
          Logo
        </label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-cream-200 rounded-xl flex items-center justify-center border border-cream-300">
            {org?.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <Building2 className="h-8 w-8 text-muted" />
            )}
          </div>
          <p className="text-[12px] text-muted">
            Logo-Upload wird in Kürze verfügbar sein.
          </p>
        </div>
      </div>

      {/* Invite Link */}
      <div>
        <label className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
          Einladungslink
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/auth/invite?org=${org?.slug || ""}`}
            className="input flex-1 text-[12px] bg-cream-50"
          />
          <button onClick={handleCopy} className="btn-secondary text-[12px] gap-1.5 flex-shrink-0">
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Kopiert
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Kopieren
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={!hasChanges || updateOrg.isPending}
          className="btn-primary text-[13px] gap-1.5"
        >
          {updateOrg.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Speichern
        </button>
      </div>
    </div>
  );
}
