"use client";

import { CreditCard, AlertTriangle, Receipt } from "lucide-react";

interface OrgBillingTabProps {
  planName: string;
  seats: number;
  pricePerSeat: string;
  isTrial: boolean;
}

export function OrgBillingTab({
  planName,
  seats,
  pricePerSeat,
  isTrial,
}: OrgBillingTabProps) {
  return (
    <div className="space-y-6">
      {/* Aktueller Plan */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Aktueller Plan
        </h3>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
              Status
            </p>
            <span className="badge badge-green">{planName}</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
              Seats
            </p>
            <p className="text-sm font-semibold text-foreground">{seats}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
              Preis / Seat
            </p>
            <p className="text-sm font-semibold text-foreground">
              {pricePerSeat}
            </p>
          </div>
        </div>

        {isTrial && (
          <div className="mt-5 flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Du befindest dich aktuell im Trial-Modus. Upgrade auf Pro, um alle
              Funktionen freizuschalten und mehr Mitglieder hinzuzufuegen.
            </p>
          </div>
        )}

        <div className="mt-5">
          <button className="btn-primary" type="button" disabled>
            <CreditCard className="h-3.5 w-3.5" />
            Upgrade to Pro (Coming Soon)
          </button>
        </div>
      </div>

      {/* Rechnungen */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Rechnungen
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Receipt className="h-8 w-8 text-cream-400 mb-3" />
          <p className="text-xs text-muted">
            Noch keine Rechnungen vorhanden.
          </p>
        </div>
      </div>
    </div>
  );
}
