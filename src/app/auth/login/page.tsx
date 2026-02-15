"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "suspended" ? "Dein Account wurde gesperrt. Bitte kontaktiere einen Administrator." : null
  );

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setError("Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-foreground rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">OKR</span>
            </div>
            <span className="text-2xl font-bold text-foreground">ADMKRS</span>
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-center mb-2 text-foreground">
            Willkommen zurück
          </h1>
          <p className="text-muted text-center mb-8">
            Melden Sie sich an, um auf Ihre OKRs zuzugreifen
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-cream-400 rounded-xl bg-white hover:bg-cream-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-foreground" />
            ) : (
              <>
                <GoogleIcon />
                <span className="font-medium text-foreground">Mit Google anmelden</span>
              </>
            )}
          </button>

          {/* Info */}
          <p className="mt-6 text-xs text-muted text-center">
            Neue Konten müssen von einem Administrator freigeschaltet werden.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
