"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          backgroundColor: "#f5f4f0",
          color: "#1a1a1a",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "28rem", padding: "1rem" }}>
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              border: "1px solid #e8e5e1",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "3.5rem",
                height: "3.5rem",
                backgroundColor: "#fef2f2",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <svg
                style={{ width: "1.75rem", height: "1.75rem", color: "#ef4444" }}
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

            <h1
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                marginBottom: "0.5rem",
              }}
            >
              Kritischer Fehler
            </h1>
            <p
              style={{
                color: "#7a7a7a",
                fontSize: "0.875rem",
                marginBottom: "1.5rem",
              }}
            >
              Die Anwendung konnte nicht geladen werden. Bitte versuche es
              erneut oder lade die Seite neu.
            </p>

            {error.digest && (
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#7a7a7a",
                  marginBottom: "1rem",
                  fontFamily: "monospace",
                }}
              >
                Fehler-ID: {error.digest}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
              }}
            >
              <button
                onClick={reset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.5rem 1rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  borderRadius: "0.5rem",
                  backgroundColor: "#1a1a1a",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Erneut versuchen
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.5rem 1rem",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  borderRadius: "0.5rem",
                  backgroundColor: "white",
                  color: "#1a1a1a",
                  border: "1px solid #e8e5e1",
                  cursor: "pointer",
                }}
              >
                Seite neu laden
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
