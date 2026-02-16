"use client";

import { useState } from "react";
import { Building2, Copy, Check, Link as LinkIcon } from "lucide-react";

interface OrgGeneralTabProps {
  orgName: string;
  domain: string;
  logoUrl: string | null;
  inviteLink: string;
}

export function OrgGeneralTab({
  orgName,
  domain,
  logoUrl,
  inviteLink,
}: OrgGeneralTabProps) {
  const [name, setName] = useState(orgName);
  const [domainValue, setDomainValue] = useState(domain);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div className="space-y-6">
      {/* Organisation Details */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Organisation Details
        </h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="org-name"
              className="block text-xs font-medium text-muted mb-1.5"
            >
              Name
            </label>
            <input
              id="org-name"
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Organisationsname"
            />
          </div>
          <div>
            <label
              htmlFor="org-domain"
              className="block text-xs font-medium text-muted mb-1.5"
            >
              Domain
            </label>
            <input
              id="org-domain"
              type="text"
              className="input"
              value={domainValue}
              onChange={(e) => setDomainValue(e.target.value)}
              placeholder="beispiel.com"
            />
          </div>
          <div className="pt-2">
            <button className="btn-primary" type="button">
              Speichern
            </button>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Logo</h3>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Organisation Logo"
              className="w-16 h-16 rounded-xl object-cover border border-cream-300"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-cream-100 border border-cream-300 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-cream-400" />
            </div>
          )}
          <div>
            <p className="text-xs text-muted">
              Empfohlen: 256x256px, PNG oder JPG. Max. 2 MB.
            </p>
            <button className="btn-secondary mt-2" type="button">
              Logo hochladen
            </button>
          </div>
        </div>
      </div>

      {/* Einladungslink */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Einladungslink
        </h3>
        <p className="text-xs text-muted mb-4">
          Teile diesen Link, um neue Mitglieder einzuladen.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-cream-100 border border-cream-300 rounded-lg">
            <LinkIcon className="h-3.5 w-3.5 text-muted flex-shrink-0" />
            <span className="text-xs text-foreground truncate">
              {inviteLink}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="btn-secondary flex-shrink-0"
            type="button"
            aria-label="Link kopieren"
          >
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
    </div>
  );
}
