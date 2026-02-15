# OKR Tracker - Test Strategy & QA Report

**Document Version**: 1.0
**Date**: 2026-02-15
**Author**: QA Lead / Test Architect
**Stack**: Next.js 16.1.6, React 19, Supabase (PostgreSQL + Auth), Tailwind CSS 3, TypeScript 5
**Deploy**: Vercel (https://okr-tracker-roan.vercel.app)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Codebase Map](#2-codebase-map)
3. [Test Pyramid](#3-test-pyramid)
4. [Risk Matrix](#4-risk-matrix)
5. [Critical Paths](#5-critical-paths)
6. [Current Test Coverage Analysis](#6-current-test-coverage-analysis)
7. [Smoke Test Checklist](#7-smoke-test-checklist)
8. [Bug Report](#8-bug-report)
9. [Release Gates](#9-release-gates)
10. [Recommended Test Implementation Plan](#10-recommended-test-implementation-plan)

---

## 1. Executive Summary

The OKR Tracker application has **131 passing unit tests** covering two modules (`okr-logic.ts` and `validation.ts`). However, test coverage is critically insufficient. There are **zero integration tests**, **zero API route tests**, **zero component tests**, and **zero end-to-end tests**. Multiple bugs and architectural gaps have been identified, including missing error boundaries, a stale realtime subscription reference to `"users"` instead of `"profiles"`, and missing `error.tsx`/`global-error.tsx`/`not-found.tsx`/`loading.tsx` files across the entire app.

### Key Findings

- **131/131 tests pass** (unit only: `okr-logic.test.ts` and `validation.test.ts`)
- **0 API route tests** -- all 10 API routes are untested
- **0 component tests** -- all 14 React components are untested
- **0 E2E tests** -- no Playwright/Cypress setup exists
- **12 bugs identified** (3 critical, 5 medium, 4 low)
- **Table reference fix confirmed**: All `.from("profiles")` calls are correct; zero `.from("users")` references in DB queries
- **Residual bug found**: `useAdminRealtime` hook still subscribes to `"users"` table for Realtime, not `"profiles"`

---

## 2. Codebase Map

### Routes & Pages

| Route | Type | File |
|-------|------|------|
| `/` | Page | `src/app/page.tsx` (redirects to `/dashboard` or `/auth/login`) |
| `/auth/login` | Page | `src/app/auth/login/page.tsx` |
| `/auth/callback` | API (GET) | `src/app/auth/callback/route.ts` |
| `/auth/signout` | API (POST) | `src/app/auth/signout/route.ts` |
| `/dashboard` | Page | `src/app/dashboard/page.tsx` |
| `/dashboard` | Layout | `src/app/dashboard/layout.tsx` |
| `/api/auth/callback` | API | `src/app/api/auth/callback/route.ts` (unused/duplicate) |
| `/api/auth/me` | API (GET) | `src/app/api/auth/me/route.ts` |
| `/api/okrs` | API (GET, POST) | `src/app/api/okrs/route.ts` |
| `/api/okrs/[id]` | API (GET, PATCH, DELETE) | `src/app/api/okrs/[id]/route.ts` |
| `/api/okrs/[id]/archive` | API (PATCH) | `src/app/api/okrs/[id]/archive/route.ts` |
| `/api/okrs/[id]/duplicate` | API (POST) | `src/app/api/okrs/[id]/duplicate/route.ts` |
| `/api/okrs/[id]/focus` | API (PATCH) | `src/app/api/okrs/[id]/focus/route.ts` |
| `/api/okrs/[id]/checkin` | API (GET, POST) | `src/app/api/okrs/[id]/checkin/route.ts` |
| `/api/career` | API (GET) | `src/app/api/career/route.ts` |
| `/api/audit` | API (GET) | `src/app/api/audit/route.ts` |

### Components (14 total)

| Component | File |
|-----------|------|
| `DashboardClientWrapper` | `src/components/layout/DashboardClientWrapper.tsx` |
| `Sidebar` | `src/components/layout/Sidebar.tsx` |
| `Header` | `src/components/layout/Header.tsx` |
| `OKRList` | `src/components/okr/OKRList.tsx` |
| `OKRDetail` | `src/components/okr/OKRDetail.tsx` |
| `OKRForm` | `src/components/okr/OKRForm.tsx` |
| `CheckinDialog` | `src/components/okr/CheckinDialog.tsx` |
| `FocusOKRSection` | `src/components/okr/FocusOKRSection.tsx` |
| `DuplicateOKRDialog` | `src/components/okr/DuplicateOKRDialog.tsx` |
| `CareerProgressCard` | `src/components/okr/CareerProgressCard.tsx` |
| `ProgressBar` | `src/components/ui/ProgressBar.tsx` |
| `ScoreBadge` | `src/components/ui/ScoreBadge.tsx` |
| `StatusBadge` | `src/components/ui/StatusBadge.tsx` |
| `ConfidenceIndicator` | `src/components/ui/ConfidenceIndicator.tsx` |
| `ConfirmDialog` | `src/components/ui/ConfirmDialog.tsx` |
| `Skeleton` / `OKRListSkeleton` / `OKRDetailSkeleton` | `src/components/ui/Skeleton.tsx` |
| `DataPreloader` | `src/components/DataPreloader.tsx` |
| `QueryProvider` | `src/providers/QueryProvider.tsx` |

### Libraries (6 total)

| Library | File | Tests |
|---------|------|-------|
| `okr-logic` | `src/lib/okr-logic.ts` | 66 tests (PASSING) |
| `validation` | `src/lib/validation.ts` | 65 tests (PASSING) |
| `queries` | `src/lib/queries.ts` | NONE |
| `audit` | `src/lib/audit.ts` | NONE |
| `utils` | `src/lib/utils.ts` | NONE |
| `supabase/*` | `src/lib/supabase/{client,server,middleware}.ts` | NONE |

### Hooks

| Hook | File | Tests |
|------|------|-------|
| `useRealtimeQueryInvalidation` | `src/hooks/useRealtimeQuery.ts` | NONE |
| `useOKRsRealtime` | `src/hooks/useRealtimeQuery.ts` | NONE |
| `useAdminRealtime` | `src/hooks/useRealtimeQuery.ts` | NONE |

---

## 3. Test Pyramid

### Target Ratios

```
                    /\
                   /  \        E2E Tests
                  / 10 \       (Playwright)
                 /------\      5-8 critical user journeys
                /        \
               /   25%    \    Integration Tests
              /            \   API routes, DB operations, auth flow
             /--------------\
            /                \
           /      65%         \  Unit Tests
          /                    \ Pure logic, validation, helpers, components
         /______________________\
```

### Recommended Distribution

| Layer | Current | Target | Priority |
|-------|---------|--------|----------|
| **Unit Tests** | 131 (2 files) | ~300 (all libs + components) | P1 |
| **Integration Tests** | 0 | ~60 (all API routes) | P0 (CRITICAL) |
| **E2E Tests** | 0 | ~8 (critical paths) | P1 |
| **Total** | 131 | ~368 | -- |

---

## 4. Risk Matrix

### CRITICAL RISK (Immediate action required)

| # | Risk Area | Impact | Likelihood | Mitigation |
|---|-----------|--------|------------|------------|
| R1 | **Auth callback edge cases** | User lockout, data loss | Medium | Integration tests for all callback paths |
| R2 | **No error boundaries** | White screen of death on any runtime error | High | Add `error.tsx`, `global-error.tsx` |
| R3 | **API routes untested** | Silent data corruption, security bypass | High | Full API route test suite |
| R4 | **RLS bypass via service client** | Data leakage between users | Medium | Test ownership checks in all API routes |
| R5 | **Realtime "users" reference** | Admin realtime subscriptions silently fail | High | Fix `useAdminRealtime` to use `"profiles"` |

### MEDIUM RISK

| # | Risk Area | Impact | Likelihood | Mitigation |
|---|-----------|--------|------------|------------|
| R6 | **Check-in race condition** | Stale progress data | Medium | Optimistic locking or transaction |
| R7 | **Missing input sanitization** | XSS in OKR titles/descriptions | Low | Sanitize user inputs server-side |
| R8 | **No rate limiting on API routes** | DoS, abuse | Medium | Add rate limiting middleware |
| R9 | **Duplicate auth callback route** | Confusion, maintenance burden | Low | Remove `/api/auth/callback/route.ts` |
| R10 | **DataPreloader error handling** | Silent failures on initial load | Medium | Add error handling to prefetch |

### LOW RISK

| # | Risk Area | Impact | Likelihood | Mitigation |
|---|-----------|--------|------------|------------|
| R11 | **Missing settings/admin pages** | Sidebar links to nowhere | Low | Add pages or remove sidebar links |
| R12 | **No pagination on OKR list** | Performance with many OKRs | Low | Add pagination to GET /api/okrs |
| R13 | **ConfidenceIndicator label mismatch** | UI shows different labels than check-in dialog | Low | Unify labels |

---

## 5. Critical Paths

### Path 1: Google OAuth Login --> Profile Creation --> Dashboard Load

```
User clicks "Mit Google anmelden"
  --> Supabase redirects to Google OAuth
  --> Google redirects to /auth/callback with ?code=xxx
  --> exchangeCodeForSession(code)
  --> Check profiles table for existing user
  --> If suspended/inactive: sign out, redirect to /auth/login?error=suspended
  --> If first user ever: set role = super_admin
  --> Upsert profile with name, email, avatar_url from OAuth metadata
  --> Redirect to /dashboard
  --> Dashboard layout: fetch profile from profiles table
  --> DashboardClientWrapper: fetch OKRs via /api/okrs
  --> DataPreloader: prefetch OKRs, currentUser, careerLevels
```

**Test Cases Required**:
- TC1.1: New user (first ever) gets super_admin role
- TC1.2: New user (not first) gets employee role
- TC1.3: Existing user updates avatar_url on each login
- TC1.4: Suspended user is signed out and redirected
- TC1.5: Inactive user is signed out and redirected
- TC1.6: Missing code parameter redirects to login with error
- TC1.7: Invalid code redirects to login with error
- TC1.8: Profile upsert failure logs error but still redirects
- TC1.9: Dashboard layout handles missing profile gracefully

### Path 2: Create OKR --> Add Key Results --> Check-in --> Progress Update

```
User clicks "Neues OKR"
  --> OKRForm opens as modal
  --> User fills title, why_it_matters, category, quarter, key results
  --> POST /api/okrs with CreateOKRRequest
  --> Validate with createOKRSchema
  --> Check MAX_OKRS_PER_QUARTER limit (5)
  --> Fetch profile for organization_id
  --> Insert OKR into okrs table
  --> Insert key results into key_results table
  --> Audit log (non-blocking)
  --> User selects OKR from list --> OKRDetail panel shows
  --> User clicks "Check-in"
  --> CheckinDialog opens with current KR values
  --> User adjusts KR values via slider/input, sets confidence, writes reflections
  --> POST /api/okrs/[id]/checkin
  --> Validate with createCheckinSchema
  --> Update each key_result.current_value (triggers DB progress recalculation)
  --> Fetch updated OKR progress
  --> Insert okr_checkins record (triggers auto_checkin_updates)
  --> Return updated OKR + checkin
```

**Test Cases Required**:
- TC2.1: Create OKR with valid data returns 201
- TC2.2: Create OKR without auth returns 401
- TC2.3: Create OKR exceeding quarter limit returns 400
- TC2.4: Create OKR with no organization returns 400
- TC2.5: Create OKR with invalid data returns 400 with validation errors
- TC2.6: Key result insert failure triggers OKR rollback
- TC2.7: Check-in updates KR values and progress
- TC2.8: Check-in on archived OKR returns 400
- TC2.9: Check-in on non-owned OKR returns 404
- TC2.10: Check-in with invalid KR IDs handles gracefully

### Path 3: Focus/Pin OKR --> Duplicate --> Archive

```
Focus:
  User clicks Star icon on OKR
  --> PATCH /api/okrs/[id]/focus
  --> Toggle is_focus on OKR
  --> Enforce MAX_FOCUS limit (2)
  --> Audit log

Duplicate:
  User clicks "Duplizieren" --> DuplicateOKRDialog opens
  --> User selects target quarter, reset options
  --> POST /api/okrs/[id]/duplicate
  --> Validate with duplicateOKRSchema
  --> Copy OKR to new quarter (optionally reset progress, copy KRs)
  --> Audit log

Archive:
  User clicks "Archivieren"
  --> PATCH /api/okrs/[id]/archive
  --> Set is_active = false
  --> Clear is_focus if set
  --> Audit log
```

**Test Cases Required**:
- TC3.1: Focus toggle works (true/false)
- TC3.2: Focus exceeding MAX_FOCUS (2) returns 400
- TC3.3: Duplicate creates new OKR in target quarter
- TC3.4: Duplicate with reset_progress resets to 0
- TC3.5: Duplicate with copy_key_results copies KRs
- TC3.6: Duplicate without copy_key_results skips KRs
- TC3.7: Archive sets is_active = false
- TC3.8: Archive clears is_focus
- TC3.9: Restore (unarchive) sets is_active = true
- TC3.10: All operations require ownership (user_id check)

### Path 4: Role-Based Access

```
Roles: super_admin, admin, hr, manager, employee

super_admin:
  - Full access to all features
  - Can manage organization settings
  - First user to sign up

employee:
  - Can CRUD own OKRs
  - Can check-in on own OKRs
  - Cannot see other users' OKRs

manager:
  - Employee permissions + view team OKRs
```

**Test Cases Required**:
- TC4.1: Middleware blocks suspended users from API routes (returns 403)
- TC4.2: Middleware redirects unauthenticated users from protected paths
- TC4.3: Middleware redirects authenticated users from auth pages to dashboard
- TC4.4: API routes verify user ownership before CRUD operations
- TC4.5: GET /api/okrs only returns current user's OKRs (user_id filter)

### Path 5: RLS / Data Isolation

```
All API routes use:
  - supabase.auth.getUser() for authentication
  - serviceClient (service role key) for DB queries
  - Manual user_id filtering (.eq("user_id", user.id))
```

**Test Cases Required**:
- TC5.1: GET /api/okrs only returns OKRs where user_id matches authenticated user
- TC5.2: PATCH /api/okrs/[id] requires user_id match
- TC5.3: DELETE /api/okrs/[id] requires user_id match
- TC5.4: POST /api/okrs/[id]/checkin requires user_id match
- TC5.5: PATCH /api/okrs/[id]/focus requires user_id match
- TC5.6: POST /api/okrs/[id]/duplicate requires user_id match
- TC5.7: PATCH /api/okrs/[id]/archive requires user_id match
- TC5.8: GET /api/okrs/[id]/checkin requires user_id match

---

## 6. Current Test Coverage Analysis

### What PASSES (131 tests)

**`src/lib/__tests__/okr-logic.test.ts`** (66 tests):
- Quarter helpers (getCurrentQuarter, getNextQuarter, getPreviousQuarter, getQuarterDateRange, getAvailableQuarters)
- Score and progress conversions (progressToScore, scoreToProgress, getScoreInterpretation)
- Status calculation (calculateExpectedProgress, calculateStatus, getStatusLabel, getStatusClassName)
- OKR progress (calculateOKRProgress, calculateKRProgress)
- Confidence labels and colors
- Check-in overdue detection
- Limits (canAddFocus, canCreateOKR)
- Career (qualifiesForLevelUp)
- Category helpers
- Constants validation

**`src/lib/__tests__/validation.test.ts`** (65 tests):
- createOKRSchema (26 tests): title, quarter, category, scope, key_results validation
- updateOKRSchema (14 tests): partial updates, field validation
- createCheckinSchema (15 tests): confidence, text fields, key_result_updates
- duplicateOKRSchema (10 tests): target_quarter, boolean flags

### What is NOT Covered (CRITICAL GAPS)

| Area | Files | Risk |
|------|-------|------|
| **API Routes** | 10 route files, 0 tests | CRITICAL |
| **Middleware** | `middleware.ts`, `supabase/middleware.ts` | CRITICAL |
| **Auth Callback** | `auth/callback/route.ts` | CRITICAL |
| **React Components** | 14+ components | HIGH |
| **Hooks** | `useRealtimeQuery.ts` | MEDIUM |
| **Queries Library** | `queries.ts` | MEDIUM |
| **Audit Library** | `audit.ts` | LOW |
| **Utils** | `utils.ts` | LOW |
| **Supabase Clients** | `client.ts`, `server.ts` | LOW |

---

## 7. Smoke Test Checklist

### Pre-Deploy Smoke Test (Manual or E2E)

| # | Test | Steps | Expected Result | Status |
|---|------|-------|-----------------|--------|
| S1 | Login page loads | Navigate to /auth/login | Google login button visible, no errors | -- |
| S2 | Google OAuth flow | Click "Mit Google anmelden" | Redirects to Google, then back to /dashboard | -- |
| S3 | Dashboard loads | After login, observe dashboard | OKR list visible, sidebar visible, header with user info | -- |
| S4 | Create OKR | Click "Neues OKR", fill form, submit | OKR appears in list | -- |
| S5 | View OKR detail | Click on an OKR in list | Detail panel shows title, KRs, progress | -- |
| S6 | Check-in | Click "Check-in" on OKR, update KR, submit | Progress updates, check-in appears in history | -- |
| S7 | Focus OKR | Click star icon on OKR | OKR shows in "Fokus OKRs" section | -- |
| S8 | Duplicate OKR | Click "Duplizieren", select quarter | New OKR created in target quarter | -- |
| S9 | Archive OKR | Click "Archivieren" | OKR disappears from active list | -- |
| S10 | Delete OKR | Click "Loschen", confirm | OKR permanently removed | -- |
| S11 | Edit OKR | Click "Bearbeiten", modify, save | Changes reflected in list and detail | -- |
| S12 | Quarter filter | Change quarter in sidebar | Only OKRs for selected quarter shown | -- |
| S13 | Category filter | Click category in sidebar | Only matching category OKRs shown | -- |
| S14 | Search | Type in search bar | OKRs filtered by search query | -- |
| S15 | Sign out | Click user menu -> "Abmelden" | Redirected to login page, session cleared | -- |

### API Smoke Test (Automated)

| # | Endpoint | Method | Auth Required | Payload | Expected |
|---|----------|--------|---------------|---------|----------|
| A1 | `/api/auth/me` | GET | Yes | -- | 200 + user profile |
| A2 | `/api/okrs` | GET | Yes | -- | 200 + okrs array |
| A3 | `/api/okrs` | POST | Yes | Valid OKR | 201 + created OKR |
| A4 | `/api/okrs` | POST | No | -- | 401 |
| A5 | `/api/okrs/[id]` | GET | Yes | -- | 200 + OKR detail |
| A6 | `/api/okrs/[id]` | PATCH | Yes | Title update | 200 + updated OKR |
| A7 | `/api/okrs/[id]` | DELETE | Yes | -- | 200 |
| A8 | `/api/okrs/[id]/checkin` | POST | Yes | Valid check-in | 201 |
| A9 | `/api/okrs/[id]/focus` | PATCH | Yes | -- | 200 |
| A10 | `/api/okrs/[id]/archive` | PATCH | Yes | -- | 200 |
| A11 | `/api/okrs/[id]/duplicate` | POST | Yes | Valid duplicate request | 201 |
| A12 | `/api/career` | GET | Yes | -- | 200 + career levels |
| A13 | `/api/audit` | GET | Yes | -- | 200 + audit logs |

---

## 8. Bug Report

### CRITICAL Bugs

#### BUG-001: useAdminRealtime subscribes to "users" table instead of "profiles"

**File**: `src/hooks/useRealtimeQuery.ts`, line 84
**Severity**: CRITICAL
**Impact**: Admin realtime subscriptions will silently fail because the `"users"` table does not exist in the database schema. The table was renamed to `"profiles"` but this reference was not updated.
**Current Code**:
```typescript
export function useAdminRealtime(enabled = true) {
  useRealtimeQueryInvalidation("users", [["users"]], { enabled });
  // ...
}
```
**Expected**:
```typescript
export function useAdminRealtime(enabled = true) {
  useRealtimeQueryInvalidation("profiles", [["users"]], { enabled });
  // ...
}
```
**Note**: The query key `["users"]` can remain the same since it is a React Query cache key, not a table name. Only the first argument (the Supabase Realtime table subscription name) needs to change.

#### BUG-002: No error.tsx, global-error.tsx, not-found.tsx, or loading.tsx files

**Files Missing**:
- `src/app/error.tsx` -- catches runtime errors in the app
- `src/app/global-error.tsx` -- catches errors in root layout
- `src/app/not-found.tsx` -- custom 404 page
- `src/app/loading.tsx` -- loading state for root
- `src/app/dashboard/error.tsx` -- catches dashboard errors
- `src/app/dashboard/not-found.tsx` -- 404 within dashboard
- `src/app/dashboard/loading.tsx` -- loading state for dashboard

**Severity**: CRITICAL
**Impact**: Any unhandled runtime error in any component will cause a white screen of death (React error boundary fallback). Users will see Next.js default error page with no way to recover. No custom 404 page exists for invalid routes.

#### BUG-003: Duplicate auth callback route

**Files**:
- `src/app/auth/callback/route.ts` (ACTIVE - handles OAuth)
- `src/app/api/auth/callback/route.ts` (APPEARS UNUSED/DUPLICATE)

**Severity**: CRITICAL (confusion risk)
**Impact**: Two callback routes exist. The active one at `/auth/callback` handles OAuth properly. The one at `/api/auth/callback` appears to be a leftover that could cause confusion. If Supabase is configured to redirect to the wrong one, authentication will break silently.

### MEDIUM Bugs

#### BUG-004: Check-in race condition - no optimistic locking

**File**: `src/app/api/okrs/[id]/checkin/route.ts`, lines 115-129
**Severity**: MEDIUM
**Impact**: If two check-ins are submitted simultaneously (e.g., browser tab duplication), key result values could be overwritten without conflict detection. The sequential update of key results without a transaction means partial updates are possible.
**Details**: KR updates happen in a `for` loop without a transaction wrapper. If one KR update fails mid-loop, earlier KRs will already be updated, leaving data in an inconsistent state.

#### BUG-005: DataPreloader silently swallows errors

**File**: `src/components/DataPreloader.tsx`, lines 11-28
**Severity**: MEDIUM
**Impact**: If any of the prefetch requests fail (network error, 401, 500), the error is silently swallowed by `Promise.all`. The user sees no indication that data failed to load.
**Details**: No `.catch()` handler, no error state, no retry logic. If `/api/okrs` fails, the OKR list will appear empty with no error message.

#### BUG-006: ConfidenceIndicator labels inconsistent with CheckinDialog

**Files**:
- `src/components/ui/ConfidenceIndicator.tsx`: Uses "Sehr niedrig", "Niedrig", "Mittel", "Hoch", "Sehr hoch"
- `src/components/okr/CheckinDialog.tsx`: Uses "Wird nicht erreicht", "Unwahrscheinlich", "Moglich", "Wahrscheinlich", "Wird erreicht"

**Severity**: MEDIUM
**Impact**: The same confidence level (1-5) displays different labels depending on where it is shown. Confusing for users.

#### BUG-007: Auth callback does not validate email existence

**File**: `src/app/auth/callback/route.ts`, line 44
**Severity**: MEDIUM
**Impact**: `data.user.email!.toLowerCase()` uses a non-null assertion. If for any reason the OAuth provider does not return an email (possible with some Google accounts), this will throw a runtime error and the user will get a 500 error with no helpful message.

#### BUG-008: Missing CSRF protection on signout route

**File**: `src/app/auth/signout/route.ts`
**Severity**: MEDIUM
**Impact**: The signout route is a POST handler invoked by a form. However, there is no CSRF token validation. A malicious site could craft a form that submits to `/auth/signout`, logging the user out without their consent (CSRF logout attack).

### LOW Bugs

#### BUG-009: Sidebar links to non-existent pages

**File**: `src/components/layout/Sidebar.tsx`
**Severity**: LOW
**Impact**: The sidebar has navigation items for "Einstellungen" (Settings) and potentially "Team" and "Admin" sections. No corresponding pages exist at `/dashboard/settings`, `/dashboard/team`, or `/admin`. Clicking these will show the default Next.js 404.

#### BUG-010: categoryConfig duplicated across 3 components

**Files**:
- `src/components/okr/OKRList.tsx` (lines 33-38)
- `src/components/okr/OKRDetail.tsx` (lines 33-38)
- `src/components/okr/FocusOKRSection.tsx` (lines 13-18)

**Severity**: LOW
**Impact**: Same configuration object defined in 3 places. If category names or colors change, all 3 must be updated. Risk of drift.

#### BUG-011: OKR sort_order query may return wrong result

**File**: `src/app/api/okrs/route.ts`, lines 145-152
**Severity**: LOW
**Impact**: When getting the next sort_order for a new OKR, the query uses `.single()` on what might be an empty result set (first OKR in a quarter). If the query returns no rows, `.single()` returns an error. The fallback `(lastOkr?.sort_order ?? -1) + 1` handles this, but the error is still logged to console unnecessarily.

#### BUG-012: Header user.name.charAt(0) crash on empty name

**File**: `src/components/layout/Header.tsx`, line 84
**Severity**: LOW
**Impact**: If `user.name` is an empty string, `user.name.charAt(0).toUpperCase()` returns an empty string (harmless), but if `user.name` is null/undefined (TypeScript type says string, but runtime could differ), this will throw.

---

## 9. Release Gates

### Gate 1: Pre-Commit (Developer)
- [ ] All unit tests pass (`npx vitest run`)
- [ ] TypeScript compilation succeeds (`npx tsc --noEmit`)
- [ ] Linting passes (if configured)
- [ ] No `.from("users")` references in source code (not counting React Query cache keys)

### Gate 2: Pre-Merge (CI/CD Pipeline)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] TypeScript compilation succeeds
- [ ] Build succeeds (`next build`)
- [ ] No new critical/high Snyk vulnerabilities

### Gate 3: Pre-Deploy (Staging)
- [ ] Smoke tests pass (S1-S15 from checklist)
- [ ] API smoke tests pass (A1-A13 from checklist)
- [ ] Manual QA sign-off on critical paths
- [ ] Error boundaries are in place and functional

### Gate 4: Post-Deploy (Production)
- [ ] Health check endpoint responds 200
- [ ] Login flow works end-to-end
- [ ] Create OKR flow works end-to-end
- [ ] No new errors in Vercel logs (first 15 minutes)

---

## 10. Recommended Test Implementation Plan

### Phase 1: CRITICAL (Week 1) -- Stop the Bleeding

1. **Fix BUG-001**: Change `"users"` to `"profiles"` in `useAdminRealtime`
2. **Fix BUG-002**: Add `error.tsx`, `global-error.tsx`, `not-found.tsx` files
3. **Fix BUG-003**: Remove or consolidate duplicate auth callback route
4. **Add API route integration tests** for:
   - `POST /api/okrs` (happy path, validation, auth, limits)
   - `GET /api/okrs` (happy path, auth, filtering)
   - `PATCH /api/okrs/[id]` (happy path, auth, ownership)
   - `DELETE /api/okrs/[id]` (happy path, auth, ownership)
   - `POST /api/okrs/[id]/checkin` (happy path, archived, auth, ownership)
   - `GET /api/auth/me` (happy path, no auth)

### Phase 2: HIGH (Week 2) -- Core Coverage

5. **Add middleware tests**:
   - Protected route redirects
   - Suspended user blocking
   - Auth page redirect for logged-in users
6. **Add auth callback tests**:
   - First user super_admin assignment
   - Existing user avatar update
   - Suspended user rejection
   - Missing code parameter handling
7. **Add component tests** (React Testing Library) for:
   - `OKRForm` (form validation, submission)
   - `CheckinDialog` (slider interaction, form submission)
   - `OKRList` (sorting, menu actions)
   - `ConfirmDialog` (open/close, confirm/cancel)

### Phase 3: MEDIUM (Week 3) -- Comprehensive Coverage

8. **Add remaining API route tests**:
   - Focus toggle (including MAX_FOCUS enforcement)
   - Archive/restore
   - Duplicate (with/without KR copy, progress reset)
   - Career levels
   - Audit logs
9. **Add remaining component tests**:
   - `OKRDetail`, `FocusOKRSection`, `DuplicateOKRDialog`
   - `CareerProgressCard`, `Sidebar`, `Header`
   - All UI primitives (ProgressBar, ScoreBadge, StatusBadge, etc.)
10. **Add `queries.ts` and `audit.ts` unit tests**

### Phase 4: E2E (Week 4) -- User Journey Validation

11. **Set up Playwright**
12. **Implement E2E tests for critical paths**:
   - E2E-1: Full login flow (Google OAuth mock)
   - E2E-2: Create OKR with Key Results
   - E2E-3: Check-in flow with progress update
   - E2E-4: Focus, duplicate, archive lifecycle
   - E2E-5: Quarter switching and filtering
   - E2E-6: Sign out and re-login
   - E2E-7: Error page rendering (404, runtime error)
   - E2E-8: Responsive layout (mobile sidebar)

### Test Tooling Requirements

| Tool | Purpose | Status |
|------|---------|--------|
| Vitest | Unit & integration tests | INSTALLED |
| @testing-library/react | Component tests | INSTALLED (setup.ts imports jest-dom) |
| @testing-library/jest-dom | DOM matchers | INSTALLED |
| Playwright | E2E tests | NOT INSTALLED |
| msw (Mock Service Worker) | API mocking for component tests | NOT INSTALLED |
| Supabase local (Docker) | Integration test database | NOT SET UP |

---

## Appendix A: Verified Code Path Audit

### Table Reference Verification (PASS)

All Supabase database queries correctly reference `"profiles"` (not `"users"`):

| File | Line | Query |
|------|------|-------|
| `src/lib/supabase/middleware.ts` | 85 | `.from("profiles").select("status")` |
| `src/app/api/okrs/route.ts` | 91 | `.from("profiles").select("organization_id")` |
| `src/app/api/career/route.ts` | 20 | `.from("profiles").select(...)` |
| `src/app/api/audit/route.ts` | 20 | `.from("profiles").select(...)` |
| `src/app/dashboard/layout.tsx` | 23 | `.from("profiles").select(...)` |
| `src/app/auth/callback/route.ts` | 18,31,41 | `.from("profiles").select/upsert(...)` |
| `src/app/api/auth/me/route.ts` | 18 | `.from("profiles").select(...)` |

**EXCEPTION**: `src/hooks/useRealtimeQuery.ts` line 84 uses `"users"` as a Supabase Realtime table name (BUG-001).

### Middleware Route Protection Verification (PASS)

Protected paths: `/dashboard`, `/admin`, `/api/okrs`, `/api/audit`, `/api/career`

- Unauthenticated access to protected paths: Redirects to `/auth/login?redirect=<path>`
- Suspended users on API routes: Returns 403 "Account suspended"
- Authenticated users on auth pages: Redirects to `/dashboard`
- Signout route excluded from auth-page redirect: Correct

### API Auth Verification (PASS)

All API routes check `supabase.auth.getUser()` and return 401 if no user.
All OKR mutation routes verify `.eq("user_id", user.id)` before operations.

### Security Headers Verification (PASS)

`next.config.ts` sets: X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, X-XSS-Protection, HSTS, CSP, Permissions-Policy.

---

## Appendix B: File Inventory

Total source files: 60
- Pages: 4 (`page.tsx`, `layout.tsx`, `login/page.tsx`, `dashboard/page.tsx`, `dashboard/layout.tsx`)
- API routes: 10
- Components: 17
- Libraries: 6
- Hooks: 1
- Providers: 1
- Types: 1
- Test files: 2
- CSS: 1
- Config: 1 (middleware)
