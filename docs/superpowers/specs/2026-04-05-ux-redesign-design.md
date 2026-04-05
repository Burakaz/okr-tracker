# OKR Tracker — UX Redesign

## Context

The OKR Tracker is a Next.js 16 + Supabase app for team OKR management, learning, and career tracking. The app is functionally complete but needs UX improvements for casual users (login every 1-2 weeks). A comprehensive audit found zero broken interactions but identified structural friction: too many navigation steps for the core action (check-ins), scattered personal settings, and a learning page that hides content behind tabs.

**Target user**: Employee who logs in every 1-2 weeks to update OKR progress and occasionally browse courses. Must be immediately intuitive without training.

## Design Decisions (User-Approved)

1. Content max-width: `max-w-5xl` (1024px) → `max-w-[1400px]`
2. Sidebar: Visual grouping (Primary / Insights / Management)
3. Dashboard: Action center with inline check-ins
4. OKR creation: Full-page route `/okrs/new` instead of modal
5. Learnings: Complete rebuild as scroll-based hub (no tabs)
6. Settings + Career: Merged into tab-based profile center (3 tabs, "Darstellung" deferred)
7. Craft Focus categories: Unified to Settings list (Design, Development, Marketing, Sales, Operations, HR, Finance, Other)
8. `/career` route: Removed via server-side redirect to `/settings?tab=karriere`

---

## 1. Global: Content Width

**Change**: Replace `max-w-5xl` with `max-w-[1400px]` on all page containers, including page headers that use separate `max-w-*` constraints.

**Files affected**: Every page in `src/app/(authenticated)/*/page.tsx` — both the content area and any header sections.

**Settings page**: Changes from `max-w-2xl` (and header `max-w-5xl`) to `max-w-[1400px]` with internal content constraints per tab as needed.

**Team member detail**: Changes from `max-w-4xl` to `max-w-[1400px]`.

---

## 2. Sidebar Restructure

**Current**: Flat list of 6-7 items (Mein Quartal, Ziele, Lernen, Karriere, Ruckblick, Team & Orga).

**New structure**:

```
[Logo: OKR ADMKRS]

HAUPTMENU (label, uppercase, small)
  > Mein Quartal     (primary, 13px, full highlight — links to /dashboard)
  > Ziele            (primary — links to /okrs)
  > Lernen           (primary — links to /learnings)

EINBLICKE (label)
  > Ruckblick        (secondary, 12px, muted color — links to /review)

VERWALTUNG (label, only for manager/admin/hr)
  > Team & Orga      (secondary — links to /team)

─── bottom ───
  [Avatar] Profil & Settings  (links to /settings)
```

**Key changes**:
- "Karriere" removed from sidebar entirely (moved to Settings tabs)
- "Mein Quartal" label preserved from current sidebar (not renamed to "Dashboard")
- Items grouped with uppercase section labels
- Primary items: larger text (13px), full highlight on active
- Secondary items: smaller text (12px), muted color, subtler highlight
- Profile/Settings at bottom with user avatar (replaces current profile dropdown)

**File**: `src/components/layout/Sidebar.tsx`

---

## 3. Dashboard — Action Center

**Current**: Info display with links to other pages for actions.

**New**: The dashboard becomes the primary action surface. Users can complete check-ins without leaving.

### Layout (top to bottom):

**A) Greeting + AI Motivation** (unchanged)
- Time-of-day greeting with user name
- AI-generated motivational message

**B) Quarter Hero** (unchanged)
- Progress ring, quarter label, days remaining, active goals count

**C) Action Items — Inline Check-ins** (NEW)
- Section header: "Deine offenen Updates" with count badge
- For each overdue OKR:
  - OKR title + category badge + days overdue
  - Expandable: click to reveal check-in form inline
  - Only one card can be expanded at a time (expanding another collapses the current)
  - Check-in form uses `QuickCheckinRequest` type: KR value sliders, confidence selector (1-5), optional note textarea
  - Save button: shows loading spinner while saving, disabled during submit
  - On save success: card collapses with success animation, count badge decreases
  - On save error: toast notification with error message, form stays open, data preserved
  - Unsaved data: no persistence — navigating away loses unsaved changes (acceptable for a quick form)
- When no overdue items: celebratory empty state "Alles aktuell! Deine Ziele sind auf dem neuesten Stand."
- This replaces the current "nudge card" that just links to /okrs

**D) Learning Progress** (slightly enhanced)
- Active courses with progress bars (clickable → /learnings)
- "Alle Kurse" link → /learnings

**E) Quick Stats** (unchanged)
- 4-card grid: Active goals, Average progress, Active courses, Days remaining

### Data requirements:
- Same queries as current dashboard (`useOKRs`, `useCurrentUser`, `useEnrollments`, `useMotivation`)
- Inline check-in uses `useQuickCheckin` mutation (existing) with `QuickCheckinRequest`: `{ confidence: ConfidenceLevel, note?: string, key_result_updates: Array<{id, current_value}> }`
- The full check-in form (with what_helped/what_blocked/next_steps fields) remains available on the OKRs page via `CheckinDialog`
- KR data already available in OKR objects from `useOKRs`

### Files:
- Update: `src/app/(authenticated)/dashboard/page.tsx`
- New component: `src/components/dashboard/InlineCheckin.tsx`

---

## 4. OKR Creation — Full Page

**Current**: 2-step modal (28rem wide) with OKRForm component.

**New**: Full-page route at `/okrs/new` (and `/okrs/[id]/edit` for editing).

### Layout:

**Header**: Breadcrumb "Ziele / Neues OKR" with back button (navigates to /okrs).

**Two-column layout** (at 1400px width):
- **Left column (60%)**: Form fields
  - Title (large input, prominent)
  - "Warum wichtig?" (textarea)
  - Key Results section with add/remove/reorder
  - AI KPI suggestions button
- **Right column (40%)**: Metadata sidebar
  - Category selector (icon buttons)
  - Quarter selector
  - Scope selector (Personal/Team/Company)
  - Preview card showing how the OKR will look

**Footer**: Fixed bottom bar with "Abbrechen" and "OKR erstellen" buttons.

### Edit mode (`/okrs/[id]/edit`):
- Same layout as creation
- Data loading: `useOKR(id)` hook fetches existing OKR by ID from URL param
- Loading state: spinner while fetching OKR data
- Error state: "OKR nicht gefunden" with back link to /okrs
- Form pre-populated with existing values
- Footer button text: "Speichern" instead of "OKR erstellen"

### Key UX improvements:
- More space for key result editing (no modal constraint)
- Live preview of the OKR card on the right
- No step-switching — all fields visible at once (scrollable)
- AI suggestions panel has room to show results inline

### Files:
- New: `src/app/(authenticated)/okrs/new/page.tsx`
- New: `src/app/(authenticated)/okrs/[id]/edit/page.tsx`
- Refactor: `src/components/okr/OKRForm.tsx` — extract form logic into `OKRFormFields.tsx`, remove modal wrapper
- Update: `src/app/(authenticated)/okrs/page.tsx` — "Neues OKR" button navigates to `/okrs/new` instead of opening modal; "Edit" action navigates to `/okrs/[id]/edit`

---

## 5. Learnings — Hub Page Rebuild

**Current**: 3 tabs (My Courses / Catalog / Team) with filter bar.

**New**: Single scroll-based hub page with distinct sections.

### Layout (top to bottom):

**A) Page Header**
- "Learning Hub" title
- AI suggest button + "Kurs hinzufuegen" button (same as current)

**B) AI Suggestions Panel** (when active, same as current)

**C) "Dein Lernfortschritt" Section** (previously "Meine Kurse" tab)
- Section header with count: "3 aktive Kurse"
- 2-3 column grid of course cards
- Each card: course title, category badge, progress bar, next module name
- Click card → CourseDetailModal
- Empty state: "Noch keine Kurse — entdecke den Katalog unten" with arrow pointing down
- If user has completed courses: collapsible "Abgeschlossen (5)" subsection

**D) "Entdecken" Section** (previously "Kurskatalog" tab)
- Section header: "Kurskatalog"
- Category filter as large icon-tiles (not small pills) — 8 categories in 2x4 grid
- Search input (full width)
- Course grid (3 columns at 1400px)
- Each card: title, description preview, category badge, difficulty, module count, enroll button

**E) "Team Lernen" Section** (previously "Team" tab, managers only)
- Only visible for manager/hr/admin roles
- Section header: "Team Lernfortschritt"
- Collapsible by default (click to expand)
- Team learning stats inside

### Key UX improvements:
- No tab switching — user sees their progress AND the catalog on one page
- Category tiles are more discoverable than small filter pills
- Natural scroll flow: "where am I?" → "what's available?" → "what's my team doing?"
- Empty learning state points user to the catalog section below

### Files:
- Rewrite: `src/app/(authenticated)/learnings/page.tsx`
- Keep: `CourseDetailModal`, `AddLearningForm` (refactor imports)
- New: `src/components/learnings/CategoryTiles.tsx` — large category filter tiles
- Keep: `TeamLearnings` component (moves into collapsible section)
- Update: `CourseCatalogPanel.tsx` — update category filter arrays to new canonical list

---

## 6. Settings — Profile Center

**Current**: Simple form at `max-w-2xl`. Separate `/career` page.

**New**: Tab-based profile center absorbing career page. 3 tabs ship now; "Darstellung" tab deferred until there are at least 2 functional controls to justify it.

### Tabs:

**Tab 1: "Profil"**
- Large avatar display with upload option (if supported) or initials
- Full-width form layout (2-column at 1400px):
  - Left: Name, Email (read-only), Department, Position
  - Right: Craft Focus (dropdown), Bio/About (new textarea), Skills/Interests (new tag input)
- Save button with change detection

**Tab 2: "Karriere"** (content from current `/career` page)
- Current level card with icon and path name
- Progress to next level (progress bar + requirements checklist)
- Career ladder visualization (all levels)
- Link to Profil tab to change craft focus if wrong path

**Tab 3: "Konto"**
- Account info: Email, Auth method, Account creation date
- Status badge (Aktiv)
- Notification preferences (email notifications on/off for: check-in reminders, team updates, new courses)
- Danger zone: Logout button, Account deletion request (if applicable)

### Career route redirect:
- `/career` page replaced with a server-side `redirect('/settings?tab=karriere')` using Next.js `redirect()` from `next/navigation`
- This preserves any existing bookmarks or links

### Key changes:
- Career sidebar item removed
- Settings accessed via bottom sidebar profile link
- Much richer profile with bio and skills
- Account management consolidated

### Files:
- Rewrite: `src/app/(authenticated)/settings/page.tsx`
- Import: Career components from `src/components/career/` (keep existing components, import into settings)
- Replace: `src/app/(authenticated)/career/page.tsx` — replace content with `redirect('/settings?tab=karriere')`
- Update: `src/components/layout/Sidebar.tsx` — remove career link, add profile link at bottom

---

## 7. Craft Focus Unification

**Canonical list** (from Settings): Design, Development, Marketing, Sales, Operations, HR, Finance, Other

**All files to update**:
- `src/types/index.ts` — `CourseCategory` type definition
- `src/lib/ai/types.ts` — TypeScript types for AI requests
- `src/components/learnings/AddLearningForm.tsx` — category buttons and icons
- `src/components/learnings/LearningFilters.tsx` — filter options
- `src/components/learnings/CourseDetailModal.tsx` — `categoryGradients`, `categoryLabels`, `categoryIcons` maps
- `src/components/learnings/CourseCard.tsx` — category display maps
- `src/components/learnings/CourseCatalogPanel.tsx` — category filter arrays
- `src/app/(authenticated)/learnings/page.tsx` — `CATEGORY_LABELS` map, `validCategories` array
- `src/app/api/ai/suggest-modules/route.ts` — Zod enum + `CATEGORY_LABELS`
- `src/app/api/ai/suggest-courses/route.ts` — Zod enum + `CATEGORY_LABELS`

**Migration strategy for existing data**: Existing courses with old categories need a graceful fallback in the UI. Rather than a database migration, components should handle unknown categories by displaying them as "Other":

```typescript
const displayCategory = VALID_CATEGORIES.includes(course.category)
  ? course.category
  : "other";
```

This is simpler, non-destructive, and handles edge cases where new categories might be added later.

---

## 8. Pages Unchanged (Layout Only)

### Ruckblick (`/review`)
- `max-w-5xl` → `max-w-[1400px]`
- No structural changes
- Trend chart and OKR list benefit from wider layout

### Team & Orga (`/team`)
- `max-w-5xl` → `max-w-[1400px]`
- Member accordion benefits from wider layout
- No structural changes

### Organization (`/organization`)
- `max-w-5xl` → `max-w-[1400px]`
- No structural changes

---

## Non-Goals

- Dark mode (accepted as low priority in previous audit)
- Internationalization (German only for now)
- Real-time collaboration features
- Mobile app / PWA
- Notification system beyond in-app toasts
- "Darstellung" settings tab (deferred until density/theme controls are ready)
