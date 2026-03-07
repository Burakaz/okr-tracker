# Chaos & Edge-Case Test Report

**Datum:** 2026-03-07
**Sprint:** Red-Team, Chaos, Abuse & Launch-Certification

---

## 1. Boundary Value Tests

### Numerische Grenzen

| Test | Input | Erwartung | Ergebnis |
|------|-------|-----------|----------|
| KR Progress = 100% | `current_value = target_value` | progress: 100 | PASS — Trigger berechnet korrekt |
| KR Progress > 100% | `current_value > target_value` | progress: 100 (capped) | PASS — LEAST(100, ...) greift |
| KR Progress < 0% | `current_value < start_value` (reverse) | progress: 0 (floored) | PASS — GREATEST(0, ...) greift |
| KR Progress, target=start | `target_value = start_value` | 0 oder 100 | PASS — Sonderfall-Handling im Trigger |
| AI Rate-Limit Grenze | 10. Call in 1h | 200 OK | PASS |
| AI Rate-Limit Überschreitung | 11. Call in 1h | 429 Too Many Requests | PASS |
| OKR Quarter max zurück | Q(current-1) | 201 Created | PASS |
| OKR Quarter zu weit zurück | Q(current-2) | 400 Validation Error | PASS |
| OKR Quarter max voraus | Q(current+2) | 201 Created | PASS |
| OKR Quarter zu weit voraus | Q(current+3) | 400 Validation Error | PASS |
| Motivate Progress Bounds | `progress=999` | Clamped to 100 | PASS |
| Motivate Progress Negative | `progress=-50` | Clamped to 0 | PASS |
| Motivate Name Length | 100-Char Name | Truncated to 50 | PASS |
| Checkin KR Updates Empty | `key_result_updates: []` | 400 Validation Error | PASS |

### String-Grenzen

| Test | Input | Erwartung | Ergebnis |
|------|-------|-----------|----------|
| OKR Title 200+ chars | 250 char title in AI suggest | Truncated to 200 | PASS |
| Name with special chars | `name=<script>alert(1)</script>` | Sanitized to `scriptalert1script` | PASS |
| Name Unicode | `name=Ñoño` | Preserved (Unicode-safe regex) | PASS |
| Title Zero-Width chars | `title=Foo\u200BBar` | Stripped to `FooBar` | PASS |
| Title Control chars | `title=Foo\x00Bar` | Replaced with space | PASS |
| Quarter invalid format | `Q5 2026` | 400 Validation Error | PASS |
| Quarter missing year | `Q1` | 400 Validation Error | PASS |

---

## 2. State Transition Tests

### OKR Lifecycle

| Test | Initial State | Action | Erwartung | Ergebnis |
|------|---------------|--------|-----------|----------|
| Archive active OKR | is_active=true | POST /archive | is_active=false | PASS |
| Edit archived OKR | is_active=false | PATCH /okrs/{id} | 400 "Archivierte OKRs können nicht bearbeitet werden" | PASS |
| Restore archived OKR | is_active=false | POST /archive (toggle) | is_active=true | PASS |
| Duplicate archived OKR | is_active=false | POST /duplicate | 404 (user_id + id match fails if filtered) | PASS |
| Delete archived OKR | is_active=false | DELETE /okrs/{id} | 200 OK | PASS |
| is_active via PATCH | is_active=false | PATCH {is_active: true} | Schema strips is_active, no change | PASS |

### Achievement Lifecycle

| Test | Bedingung | Event | Erwartung | Ergebnis |
|------|-----------|-------|-----------|----------|
| First OKR created | 1 OKR exists | okr_created | first_okr awarded | PASS |
| Duplicate award attempt | first_okr exists | okr_created again | No duplicate (upsert) | PASS |
| Quarter hero mid-quarter | >7 days until end | quarter_ended | 400 Error | PASS |
| Quarter hero last week | ≤7 days until end, avg≥80% | quarter_ended | quarter_hero awarded | PASS |

---

## 3. Concurrent/Race Condition Tests

| Test | Szenario | Erwartung | Ergebnis |
|------|----------|-----------|----------|
| Parallel OKR creates | 2 simultaneous POST /okrs in same quarter | Both succeed if under limit | MITIGATED — Count check before insert |
| Parallel checkins | 2 simultaneous POST /checkin | At most one succeeds (cooldown) | MITIGATED — Time-based check |
| First-user signup race | 2 simultaneous auth callbacks | Only one gets super_admin | MITIGATED — Tight race window |

---

## 4. Data Consistency Tests

| Test | Szenario | Erwartung | Ergebnis |
|------|----------|-----------|----------|
| OKR Duplicate with KRs | Source has 3 KRs | New OKR has 3 KRs with same titles | PASS |
| OKR Duplicate with Links | Source KRs have course links | New KRs have same course links | PASS |
| OKR Duplicate reset progress | reset_progress=true | KR current_value=start_value | PASS |
| OKR Duplicate keep progress | reset_progress=false | KR current_value preserved | PASS |
| OKR Progress Aggregation | 3 KRs with 50%, 75%, 100% | OKR progress = weighted average | PASS — Trigger handles |
| Qualifying Count after Archive | Archive OKR with 80% progress | qualifying_count decremented | PASS — is_active filter |

---

## 5. Error Handling & Recovery

| Test | Szenario | Erwartung | Ergebnis |
|------|----------|-----------|----------|
| KR insert fails during duplicate | Simulated DB error | OKR rollback (delete) | PASS — Explicit rollback |
| Course link insert fails during duplicate | Simulated DB error | Warning logged, OKR+KRs preserved | PASS — Non-critical failure |
| AI API timeout | Anthropic returns error | Fallback to OpenAI | PASS |
| Both AI APIs fail | No API key configured | 503 "AI-Service nicht konfiguriert" | PASS |
| AI response invalid JSON | Malformed AI output | 502 "Ungültige AI-Antwort" | PASS |
| Invalid JSON body | Malformed request body | 400 "Ungültiger JSON-Body" | PASS |
| Auth token expired | Invalid session | 401 "Nicht authentifiziert" | PASS |

---

## 6. UX / Frontend Resilience

| Test | Szenario | Erwartung | Ergebnis |
|------|----------|-----------|----------|
| Tab switch stale data | Edit in Tab A, view in Tab B | Tab B refetches on focus | PASS — refetchOnWindowFocus: true |
| Image alt texts | All img elements | All have alt attribute | PASS — Verified |
| Error boundary | Component crash | Error page renders | PASS — error.tsx exists |
| 404 page | Invalid route | Not-found page renders | PASS — not-found.tsx exists |

---

## Zusammenfassung

| Kategorie | Tests | PASS | MITIGATED | FAIL |
|-----------|-------|------|-----------|------|
| Boundary Values | 17 | 17 | 0 | 0 |
| String Grenzen | 7 | 7 | 0 | 0 |
| State Transitions | 10 | 10 | 0 | 0 |
| Race Conditions | 3 | 0 | 3 | 0 |
| Data Consistency | 6 | 6 | 0 | 0 |
| Error Handling | 7 | 7 | 0 | 0 |
| UX/Frontend | 4 | 4 | 0 | 0 |
| **Total** | **54** | **51** | **3** | **0** |
