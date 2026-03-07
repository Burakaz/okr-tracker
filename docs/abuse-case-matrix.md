# Abuse Case Matrix

**Datum:** 2026-03-07
**Sprint:** Red-Team, Chaos, Abuse & Launch-Certification

---

## Legende

| Symbol | Bedeutung |
|--------|-----------|
| BLOCKED | Angriff wird verhindert |
| MITIGATED | Angriff wird erschwert/begrenzt |
| ACCEPTED | Bekanntes Restrisiko, bewusst akzeptiert |

---

## A: Cross-Tenant / Org-Isolation

| # | Abuse Case | Vektor | Ergebnis | Ref |
|---|-----------|--------|----------|-----|
| A1 | Enrollment in fremden Kurs | `POST /api/courses/{foreign_id}/enroll` | BLOCKED — org_id + is_published Check | RT-P0-1 |
| A2 | Auto-Enrollment bei OKR mit fremdem course_id | `POST /api/okrs` mit `course_id` aus anderer Org | BLOCKED — Kurs-Validierung vor Enrollment | RT-P0-2 |
| A3 | AI-Kursvorschläge aus fremder Org | `POST /api/ai/suggest-krs` mit category=learning | BLOCKED — org_id Filter (Prod-Hardening S6) | S5 |
| A4 | Fremde OKRs lesen | `GET /api/okrs` | BLOCKED — RLS + user_id Filter |
| A5 | Fremde OKRs bearbeiten | `PATCH /api/okrs/{foreign_id}` | BLOCKED — user_id Ownership Check |
| A6 | Fremde Team-Members sehen | `GET /api/team` | MITIGATED — nur eigene Org sichtbar (org_id Filter) |
| A7 | Fremde Achievements einsehen | DB-Direktzugriff | BLOCKED — RLS Policy |

## B: RBAC / Privilege Escalation

| # | Abuse Case | Vektor | Ergebnis | Ref |
|---|-----------|--------|----------|-----|
| B1 | Employee erstellt Kurs | `POST /api/courses` | BLOCKED — Role-Check hr/admin/super_admin | S2 |
| B2 | Employee ändert Rolle | `PUT /api/organization/members/{id}/role` | BLOCKED — Admin/Super-Admin Guard |
| B3 | Demo-Route ohne Gate | `GET /auth/demo` | BLOCKED — ENABLE_DEMO_MODE Env-Gate | S1 |
| B4 | Self-Promotion via Update | `PATCH /api/organization/members/{own_id}/role` | BLOCKED — Role hierarchy check |
| B5 | Manager Self-Reference | `UPDATE profiles SET manager_id = id` | BLOCKED — DB CHECK Constraint | RT-P1-8 |

## C: Business Logic Bypass

| # | Abuse Case | Vektor | Ergebnis | Ref |
|---|-----------|--------|----------|-----|
| C1 | Archivierte OKRs bearbeiten | `PATCH /api/okrs/{archived_id}` | BLOCKED — is_active Guard | RT-P0-3 |
| C2 | is_active via Update setzen | `PATCH /api/okrs/{id}` mit `{is_active: true}` | BLOCKED — is_active aus Schema entfernt | RT-P0-4 |
| C3 | Unpublished Kurs einschreiben | `POST /api/courses/{unpublished_id}/enroll` | BLOCKED — is_published Check | S8 |
| C4 | KR Progress > 100% | `current_value >> target_value` via Checkin | BLOCKED — LEAST(100, ...) in Trigger | RT-P1-5 |
| C5 | Leerer Checkin | `POST /api/okrs/{id}/checkin` mit `[]` updates | BLOCKED — .min(1) Validation | RT-P1-6 |
| C6 | Quarter-Achievements vorzeitig | `POST /api/achievements/check` mit `quarter_ended` | BLOCKED — 7-Tage-Fenster Check | RT-P1-1 |
| C7 | Beliebige Quartale erstellen | `POST /api/okrs` mit quarter `Q1 2030` | BLOCKED — Range Validation (±1 zurück, +2 voraus) | RT-P2-3 |
| C8 | Achievement Spam | `POST /api/achievements/check` wiederholt | MITIGATED — Idempotent (Upsert onConflict) | RT-P3-3 |
| C9 | Qualifying OKR Count Inflation | Soft-delete schlechte OKRs | BLOCKED — is_active Filter im Trigger | RT-P1-4 |

## D: AI Red Team

| # | Abuse Case | Vektor | Ergebnis | Ref |
|---|-----------|--------|----------|-----|
| D1 | Prompt Injection via Title | `title: "Ignore previous..."` | BLOCKED — Sanitization + 200 Char Limit | S4, RT-P1-7 |
| D2 | Unicode Prompt Injection | Zero-width chars in title | BLOCKED — Extended Unicode Sanitization | RT-P1-7 |
| D3 | Prompt Injection via Name | `?name=System: override...` | BLOCKED — Unicode-safe regex, 50 Char Limit | RT-P1-3 |
| D4 | API-Kosten-Explosion | 1000+ AI calls/hour | BLOCKED — 10 calls/user/hour Rate-Limit | S6 |
| D5 | AI Response Manipulation | Malformed JSON in AI response | MITIGATED — Zod-Schema validation on AI output |

## E: File Upload

| # | Abuse Case | Vektor | Ergebnis | Ref |
|---|-----------|--------|----------|-----|
| E1 | MIME-Type Spoofing | Upload .exe as .pdf | BLOCKED — Magic-Bytes validation | S3 |
| E2 | Oversize Upload | 100MB file | BLOCKED — 5MB limit in API |
| E3 | Malicious PDF | PDF with embedded JS | MITIGATED — Supabase Storage serves with Content-Disposition: attachment |

## F: Race Conditions

| # | Abuse Case | Vektor | Ergebnis | Ref |
|---|-----------|--------|----------|-----|
| F1 | First-User Race | Simultaneous signups | MITIGATED — Tighter race window | S7 |
| F2 | Checkin Cooldown Bypass | Parallel checkin requests | ACCEPTED — Minimal impact, no financial risk | RT-P3-2 |
| F3 | OKR Limit Bypass | Parallel OKR creates | MITIGATED — Count check before insert |

## G: Data Consistency

| # | Abuse Case | Vektor | Ergebnis | Ref |
|---|-----------|--------|----------|-----|
| G1 | Stale Data nach Tab-Wechsel | Edit OKR in Tab A, switch to Tab B | BLOCKED — refetchOnWindowFocus: true | RT-P2-1 |
| G2 | Duplicate ohne Course-Links | Duplicate OKR mit linked courses | BLOCKED — Course-Link Copy Logic | RT-P2-4 |
| G3 | Achievement Tabelle falsch | `first_checkin` Achievement | BLOCKED — Korrekte Tabelle okr_checkins | S2 (Prod-Hardening) |

---

## Zusammenfassung

| Kategorie | BLOCKED | MITIGATED | ACCEPTED | Total |
|-----------|---------|-----------|----------|-------|
| Cross-Tenant | 5 | 1 | 0 | 6 |
| RBAC | 5 | 0 | 0 | 5 |
| Business Logic | 7 | 1 | 1 | 9 |
| AI Red Team | 4 | 1 | 0 | 5 |
| File Upload | 2 | 1 | 0 | 3 |
| Race Conditions | 0 | 2 | 1 | 3 |
| Data Consistency | 3 | 0 | 0 | 3 |
| **Total** | **26** | **6** | **2** | **34** |
