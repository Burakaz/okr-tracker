# Red-Team Findings Report

**Datum:** 2026-03-07
**Sprint:** Red-Team, Chaos, Abuse & Launch-Certification
**Scope:** Adversarial Security Audit — RBAC Bypass, Business Logic Abuse, AI Red Team, Data Consistency, Cross-Org Isolation
**Auditor:** Combined Red-Team (Principal Security Engineer, Staff QA, Adversarial Tester, Supabase Auditor, SRE, A11y Analyst)

---

## Executive Summary

Zweiter Audit-Durchlauf nach dem initialen Production-Hardening-Sprint. Fokus: adversarial testing, boundary bypass, cross-tenant attacks, business rule circumvention, AI manipulation, race conditions, silent failures. **23 Findings** identifiziert, davon **4 P0** und **8 P1**. Alle P0- und P1-Issues wurden behoben.

**Ergebnis: GO** — Alle kritischen Findings behoben, Restrisiken dokumentiert und akzeptiert.

---

## P0 — BLOCKER (alle behoben)

### RT-P0-1: Cross-Org Enrollment via Service Client
**Datei:** `src/app/api/courses/[id]/enroll/route.ts`
**Vektor:** Adversarial user enrolls in course from another organization
**Problem:** Enrollment-Endpoint nutzt Service Client (RLS-Bypass) und prüft nicht `organization_id`. Ein User kann sich in Kurse anderer Organisationen einschreiben, wenn er die `course_id` kennt.
**Impact:** Cross-Tenant Data Access — fremde Kursinhalte einsehbar
**Fix:** `.eq("organization_id", orgId)` und `.eq("is_published", true)` zum Course-Query hinzugefügt
**Status:** FIXED

### RT-P0-2: Auto-Enrollment bei OKR-Erstellung ohne Kurs-Validierung
**Datei:** `src/app/api/okrs/route.ts`
**Vektor:** Craft OKR with `course_id` from another org in key_result
**Problem:** Bei OKR-Erstellung mit `course_id` in Key Results wird auto-enrolled, ohne zu prüfen ob der Kurs veröffentlicht ist oder zur eigenen Organisation gehört.
**Impact:** Cross-Tenant Auto-Enrollment — fremde Kurse werden ohne Validierung verknüpft
**Fix:** Validierung hinzugefügt: `is_published: true` + `organization_id` Match, Skip mit Logger-Warning bei Fehlschlag
**Status:** FIXED

### RT-P0-3: Archived OKR Mutation via PATCH
**Datei:** `src/app/api/okrs/[id]/route.ts`
**Vektor:** Send PATCH request to archived OKR to modify title, progress, etc.
**Problem:** PATCH-Endpoint prüft Ownership aber nicht `is_active`. Archivierte OKRs können weiterhin bearbeitet werden, was den Archivierungs-Zweck untergräbt.
**Impact:** Data Integrity — archivierte Ziele werden unbemerkt verändert
**Fix:** `is_active` Guard nach Ownership-Check eingefügt, Returns 400 mit Fehlermeldung
**Status:** FIXED

### RT-P0-4: `is_active` via Update-Schema überschreibbar
**Datei:** `src/lib/validation.ts`
**Vektor:** Send `{ is_active: true }` in PATCH body to un-archive without using archive endpoint
**Problem:** `updateOKRSchema` erlaubt `is_active: z.boolean().optional()` — Clients können den Archivierungs-Status über normales Update umgehen, statt den dedizierten `/archive`-Endpoint zu nutzen.
**Impact:** Business Logic Bypass — Archivierungs-Workflow wird umgangen, Audit-Log fehlt
**Fix:** `is_active` aus `updateOKRSchema` entfernt
**Status:** FIXED

---

## P1 — HIGH (alle behoben)

### RT-P1-1: Achievement Quarter-End Gaming
**Datei:** `src/app/api/achievements/check/route.ts`
**Vektor:** Trigger `quarter_ended` event mid-quarter to earn achievements early
**Problem:** Kein Zeitfenster-Check — Client kann `quarter_ended` Event jederzeit triggern und vorzeitig Quarter-Achievements (z.B. `quarter_hero`) erhalten.
**Impact:** Achievement-System gameable — unverdiente Awards
**Fix:** Window-Check: `quarter_ended` nur in letzten 7 Tagen des Quartals erlaubt
**Status:** FIXED

### RT-P1-2: Achievement zählt archivierte OKRs
**Datei:** `src/app/api/achievements/check/route.ts`
**Vektor:** Archive bad OKRs, create new ones, trigger quarter_ended
**Problem:** OKR-Query für `quarter_ended` filtert nicht nach `is_active`, zählt also auch archivierte OKRs.
**Impact:** Inflated achievement eligibility
**Fix:** `.eq("is_active", true)` zum OKR-Query hinzugefügt
**Status:** FIXED

### RT-P1-3: AI Motivate Prompt Injection via Name
**Datei:** `src/app/api/ai/motivate/route.ts`
**Vektor:** Pass `name=Ignore previous instructions...` as query param
**Problem:** `name` Parameter wird ohne Sanitization direkt verwendet. Numerische Parameter haben keine Bounds-Checks.
**Impact:** AI-Prompt-Manipulation, potentiell unerwünschte AI-Ausgaben
**Fix:** Unicode-safe Regex-Sanitization (`\p{L}\p{N}` only), 50-Char Limit, Bounds-Clamping für alle numerischen Params
**Status:** FIXED

### RT-P1-4: Qualifying OKR Trigger zählt gelöschte OKRs
**Datei:** `supabase/migrations/20260303000001_qualifying_okr_trigger.sql`
**Vektor:** Soft-delete OKRs still inflate career progress counts
**Problem:** DB-Trigger `update_qualifying_okr_count()` zählt alle OKRs unabhängig von `is_active`. Soft-deleted OKRs verfälschen `qualifying_okr_count` und `total_okrs_attempted`.
**Impact:** Career Progress Inflation — Nutzer behalten Qualifying-Status trotz archivierter OKRs
**Fix:** `AND is_active = true` zu beiden COUNT-Queries im Trigger hinzugefügt (SQL Migration)
**Status:** FIXED

### RT-P1-5: KR Progress > 100% möglich
**Datei:** `supabase/migrations/20260215000005_triggers_functions.sql`
**Vektor:** Set `current_value` > `target_value` via checkin
**Problem:** `auto_calculate_kr_progress()` Trigger nutzt nur `GREATEST(0, ...)` aber kein `LEAST(100, ...)`. Progress kann über 100% steigen.
**Impact:** Data Integrity — ungültige Progress-Werte, fehlerhafte Aggregationen
**Fix:** `LEAST(100, GREATEST(0, ...))` — Progress wird auf 0-100% Bereich gecapped (SQL Migration)
**Status:** FIXED

### RT-P1-6: Leere Checkin KR-Updates möglich
**Datei:** `src/lib/validation.ts`
**Vektor:** POST checkin with empty `key_result_updates: []`
**Problem:** `checkinSchema` erlaubt leeres `key_result_updates` Array. Ein leerer Checkin zählt trotzdem als Checkin und kann Achievement-Counts manipulieren.
**Impact:** Checkin-Count Inflation, Achievement Gaming
**Fix:** `.min(1)` Constraint auf `key_result_updates` Array hinzugefügt
**Status:** FIXED

### RT-P1-7: Suggest-KRS erweiterte Prompt Injection
**Datei:** `src/app/api/ai/suggest-krs/route.ts`
**Vektor:** Unicode zero-width characters, control chars in title
**Problem:** Bisherige Sanitization war unvollständig — Zero-Width-Zeichen (`\u200B-\u200F`), Control Characters, und Prompt-Breaking Characters konnten die Sanitization umgehen.
**Impact:** Verbesserte Prompt-Injection-Vektoren
**Fix:** Erweiterte Sanitization: Control Chars, Zero-Width Unicode, Prompt-Breaking Chars (`"`, Backtick, Newline, Backslash)
**Status:** FIXED

### RT-P1-8: Manager Self-Reference Loop
**Datei:** `supabase/migrations/ (profiles table)`
**Vektor:** Set `manager_id = id` to create infinite loop in hierarchy queries
**Problem:** Keine DB-Constraint verhindert, dass ein User sich selbst als Manager setzt, was zu Endlosschleifen in Hierarchie-Queries führen kann.
**Impact:** Potentieller DoS bei Hierarchie-Traversal
**Fix:** `CHECK (manager_id IS NULL OR manager_id != id)` Constraint auf `profiles` Tabelle (SQL Migration)
**Status:** FIXED

---

## P2 — MEDIUM (alle behoben)

### RT-P2-1: refetchOnWindowFocus deaktiviert
**Datei:** `src/providers/QueryProvider.tsx`
**Problem:** React Query `refetchOnWindowFocus: false` — Stale Daten nach Tab-Wechsel
**Fix:** Auf `true` geändert
**Status:** FIXED

### RT-P2-2: Alle Bilder haben alt-Attribute
**Ergebnis:** Verifiziert — kein Finding, alle `<img>` Tags haben bereits `alt` Attribute
**Status:** N/A (kein Issue)

### RT-P2-3: Quarter-Range Validation fehlt in OKR-Erstellung
**Datei:** `src/lib/validation.ts`
**Problem:** `createOKRSchema` akzeptiert beliebige Quartale, auch weit in der Vergangenheit/Zukunft
**Fix:** Refine-Constraint: max 1 Quartal zurück, 2 voraus
**Status:** FIXED

### RT-P2-4: Duplicate Endpoint kopiert keine Course-Links
**Datei:** `src/app/api/okrs/[id]/duplicate/route.ts`
**Problem:** OKR-Duplizierung kopiert Key Results, aber nicht die zugehörigen `okr_course_links`
**Fix:** `okr_course_links` in SELECT, Copy-Logik für Links nach KR-Insert hinzugefügt
**Status:** FIXED

---

## P3 — LOW (dokumentiert)

### RT-P3-1: Team-Stats ohne Manager-Filter
**Datei:** `src/app/api/team/route.ts`
**Problem:** Alle Org-Members sichtbar, nicht nur direkte Reports
**Status:** ACCEPTED — Feature by design für Org-Transparenz

### RT-P3-2: Checkin Cooldown ohne DB-Lock
**Datei:** `src/app/api/okrs/[id]/checkin/route.ts`
**Problem:** 24h Cooldown basiert auf Time-of-Check, kein DB-Level Lock
**Status:** DEFERRED — Niedriges Risiko, Cooldown-Bypass hat minimale Auswirkung

### RT-P3-3: Achievement fake Events
**Datei:** `src/app/api/achievements/check/route.ts`
**Problem:** Client wählt Event-Type, könnte `okr_created` spammen
**Status:** ACCEPTED — Achievement-System ist idempotent (Upsert mit onConflict)

### RT-P3-4: Role-Change ohne Audit-Trail
**Datei:** `src/app/api/organization/members/[id]/role/route.ts`
**Problem:** Rollenänderungen werden nicht auditiert
**Status:** DEFERRED — Für v1.1 geplant

---

## SQL Migration

**Datei:** `supabase/migrations/20260307000001_red_team_fixes.sql`

Enthält 3 Fixes:
1. `auto_calculate_kr_progress()` — LEAST(100, ...) Cap
2. `update_qualifying_okr_count()` — is_active Filter
3. `profiles` — CHECK Constraint gegen Manager Self-Reference

---

## Geänderte Dateien (Red-Team Sprint)

| Datei | Änderung |
|-------|----------|
| `src/lib/validation.ts` | `is_active` entfernt, `.min(1)` auf KR-Updates, Quarter-Range-Validation |
| `src/app/api/okrs/[id]/route.ts` | Archived OKR Mutation Guard |
| `src/app/api/courses/[id]/enroll/route.ts` | Org-Isolation + Published-Check |
| `src/app/api/okrs/route.ts` | Auto-Enrollment Kurs-Validierung |
| `src/app/api/achievements/check/route.ts` | Quarter-End Window, is_active Filter |
| `src/app/api/ai/motivate/route.ts` | Name Sanitization, Numeric Bounds |
| `src/app/api/ai/suggest-krs/route.ts` | Extended Unicode Sanitization |
| `src/app/api/okrs/[id]/duplicate/route.ts` | Course-Link Copy Logic |
| `src/providers/QueryProvider.tsx` | refetchOnWindowFocus: true |
| `supabase/migrations/20260307000001_red_team_fixes.sql` | 3 DB-Level Fixes |
