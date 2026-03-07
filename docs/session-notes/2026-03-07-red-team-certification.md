# Session Notes: Red-Team, Chaos, Abuse & Launch-Certification Sprint

**Datum:** 2026-03-07
**Dauer:** ~3 Stunden (inkl. vorgelagerter Production-Hardening Sprint)
**Teilnehmer:** Combined Red-Team

---

## Kontext

Die OKR-Tracker-App war nach dem Production-Hardening Sprint (18 Findings behoben) feature-complete und deployed. Dieser zweite Sprint führte einen adversarial Security-Audit durch, um die App unter Angriffsbedingungen zu zertifizieren.

---

## Durchgeführte Aktivitäten

### Phase 1: Exploration & Threat Modeling
- Vollständige Code-Review aller API-Routes
- Identifikation von Service-Client-Nutzung (RLS-Bypass)
- Analyse der DB-Trigger und Constraints
- Frontend-Architektur und Error-Handling Review
- Threat-Modeling für jede Endpoint-Kategorie

### Phase 2: Plan-Erstellung
- 23 Findings identifiziert (4 P0, 8 P1, 7 P2, 4 P3)
- Priorisierte Defect-Liste erstellt
- 4-Sprint Execution Plan definiert
- Plan vom Stakeholder genehmigt

### Phase 3: Sprint 1 — P0 Fixes
- RT-P0-1: Cross-Org Enrollment blockiert
- RT-P0-2: Auto-Enrollment Kurs-Validierung
- RT-P0-3: Archived OKR Mutation Guard
- RT-P0-4: is_active aus Update-Schema entfernt
- **Checkpoint:** 0 Type-Errors, Build erfolgreich

### Phase 4: Sprint 2 — P1 Fixes
- RT-P1-1: Achievement Quarter-End Window (7 Tage)
- RT-P1-2: Achievement is_active Filter
- RT-P1-3: Motivate Name Sanitization (Unicode-safe)
- RT-P1-4: Qualifying Trigger is_active Filter (SQL)
- RT-P1-5: KR Progress Cap 100% (SQL)
- RT-P1-6: Checkin .min(1) Validation
- RT-P1-7: Extended Unicode Sanitization
- RT-P1-8: Manager Self-Reference Constraint (SQL)
- **Checkpoint:** 0 Type-Errors, Build erfolgreich

### Phase 5: Sprint 3 — P2 Fixes
- RT-P2-1: refetchOnWindowFocus aktiviert
- RT-P2-2: Image alt-Texts verifiziert (kein Issue)
- RT-P2-3: Quarter-Range Validation
- RT-P2-4: Duplicate Course-Link Copy Logic
- **Checkpoint:** 0 Type-Errors, Build erfolgreich

### Phase 6: Sprint 4 — Documentation & Certification
- 8 Dokumentations-Artefakte erstellt/aktualisiert
- Final Release Verdict geschrieben
- Launch-Certification abgeschlossen

---

## Wichtigste Erkenntnisse

### Kritischste Findings
1. **Cross-Org Enrollment (P0)** — Service Client umgeht RLS, org_id wurde nicht geprüft. Hätte cross-tenant data access ermöglicht.
2. **Archived OKR Mutation (P0)** — Archivierte OKRs konnten weiterhin bearbeitet werden. is_active war sogar im Update-Schema als überschreibbares Feld.
3. **DB-Trigger ohne Bounds** — KR Progress konnte >100% sein, Qualifying Count zählte archivierte OKRs.

### Pattern: Service Client = Manual Isolation Required
Überall wo `createServiceClient()` verwendet wird (RLS-Bypass), muss org_id manuell geprüft werden. Dies war bei Enrollment und Auto-Enrollment nicht der Fall.

### Pattern: Schema = API Surface
Felder im Zod-Schema sind direkt überschreibbar. `is_active` im Update-Schema war ein schwerwiegender Business-Logic-Bypass.

### Pattern: DB-Trigger = Single Point of Truth
Business-Logic in DB-Triggern (Progress-Berechnung, Qualifying Counts) braucht dieselbe Sorgfalt wie API-Code. Fehlende Bounds-Checks auf DB-Ebene sind besonders gefährlich, da sie von allen Clients geteilt werden.

---

## SQL Migration

Eine neue Migration wurde erstellt: `supabase/migrations/20260307000001_red_team_fixes.sql`

Enthält:
1. `auto_calculate_kr_progress()` — LEAST(100, ...) Progress Cap
2. `update_qualifying_okr_count()` — is_active Filter
3. `profiles` — CHECK Constraint gegen Manager Self-Reference

**Wichtig:** Diese Migration muss vor Go-Live auf die Produktions-DB angewendet werden.

---

## Metriken

| Metrik | Wert |
|--------|------|
| Findings gesamt | 23 |
| P0 behoben | 4/4 |
| P1 behoben | 8/8 |
| P2 behoben | 4/4 (1 N/A) |
| P3 dokumentiert | 4 |
| Dateien geändert | 10 |
| SQL Migrations | 1 |
| Docs erstellt/aktualisiert | 9 |
| Chaos-Tests durchgeführt | 54 |
| Build-Fehler | 0 |
| Type-Errors (Produktionscode) | 0 |

---

## Offene Items (Post-Launch)

| Item | Priorität | Geschätzter Aufwand |
|------|-----------|---------------------|
| Org-Members Pagination | P3 | 30 min |
| Dependency Cleanup | P3 | 15 min |
| Slider aria-labels | P3 | 15 min |
| Role-Change Audit-Trail | P3 | 1-2h |
| Checkin Cooldown DB-Lock | P3 | 1h |
| Test-Fixture TS-Kompatibilität | P3 | 1-2h |
| CSP unsafe-inline evaluieren | P3 | 2-4h |
| Persistentes Rate-Limiting | P3 | 2-3h |
