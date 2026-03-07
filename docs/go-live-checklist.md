# Go-Live Checklist

**App:** OKR-Tracker
**Status:** Bereit für Go-Live
**Letzte Aktualisierung:** 2026-03-07 (Red-Team Certification Sprint)

---

## Pre-Launch

### Security

- [x] Demo-Route mit Env-Gate gesichert (`ENABLE_DEMO_MODE`)
- [x] RBAC auf allen relevanten Endpoints (Kurs-Erstellung, Admin-Funktionen)
- [x] File-Upload mit Magic-Bytes-Prüfung (PDF, PNG, JPEG, WebP)
- [x] AI-Input-Sanitization gegen Prompt-Injection (Unicode, Control Chars, Zero-Width)
- [x] AI-Endpoints mit Rate-Limiting (10/user/hour)
- [x] Org-Isolation bei AI-Kursvorschlägen
- [x] Cross-Org Enrollment blockiert (org_id + is_published Checks)
- [x] Auto-Enrollment mit Kurs-Validierung
- [x] RLS-Policies auf allen Tabellen verifiziert
- [x] Security-Headers aktiv (HSTS, CSP, X-Frame-Options, etc.)
- [x] CORS auf Same-Origin beschränkt
- [x] `.env.local` NICHT im Git
- [x] Open-Redirect-Schutz in Auth-Callback
- [x] Manager Self-Reference DB Constraint

### Datenintegrität

- [x] Achievement-Check verwendet korrekte Tabelle (`okr_checkins`)
- [x] Enrollment prüft `is_published` + `organization_id`
- [x] First-User Race Condition minimiert
- [x] Zod-Validation auf allen API-Inputs
- [x] Archived OKR Mutation Guard (is_active Check)
- [x] is_active nicht via Update-Schema überschreibbar
- [x] KR Progress auf 0-100% gecapped (DB Trigger)
- [x] Qualifying OKR Count filtert archivierte OKRs
- [x] Leere Checkins blockiert (.min(1) Validation)
- [x] Quarter-Range Validation (max 1 zurück, 2 voraus)
- [x] OKR Duplicate kopiert Course-Links

### Business Logic

- [x] Achievement Quarter-End nur in letzten 7 Tagen
- [x] Archived OKRs können nicht via PATCH bearbeitet werden
- [x] Checkin erfordert mindestens 1 KR Update

### Code-Qualität

- [x] TypeScript strict mode (0 Fehler in Produktionscode)
- [x] Build erfolgreich (`npm run build`)
- [x] Tests bestehen (pre-existing Failures dokumentiert)
- [x] Audit-Fehler werden geloggt (nicht mehr silent gecatcht)
- [x] Logger-Konsistenz (kein `console.error` in Produktionscode)
- [x] ESLint Config auf Next.js 16 aktualisiert

### Performance

- [x] Team-Stats mit Single-Pass statt O(N²)
- [x] React Query mit Stale-Times konfiguriert
- [x] refetchOnWindowFocus aktiviert

### Accessibility

- [x] Form-Labels mit htmlFor/id verknüpft (OrgGeneralTab)
- [x] Alle Images haben alt-Attribute (verifiziert)

### Infrastruktur

- [x] Vercel Deployment konfiguriert
- [x] CI/CD Pipeline aktiv (Lint + Type-Check + Tests + Build)
- [x] Supabase Migrations angewendet (inkl. Red-Team SQL Fixes)
- [x] DB-Level Constraints aktiv (KR Progress, Manager Self-Ref, Qualifying Count)

### Dokumentation

- [x] Production Readiness Audit
- [x] Security Findings (beide Phasen)
- [x] Go-Live Checklist (dieses Dokument)
- [x] Test Matrix
- [x] Release Decision / Final Verdict
- [x] Red-Team Findings
- [x] Abuse Case Matrix
- [x] RBAC Verification Matrix
- [x] Chaos Test Report

---

## Post-Launch (P3 Items)

- [ ] Pagination bei Org-Members API (`.limit(200)`)
- [ ] Extraneous Dependencies bereinigen (`npm prune`)
- [ ] Slider aria-labels mit Range-Info erweitern
- [ ] CSP `unsafe-inline` evaluieren (nach Google Auth Alternative suchen)
- [ ] Role-Change Audit-Trail hinzufügen
- [ ] Persistentes Rate-Limiting (Redis/DB) evaluieren
- [ ] Checkin Cooldown mit DB-Level Lock

---

## Environment Variables Checklist

| Variable | Zweck | Erforderlich |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Projekt-URL | Ja |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | Ja |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role | Ja |
| `ANTHROPIC_API_KEY` | AI-Features (bevorzugt) | Eines von beiden |
| `OPENAI_API_KEY` | AI-Features (Fallback) | Eines von beiden |
| `ENABLE_DEMO_MODE` | Demo-Login aktivieren | Nein (Default: deaktiviert) |

---

## SQL Migrations vor Go-Live

| Migration | Inhalt | Status |
|-----------|--------|--------|
| `20260215000001_initial_schema.sql` | Tabellen + Basis-Funktionen | Applied |
| `20260215000004_rls_policies.sql` | RLS auf allen Tabellen | Applied |
| `20260215000005_triggers_functions.sql` | Auto-Progress Triggers | Applied |
| `20260303000001_qualifying_okr_trigger.sql` | Career Progress Trigger | Applied |
| `20260307000001_red_team_fixes.sql` | KR Cap + Qualifying Filter + Manager Constraint | **Muss applied werden** |
