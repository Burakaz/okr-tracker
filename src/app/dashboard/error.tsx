"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error boundary caught:", error);
  }, [error]);

  return (
    <div className="h-full flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-7 w-7 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-foreground mb-2">
            Dashboard konnte nicht geladen werden
          </h2>
          <p className="text-muted text-sm mb-2">
            Beim Laden deiner OKRs ist ein Fehler aufgetreten.
          </p>
          <p className="text-muted text-xs mb-6">
            Dies kann an einer voruebergehenden Netzwerkstorung oder
            Serverproblem liegen.
          </p>

          {error.digest && (
            <p className="text-xs text-muted mb-4 font-mono">
              Fehler-ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="btn-primary">
              Erneut versuchen
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
