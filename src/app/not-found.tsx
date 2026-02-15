import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-foreground rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold" aria-hidden="true">OKR</span>
            </div>
            <span className="text-xl font-bold text-foreground">ADMKRS</span>
          </div>

          <div className="text-5xl font-bold text-cream-400 mb-4" aria-hidden="true">404</div>

          <h1 className="text-lg font-semibold text-foreground mb-2">
            Seite nicht gefunden
          </h1>
          <p className="text-muted text-sm mb-8 leading-relaxed">
            Die angeforderte Seite existiert nicht oder wurde verschoben.
            Bitte überprüfen Sie die URL oder kehren Sie zum Dashboard zurück.
          </p>

          <div className="flex gap-3 justify-center">
            <Link href="/dashboard" className="btn-primary">
              Zum Dashboard
            </Link>
            <Link href="/auth/login" className="btn-secondary">
              Zur Anmeldung
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted">
            ADMKRS OKR Tracker
          </p>
        </div>
      </div>
    </div>
  );
}
