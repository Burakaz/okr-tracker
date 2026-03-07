# Security Findings

**Datum:** 2026-03-07
**Scope:** Vollständiger Security-Audit + Red-Team Certification der OKR-Tracker-App

---

## Phase 1: Production-Hardening Sprint

### S1: Demo-Route ohne Authentifizierungs-Gate (P0 — FIXED)

**Datei:** `src/app/auth/demo/route.ts`
**Schwere:** Kritisch — Unauthentifizierter Admin-Zugang
**Beschreibung:** Die `/auth/demo` Route erstellt einen Demo-User mit `role: "super_admin"` ohne jegliche Prüfung. Jeder kann die URL aufrufen und erhält vollen Admin-Zugang.
**Fix:** Env-Gate `ENABLE_DEMO_MODE` — Route gibt 404 wenn Variable nicht `"true"` ist.

---

### S2: Fehlende Rollenprüfung bei Kurs-Erstellung (P1 — FIXED)

**Datei:** `src/app/api/courses/route.ts`
**Schwere:** Hoch — Privilege Escalation
**Beschreibung:** POST-Endpoint prüft Authentifizierung aber nicht die Rolle. Jeder `employee` kann Kurse erstellen.
**Fix:** Role-Check: nur `hr`, `admin`, `super_admin` können Kurse anlegen (403 für andere).

---

### S3: MIME-Type-Spoofing bei File-Upload (P1 — FIXED)

**Datei:** `src/app/api/enrollments/[id]/certificate/route.ts`
**Schwere:** Hoch — Potentieller Upload von Malware
**Beschreibung:** MIME-Type wird nur über `file.type` geprüft (Client-seitig setzbar). Angreifer können beliebige Dateien als PDF/PNG hochladen.
**Fix:** Server-seitige Magic-Bytes-Prüfung: PDF (`%PDF`), PNG (`.PNG`), JPEG (`FFD8FF`), WebP (`RIFF`).

---

### S4: AI-Prompt-Injection (P1 — FIXED)

**Datei:** `src/app/api/ai/suggest-krs/route.ts`
**Schwere:** Hoch — User-Input direkt in Prompt interpoliert
**Beschreibung:** `body.title` wird direkt in den AI-Prompt eingesetzt: `OKR-Titel: "${body.title}"`. Angreifer können Anweisungen injizieren.
**Fix:** Input-Sanitization: Sonderzeichen (`"`, `\n`, `\r`, `\\`) werden entfernt.
**Nachbesserung (Red-Team):** Erweitert um Unicode-Sanitization (Zero-Width, Control Chars).

---

### S5: Fehlende Org-Isolation bei AI-Kursvorschlägen (P1 — FIXED)

**Datei:** `src/app/api/ai/suggest-krs/route.ts`
**Schwere:** Hoch — Cross-Org Data Leakage
**Beschreibung:** Kursvorschläge bei `category: "learning"` laden Kurse ohne `organization_id` Filter.
**Fix:** `.eq("organization_id", userProfile.organization_id)` hinzugefügt.

---

### S6: Fehlendes Rate-Limiting auf AI-Endpoints (P1 — FIXED)

**Dateien:** Alle 4 AI-Routes (`suggest-krs`, `suggest-courses`, `suggest-kpis`, `motivate`)
**Schwere:** Hoch — API-Kosten-Explosion
**Beschreibung:** AI-Endpoints haben kein Rate-Limiting.
**Fix:** In-Memory Rate-Limiter: 10 calls/user/hour, mit TTL-basiertem Cleanup.

---

### S7: First-User Race Condition (P1 — MITIGATED)

**Datei:** `src/app/auth/callback/route.ts`
**Schwere:** Mittel — Zwei gleichzeitige Signups können beide `super_admin` werden
**Fix:** Race-Window minimiert durch näher am Upsert platzierten Count-Check.

---

### S8: Enrollment ohne Published-Check (P1 — FIXED)

**Datei:** `src/app/api/courses/[id]/enroll/route.ts`
**Schwere:** Mittel — Zugang zu unveröffentlichten Kursen
**Fix:** `.eq("is_published", true)` zum Course-Query hinzugefügt.

---

### S9: CSP `unsafe-inline` (P2 — ACCEPTED)

**Datei:** `next.config.ts`
**Schwere:** Niedrig für interne App
**Entscheidung:** Akzeptiert — Google Auth erfordert Inline-Scripts, interne App mit kontrollierten Nutzern.

---

## Phase 2: Red-Team Certification Sprint

### RT-S1: Cross-Org Enrollment via Service Client (P0 — FIXED)

**Datei:** `src/app/api/courses/[id]/enroll/route.ts`
**Schwere:** Kritisch — Cross-Tenant Data Access
**Beschreibung:** Service Client umgeht RLS. Enrollment-Query prüft nur Kurs-Existenz, nicht Organisation. Angreifer mit bekannter `course_id` kann sich in fremde Kurse einschreiben.
**Fix:** `.eq("organization_id", orgId)` + `.eq("is_published", true)` hinzugefügt.

---

### RT-S2: Auto-Enrollment ohne Kurs-Validierung (P0 — FIXED)

**Datei:** `src/app/api/okrs/route.ts`
**Schwere:** Kritisch — Cross-Tenant Auto-Enrollment
**Beschreibung:** OKR-Erstellung mit `course_id` in Key Results löst Auto-Enrollment aus ohne Validierung des Kurses.
**Fix:** Validierung: `is_published: true` + `organization_id` Match, Skip mit Warning bei Fehlschlag.

---

### RT-S3: Archived OKR Mutation (P0 — FIXED)

**Datei:** `src/app/api/okrs/[id]/route.ts`
**Schwere:** Hoch — Data Integrity
**Beschreibung:** PATCH-Endpoint prüft nicht `is_active`. Archivierte OKRs können weiterhin bearbeitet werden.
**Fix:** `is_active` Guard nach Ownership-Check, Returns 400.

---

### RT-S4: is_active Schema-Bypass (P0 — FIXED)

**Datei:** `src/lib/validation.ts`
**Schwere:** Hoch — Business Logic Bypass
**Beschreibung:** `updateOKRSchema` erlaubt `is_active` als überschreibbares Feld.
**Fix:** `is_active` aus Schema entfernt.

---

### RT-S5: AI Motivate Prompt Injection via Name (P1 — FIXED)

**Datei:** `src/app/api/ai/motivate/route.ts`
**Schwere:** Mittel — AI Manipulation
**Beschreibung:** `name` Query-Parameter wird ohne Sanitization verwendet. Numerische Params ohne Bounds.
**Fix:** Unicode-safe Regex-Sanitization, 50-Char Limit, Bounds-Clamping.

---

### RT-S6: Extended Unicode Prompt Injection (P1 — FIXED)

**Datei:** `src/app/api/ai/suggest-krs/route.ts`
**Schwere:** Mittel — Improved Injection Vectors
**Beschreibung:** Bisherige Sanitization erlaubt Zero-Width-Zeichen und Control Characters.
**Fix:** Erweiterte Sanitization: `\u0000-\u001F`, `\u007F-\u009F`, `\u200B-\u200F`, `\u2028-\u202F`, `\uFEFF`.

---

### RT-S7: KR Progress Overflow (P1 — FIXED)

**Datei:** `supabase/migrations/20260215000005_triggers_functions.sql`
**Schwere:** Mittel — Data Integrity
**Beschreibung:** DB-Trigger erlaubt Progress > 100%.
**Fix:** `LEAST(100, GREATEST(0, ...))` in SQL Migration.

---

### RT-S8: Manager Self-Reference (P1 — FIXED)

**Datei:** `profiles` Tabelle
**Schwere:** Niedrig — Potentieller DoS
**Beschreibung:** Keine Constraint verhindert `manager_id = id`.
**Fix:** `CHECK (manager_id IS NULL OR manager_id != id)` DB Constraint.

---

## Positive Security-Findings

| Bereich | Status |
|---------|--------|
| RLS auf allen DB-Tabellen | Verifiziert |
| HSTS Header | Aktiviert |
| X-Frame-Options: DENY | Aktiviert |
| X-Content-Type-Options: nosniff | Aktiviert |
| Permissions-Policy | Konfiguriert |
| CORS: Same-Origin only | Verifiziert |
| `.env.local` nicht im Git | Verifiziert |
| Zod-Validation auf API-Inputs | Flächendeckend |
| UUID-Validation auf Path-Params | Flächendeckend |
| Open-Redirect-Schutz | Implementiert |
| Password/Secrets in Env-Vars | Korrekt isoliert |
| DB-Level Integrity Constraints | Implementiert (KR Cap, Manager Self-Ref, Qualifying Filter) |
| AI Input-Sanitization | Umfassend (Unicode, Control Chars, Prompt-Breaking) |
| AI Rate-Limiting | Implementiert (10/user/hour) |
| Magic-Bytes File Validation | Implementiert (PDF, PNG, JPEG, WebP) |
| Cross-Org Isolation | Verifiziert (alle Service-Client Queries) |
