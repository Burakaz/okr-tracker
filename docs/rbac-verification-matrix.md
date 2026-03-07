# RBAC Verification Matrix

**Datum:** 2026-03-07
**Sprint:** Red-Team, Chaos, Abuse & Launch-Certification

---

## Rollen-Hierarchie

```
super_admin > admin > hr > manager > employee
```

---

## API-Endpoint RBAC Matrix

### OKR-Endpoints

| Endpoint | Method | employee | manager | hr | admin | super_admin | Auth | Isolation |
|----------|--------|----------|---------|-----|-------|-------------|------|-----------|
| `/api/okrs` | GET | Own | Own | Own | Own | Own | Required | user_id |
| `/api/okrs` | POST | Own | Own | Own | Own | Own | Required | user_id + org_id |
| `/api/okrs/[id]` | GET | Own | Own | Own | Own | Own | Required | user_id |
| `/api/okrs/[id]` | PATCH | Own* | Own* | Own* | Own* | Own* | Required | user_id + is_active |
| `/api/okrs/[id]` | DELETE | Own | Own | Own | Own | Own | Required | user_id |
| `/api/okrs/[id]/checkin` | POST | Own | Own | Own | Own | Own | Required | user_id + cooldown |
| `/api/okrs/[id]/archive` | POST | Own | Own | Own | Own | Own | Required | user_id |
| `/api/okrs/[id]/duplicate` | POST | Own | Own | Own | Own | Own | Required | user_id + quota |
| `/api/okrs/[id]/link-course` | POST | Own | Own | Own | Own | Own | Required | user_id |
| `/api/okrs/[id]/quick-checkin` | POST | Own | Own | Own | Own | Own | Required | user_id |

*) PATCH blockiert archivierte OKRs (is_active=false) — RT-P0-3

### Kurs-Endpoints

| Endpoint | Method | employee | manager | hr | admin | super_admin | Auth | Isolation |
|----------|--------|----------|---------|-----|-------|-------------|------|-----------|
| `/api/courses` | GET | All published | All published | All published | All | All | Required | org_id |
| `/api/courses` | POST | DENIED (403) | DENIED (403) | Allowed | Allowed | Allowed | Required | org_id |
| `/api/courses/[id]` | PATCH | DENIED | DENIED | Own org | Own org | Own org | Required | org_id |
| `/api/courses/[id]/enroll` | POST | Published+Own org | Published+Own org | Published+Own org | Published+Own org | Published+Own org | Required | org_id + is_published |

### Team-Endpoints

| Endpoint | Method | employee | manager | hr | admin | super_admin | Auth | Isolation |
|----------|--------|----------|---------|-----|-------|-------------|------|-----------|
| `/api/team` | GET | Org members | Org members | Org members | Org members | Org members | Required | org_id |
| `/api/team/members/[id]` | GET | Limited* | Reports | All org | All org | All org | Required | org_id + access check |
| `/api/team/learnings` | GET | Org | Org | Org | Org | Org | Required | org_id |

*) Employees can view members in same org but with limited detail

### Organization-Endpoints

| Endpoint | Method | employee | manager | hr | admin | super_admin | Auth | Isolation |
|----------|--------|----------|---------|-----|-------|-------------|------|-----------|
| `/api/organization` | GET | Own org | Own org | Own org | Own org | Own org | Required | org_id |
| `/api/organization` | PATCH | DENIED | DENIED | DENIED | Allowed | Allowed | Required | admin+ |
| `/api/organization/members` | GET | Own org | Own org | Own org | Own org | Own org | Required | org_id |
| `/api/organization/members/[id]/role` | PUT | DENIED | DENIED | DENIED | Allowed* | Allowed | Required | admin+ |

*) Admin kann nicht zu super_admin promoten

### AI-Endpoints

| Endpoint | Method | employee | manager | hr | admin | super_admin | Auth | Isolation |
|----------|--------|----------|---------|-----|-------|-------------|------|-----------|
| `/api/ai/suggest-krs` | POST | Rate-limited | Rate-limited | Rate-limited | Rate-limited | Rate-limited | Required | org_id (courses) |
| `/api/ai/suggest-courses` | POST | Rate-limited | Rate-limited | Rate-limited | Rate-limited | Rate-limited | Required | Rate-limit |
| `/api/ai/suggest-kpis` | POST | Rate-limited | Rate-limited | Rate-limited | Rate-limited | Rate-limited | Required | Rate-limit |
| `/api/ai/motivate` | GET | Rate-limited | Rate-limited | Rate-limited | Rate-limited | Rate-limited | Required | Sanitized input |

Rate-Limit: 10 calls/user/hour (alle AI-Endpoints shared)

### Auth-Endpoints

| Endpoint | Method | Zugang | Guard |
|----------|--------|--------|-------|
| `/auth/callback` | GET | Public | OAuth flow |
| `/auth/demo` | GET | Conditional | ENABLE_DEMO_MODE env var |
| `/auth/login` | Page | Public | — |
| `/auth/signout` | POST | Authenticated | — |

### Sonstige

| Endpoint | Method | employee | manager | hr | admin | super_admin | Auth | Isolation |
|----------|--------|----------|---------|-----|-------|-------------|------|-----------|
| `/api/achievements/check` | POST | Own | Own | Own | Own | Own | Required | user_id + time window |
| `/api/review` | GET | Own | Own | Own | Own | Own | Required | user_id + org_id |
| `/api/audit` | GET | DENIED | DENIED | DENIED | Allowed | Allowed | Required | admin+ |
| `/api/auth/me` | GET | Own | Own | Own | Own | Own | Required | user_id |
| `/api/version` | GET | Public | Public | Public | Public | Public | None | — |

---

## Database-Level (RLS Policies)

| Tabelle | SELECT | INSERT | UPDATE | DELETE | Isolation |
|---------|--------|--------|--------|--------|-----------|
| okrs | user_id match | user_id match | user_id match | user_id match | User |
| key_results | via OKR owner | via OKR owner | via OKR owner | via OKR owner | User (via join) |
| okr_checkins | user_id match | user_id match | — | — | User |
| courses | org_id match | hr/admin+ | hr/admin+ | hr/admin+ | Org + Role |
| enrollments | user_id match | user_id match | user_id match | — | User |
| profiles | user_id/org match | — | own profile | — | User/Org |
| achievements | user_id match | user_id match | — | — | User |
| organizations | member of org | — | admin+ | — | Org |
| user_career_progress | user_id/org match | system | system | — | User/Org |
| okr_course_links | via KR owner | via KR owner | — | via KR owner | User (via join) |

---

## Verifikations-Ergebnis

| Check | Ergebnis |
|-------|----------|
| Alle Endpoints authentifiziert | PASS (außer /api/version, /auth/login) |
| Kein Endpoint ohne Org-Isolation | PASS |
| Kurs-Erstellung nur HR/Admin+ | PASS |
| Rollenänderung nur Admin+ | PASS |
| Demo-Route gated | PASS |
| RLS auf allen Tabellen | PASS |
| Service Client mit manueller Isolation | PASS |
