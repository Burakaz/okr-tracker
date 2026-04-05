# UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the 8-area UX redesign to make the OKR Tracker intuitive for casual users (login every 1-2 weeks).

**Architecture:** All changes are frontend-only (no DB migrations). The redesign touches every page's max-width, restructures the sidebar navigation, adds inline check-ins to the dashboard, converts OKR creation from modal to full-page route, rebuilds learnings as a scroll-based hub, merges settings + career into a tab-based profile center, unifies craft focus categories, and adds a career route redirect.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, TanStack React Query v5, Supabase, Lucide icons.

**Spec:** `docs/superpowers/specs/2026-04-05-ux-redesign-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/index.ts` | Modify | Update `CourseCategory` type to new 8-category list |
| `src/components/layout/Sidebar.tsx` | Rewrite | Grouped navigation with section labels + bottom profile link |
| `src/app/(authenticated)/dashboard/page.tsx` | Modify | Width update + inline check-in section |
| `src/components/dashboard/InlineCheckin.tsx` | Create | Expandable check-in card with KR sliders |
| `src/app/(authenticated)/okrs/page.tsx` | Modify | Width update + navigate to `/okrs/new` instead of modal |
| `src/app/(authenticated)/okrs/new/page.tsx` | Create | Full-page OKR creation |
| `src/app/(authenticated)/okrs/[id]/edit/page.tsx` | Create | Full-page OKR editing |
| `src/components/okr/OKRFormFields.tsx` | Create | Extracted form fields from OKRForm (reused by new/edit pages) |
| `src/app/(authenticated)/learnings/page.tsx` | Rewrite | Scroll-based hub with sections |
| `src/components/learnings/CategoryTiles.tsx` | Create | Large category filter tiles |
| `src/app/(authenticated)/settings/page.tsx` | Rewrite | Tab-based profile center (Profil/Karriere/Konto) |
| `src/app/(authenticated)/career/page.tsx` | Rewrite | Server-side redirect to `/settings?tab=karriere` |
| `src/app/(authenticated)/review/page.tsx` | Modify | Width update only |
| `src/app/(authenticated)/team/page.tsx` | Modify | Width update only |
| `src/app/(authenticated)/team/[id]/page.tsx` | Modify | Width update only |
| `src/app/(authenticated)/organization/page.tsx` | Modify | Width update only |
| `src/components/learnings/CourseDetailModal.tsx` | Modify | Update category maps |
| `src/components/learnings/CourseCard.tsx` | Modify | Update category maps |
| `src/components/learnings/CourseCatalogPanel.tsx` | Modify | Update category arrays |
| `src/components/learnings/AddLearningForm.tsx` | Modify | Update category list |
| `src/components/learnings/LearningFilters.tsx` | Modify | Update filter options |
| `src/lib/ai/types.ts` | Modify | Update category type references |
| `src/app/api/ai/suggest-modules/route.ts` | Modify | Update Zod enum |
| `src/app/api/ai/suggest-courses/route.ts` | Modify | Update Zod enum |

---

## Chunk 1: Global Width + Craft Focus Unification

### Task 1: Update content max-width across all pages

Replace `max-w-5xl` with `max-w-[1400px]`, `max-w-2xl` with `max-w-[1400px]`, and `max-w-4xl` with `max-w-[1400px]` on all authenticated page containers.

**Files:**
- Modify: `src/app/(authenticated)/dashboard/page.tsx:136` — `max-w-5xl` → `max-w-[1400px]`
- Modify: `src/app/(authenticated)/okrs/page.tsx:397` — `max-w-5xl` → `max-w-[1400px]`
- Modify: `src/app/(authenticated)/learnings/page.tsx:212` — `max-w-5xl` → `max-w-[1400px]`
- Modify: `src/app/(authenticated)/review/page.tsx:139,169` — `max-w-5xl` → `max-w-[1400px]`
- Modify: `src/app/(authenticated)/career/page.tsx:80,98` — `max-w-5xl` → `max-w-[1400px]`
- Modify: `src/app/(authenticated)/settings/page.tsx:94` — `max-w-5xl` → `max-w-[1400px]`
- Modify: `src/app/(authenticated)/settings/page.tsx:102` — `max-w-2xl` → `max-w-[1400px]`
- Modify: `src/app/(authenticated)/team/page.tsx:116,175` — `max-w-5xl` → `max-w-[1400px]`
- Modify: `src/app/(authenticated)/team/[id]/page.tsx:149` — `max-w-4xl` → `max-w-[1400px]`
- Modify: `src/app/(authenticated)/organization/page.tsx:41,71` — `max-w-5xl` → `max-w-[1400px]`

- [ ] **Step 1: Update dashboard page width**

In `src/app/(authenticated)/dashboard/page.tsx`, change:
```tsx
// Line 136
<div className="px-4 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6 max-w-5xl mx-auto">
```
to:
```tsx
<div className="px-4 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
```

- [ ] **Step 2: Update okrs page width**

In `src/app/(authenticated)/okrs/page.tsx`, change `max-w-5xl` → `max-w-[1400px]` on line 397.

- [ ] **Step 3: Update learnings page width**

In `src/app/(authenticated)/learnings/page.tsx`, change `max-w-5xl` → `max-w-[1400px]` on line 212.

- [ ] **Step 4: Update review page width**

In `src/app/(authenticated)/review/page.tsx`, change `max-w-5xl` → `max-w-[1400px]` on lines 139 and 169.

- [ ] **Step 5: Update career page width**

In `src/app/(authenticated)/career/page.tsx`, change `max-w-5xl` → `max-w-[1400px]` on lines 80 and 98.

- [ ] **Step 6: Update settings page width**

In `src/app/(authenticated)/settings/page.tsx`:
- Line 94: `max-w-5xl` → `max-w-[1400px]`
- Line 102: `max-w-2xl` → `max-w-[1400px]`

- [ ] **Step 7: Update team pages width**

In `src/app/(authenticated)/team/page.tsx`, change `max-w-5xl` → `max-w-[1400px]` on lines 116 and 175.

In `src/app/(authenticated)/team/[id]/page.tsx`, change `max-w-4xl` → `max-w-[1400px]` on line 149.

- [ ] **Step 8: Update organization page width**

In `src/app/(authenticated)/organization/page.tsx`, change `max-w-5xl` → `max-w-[1400px]` on lines 41 and 71.

- [ ] **Step 9: Verify build**

Run: `cd /Users/burak/Downloads/okr-tracker && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "style: update content max-width from 1024px to 1400px across all pages"
```

---

### Task 2: Unify Craft Focus categories

Update `CourseCategory` type and all files that define category lists to use the canonical 8 categories: design, development, marketing, sales, operations, hr, finance, other.

**Files:**
- Modify: `src/types/index.ts:197` — Update `CourseCategory` type
- Modify: `src/app/(authenticated)/learnings/page.tsx` — Update `CATEGORY_LABELS` map + `validCategories`
- Modify: `src/components/learnings/AddLearningForm.tsx` — Update category buttons
- Modify: `src/components/learnings/LearningFilters.tsx` — Update filter options
- Modify: `src/components/learnings/CourseDetailModal.tsx` — Update category maps
- Modify: `src/components/learnings/CourseCard.tsx` — Update category maps
- Modify: `src/components/learnings/CourseCatalogPanel.tsx` — Update category arrays
- Modify: `src/lib/ai/types.ts` — Update AI type references
- Modify: `src/app/api/ai/suggest-modules/route.ts` — Update Zod enum
- Modify: `src/app/api/ai/suggest-courses/route.ts` — Update Zod enum

- [ ] **Step 1: Update CourseCategory type**

In `src/types/index.ts`, change:
```typescript
export type CourseCategory = 'design' | 'development' | 'marketing' | 'leadership' | 'data' | 'communication' | 'product' | 'other';
```
to:
```typescript
export type CourseCategory = 'design' | 'development' | 'marketing' | 'sales' | 'operations' | 'hr' | 'finance' | 'other';
```

- [ ] **Step 2: Update CATEGORY_LABELS in learnings page**

In `src/app/(authenticated)/learnings/page.tsx`, replace the `CATEGORY_LABELS` constant:
```typescript
const CATEGORY_LABELS: Record<string, string> = {
  design: "Design",
  development: "Entwicklung",
  marketing: "Marketing",
  sales: "Sales",
  operations: "Operations",
  hr: "HR",
  finance: "Finance",
  other: "Sonstige",
};
```

Also update `validCategories` in `handleCreateFromSuggestion`:
```typescript
const validCategories: CourseCategory[] = [
  "design", "development", "marketing", "sales",
  "operations", "hr", "finance", "other",
];
```

- [ ] **Step 3: Update AddLearningForm categories**

In `src/components/learnings/AddLearningForm.tsx`, update the category buttons/options to use the new 8 categories with appropriate icons (Palette for Design, Code for Development, Megaphone for Marketing, TrendingUp for Sales, Settings for Operations, Users for HR, DollarSign for Finance, MoreHorizontal for Other).

- [ ] **Step 4: Update LearningFilters**

In `src/components/learnings/LearningFilters.tsx`, update filter category options to match the new list.

- [ ] **Step 5: Update CourseDetailModal category maps**

In `src/components/learnings/CourseDetailModal.tsx`, update `categoryGradients`, `categoryLabels`, and `categoryIcons` maps to use the new categories. Add a graceful fallback for unknown categories:
```typescript
const displayCategory = VALID_CATEGORIES.includes(course.category as CourseCategory)
  ? course.category
  : "other";
```

- [ ] **Step 6: Update CourseCard category maps**

In `src/components/learnings/CourseCard.tsx`, update category display maps to match.

- [ ] **Step 7: Update CourseCatalogPanel**

In `src/components/learnings/CourseCatalogPanel.tsx`, update category filter arrays.

- [ ] **Step 8: Update AI types and API routes**

In `src/lib/ai/types.ts`, update any category type references.

In `src/app/api/ai/suggest-modules/route.ts` and `src/app/api/ai/suggest-courses/route.ts`, update the Zod enum validators:
```typescript
category: z.enum(["design", "development", "marketing", "sales", "operations", "hr", "finance", "other"])
```

- [ ] **Step 9: Verify build**

Run: `cd /Users/burak/Downloads/okr-tracker && npx tsc --noEmit`
Expected: 0 errors. TypeScript should catch any missed category references.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "refactor: unify craft focus categories to canonical 8-item list"
```

---

## Chunk 2: Sidebar Restructure

### Task 3: Rewrite sidebar with visual grouping

Replace the flat navigation list with grouped sections (Hauptmenu / Einblicke / Verwaltung) and a bottom profile link that navigates to `/settings`.

**Files:**
- Rewrite: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Rewrite Sidebar component**

Rewrite `src/components/layout/Sidebar.tsx` with the following structure:

```tsx
"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  BookOpen,
  Trophy,
  Users,
  Building2,
  X,
  Settings,
} from "lucide-react";
import type { User } from "@/types";

interface SidebarProps {
  user: User;
  orgLogo?: string | null;
  onNavClick?: () => void;
}

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense
      fallback={
        <aside className="sidebar-container w-52">
          <div className="px-4 py-5">
            <div className="animate-pulse h-8 bg-cream-200 rounded" />
          </div>
        </aside>
      }
    >
      <SidebarContent {...props} />
    </Suspense>
  );
}

const primaryItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Mein Quartal" },
  { href: "/okrs", icon: Target, label: "Ziele" },
  { href: "/learnings", icon: BookOpen, label: "Lernen" },
];

const insightItems = [
  { href: "/review", icon: Trophy, label: "Ruckblick" },
];

const managementItems = [
  { href: "/team", icon: Users, label: "Team & Orga" },
];

function SidebarContent({ user, orgLogo, onNavClick }: SidebarProps) {
  const pathname = usePathname();

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const isManager = ["admin", "super_admin", "hr", "manager"].includes(user.role);

  return (
    <aside className="sidebar-container w-52 flex flex-col" aria-label="Seitenleiste">
      {/* Logo */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          {orgLogo ? (
            <img src={orgLogo} alt="ADMKRS" className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 bg-cream-200 rounded-lg flex items-center justify-center border border-cream-300">
              <Building2 className="h-4 w-4 text-muted" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-foreground">ADMKRS</span>
            <p className="text-[10px] text-muted">Personal Development OS</p>
          </div>
          {onNavClick && (
            <button
              onClick={onNavClick}
              className="lg:hidden p-1.5 rounded-lg hover:bg-black/[0.04] transition-colors"
              aria-label="Menu schliessen"
            >
              <X className="h-4 w-4 text-muted" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-1" aria-label="Hauptnavigation">
        {/* Primary */}
        <SectionLabel>Hauptmenu</SectionLabel>
        <div className="space-y-0.5">
          {primaryItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={<item.icon className="h-4 w-4" />}
              label={item.label}
              active={isActive(item.href)}
              onClick={onNavClick}
              variant="primary"
            />
          ))}
        </div>

        {/* Insights */}
        <SectionLabel className="mt-6">Einblicke</SectionLabel>
        <div className="space-y-0.5">
          {insightItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={<item.icon className="h-3.5 w-3.5" />}
              label={item.label}
              active={isActive(item.href)}
              onClick={onNavClick}
              variant="secondary"
            />
          ))}
        </div>

        {/* Management (role-gated) */}
        {isManager && (
          <>
            <SectionLabel className="mt-6">Verwaltung</SectionLabel>
            <div className="space-y-0.5">
              {managementItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={<item.icon className="h-3.5 w-3.5" />}
                  label={item.label}
                  active={isActive(item.href)}
                  onClick={onNavClick}
                  variant="secondary"
                />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Bottom: Profile link */}
      <div className="p-3 border-t border-cream-300/50">
        <Link
          href="/settings"
          onClick={onNavClick}
          className={`w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-black/[0.04] transition-colors ${
            pathname.startsWith("/settings") ? "bg-black/[0.04]" : ""
          }`}
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-cream-300 flex items-center justify-center">
              <span className="text-[11px] font-medium text-foreground">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="font-medium text-[13px] text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted truncate">Profil & Settings</p>
          </div>
          <Settings className="h-3.5 w-3.5 text-muted flex-shrink-0" />
        </Link>
      </div>
    </aside>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[10px] font-semibold text-muted uppercase tracking-wider px-2.5 mb-1.5 ${className}`}>
      {children}
    </p>
  );
}

function NavItem({
  href, icon, label, active, onClick, variant,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
  variant: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";
  return (
    <Link
      href={href}
      className={`sidebar-item ${active ? "active" : ""} ${
        isPrimary ? "text-[13px]" : "text-[12px] text-muted"
      }`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
```

Key changes from current:
- Removed `useState`, `ChevronDown`, `LogOut`, `UserIcon`, `TrendingUp` imports
- Removed `showProfileMenu` state and dropdown menu
- Removed "Karriere" nav item entirely
- Added `SectionLabel` component for group labels
- Added `variant` prop to `NavItem` (primary = 13px, secondary = 12px + muted)
- Bottom section: simple Link to `/settings` with avatar (no dropdown)
- Logout moved to Settings page Konto tab

- [ ] **Step 2: Verify build**

Run: `cd /Users/burak/Downloads/okr-tracker && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx && git commit -m "feat: restructure sidebar with visual grouping and bottom profile link"
```

---

## Chunk 3: Dashboard — Inline Check-ins

### Task 4: Create InlineCheckin component

Build the expandable inline check-in card for the dashboard that allows users to update overdue OKRs without leaving the page.

**Files:**
- Create: `src/components/dashboard/InlineCheckin.tsx`

- [ ] **Step 1: Create the InlineCheckin component**

Create `src/components/dashboard/InlineCheckin.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import { ChevronDown, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useQuickCheckin } from "@/lib/queries";
import type { OKR, ConfidenceLevel } from "@/types";

interface InlineCheckinProps {
  okrs: OKR[];
}

export function InlineCheckin({ okrs }: InlineCheckinProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const visibleOkrs = okrs.filter((o) => !completedIds.has(o.id));

  if (visibleOkrs.length === 0) {
    return (
      <div className="card p-6 text-center">
        <div className="text-2xl mb-2">✓</div>
        <p className="text-[14px] font-medium text-foreground">
          Alles aktuell!
        </p>
        <p className="text-[12px] text-muted mt-1">
          Deine Ziele sind auf dem neuesten Stand.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-foreground">
          Deine offenen Updates
        </h2>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
          {visibleOkrs.length}
        </span>
      </div>
      <div className="space-y-2">
        {visibleOkrs.map((okr) => (
          <CheckinCard
            key={okr.id}
            okr={okr}
            isExpanded={expandedId === okr.id}
            isSaving={savingId === okr.id}
            onToggle={() => setExpandedId((prev) => (prev === okr.id ? null : okr.id))}
            onSaveStart={() => setSavingId(okr.id)}
            onSaveEnd={(success) => {
              setSavingId(null);
              if (success) {
                setCompletedIds((prev) => new Set(prev).add(okr.id));
                setExpandedId(null);
                // useQuickCheckin hook handles cache invalidation automatically
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

function CheckinCard({
  okr, isExpanded, isSaving, onToggle, onSaveStart, onSaveEnd,
}: {
  okr: OKR;
  isExpanded: boolean;
  isSaving: boolean;
  onToggle: () => void;
  onSaveStart: () => void;
  onSaveEnd: (success: boolean) => void;
}) {
  const [confidence, setConfidence] = useState<ConfidenceLevel>(okr.confidence || 3);
  const [note, setNote] = useState("");
  const [krValues, setKrValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    okr.key_results?.forEach((kr) => { init[kr.id] = kr.current_value; });
    return init;
  });

  const daysOverdue = okr.next_checkin_at
    ? Math.max(0, Math.floor((Date.now() - new Date(okr.next_checkin_at).getTime()) / 86400000))
    : 0;

  const quickCheckin = useQuickCheckin();

  const handleSave = useCallback(async () => {
    onSaveStart();
    try {
      await quickCheckin.mutateAsync({
        okrId: okr.id,
        confidence,
        note: note || undefined,
        key_result_updates: Object.entries(krValues).map(([id, current_value]) => ({
          id,
          current_value,
        })),
      });
      toast.success("Check-in gespeichert");
      onSaveEnd(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern");
      onSaveEnd(false);
    }
  }, [okr.id, confidence, note, krValues, onSaveStart, onSaveEnd, quickCheckin]);

  const categoryColors: Record<string, string> = {
    performance: "bg-blue-100 text-blue-700",
    skill: "bg-purple-100 text-purple-700",
    learning: "bg-green-100 text-green-700",
    career: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="card overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-cream-50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[13px] font-medium text-foreground truncate">
              {okr.title}
            </p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryColors[okr.category] || "bg-cream-200 text-muted"}`}>
              {okr.category}
            </span>
          </div>
          {daysOverdue > 0 && (
            <p className="text-[11px] text-amber-600">
              {daysOverdue} {daysOverdue === 1 ? "Tag" : "Tage"} ueberfaellig
            </p>
          )}
        </div>
        <ProgressBar value={okr.progress} size="sm" className="w-20 flex-shrink-0" />
        <ChevronDown
          className={`h-4 w-4 text-muted flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded form */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-cream-200/60 pt-4 space-y-4">
          {/* KR sliders */}
          {okr.key_results?.map((kr) => (
            <div key={kr.id}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[12px] text-foreground truncate">{kr.title}</p>
                <span className="text-[11px] text-muted flex-shrink-0 ml-2">
                  {krValues[kr.id] ?? kr.current_value} / {kr.target_value}
                  {kr.unit ? ` ${kr.unit}` : ""}
                </span>
              </div>
              <input
                type="range"
                min={kr.start_value}
                max={kr.target_value}
                step={kr.target_value <= 10 ? 1 : Math.max(1, Math.round(kr.target_value / 100))}
                value={krValues[kr.id] ?? kr.current_value}
                onChange={(e) => setKrValues((prev) => ({ ...prev, [kr.id]: Number(e.target.value) }))}
                className="w-full accent-accent-green"
              />
            </div>
          ))}

          {/* Confidence */}
          <div>
            <p className="text-[11px] font-medium text-muted mb-2">Zuversicht</p>
            <div className="flex gap-1.5">
              {([1, 2, 3, 4, 5] as ConfidenceLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setConfidence(level)}
                  className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-colors ${
                    confidence === level
                      ? "bg-foreground text-white"
                      : "bg-cream-100 text-muted hover:bg-cream-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optionale Notiz..."
              className="input w-full text-[13px] resize-none"
              rows={2}
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary text-[13px] gap-1.5 w-full justify-center"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Speichern
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/burak/Downloads/okr-tracker && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/InlineCheckin.tsx && git commit -m "feat: add InlineCheckin component for dashboard check-ins"
```

---

### Task 5: Integrate InlineCheckin into Dashboard

Replace the check-in nudge card with the new inline check-in section.

**Files:**
- Modify: `src/app/(authenticated)/dashboard/page.tsx`

- [ ] **Step 1: Add InlineCheckin to dashboard**

In `src/app/(authenticated)/dashboard/page.tsx`:

1. Add import at top:
```tsx
import { InlineCheckin } from "@/components/dashboard/InlineCheckin";
```

2. Replace the "Check-in Nudge" section (lines ~229-256) with:
```tsx
{/* Inline Check-ins */}
{overdueOKRs.length > 0 && (
  <InlineCheckin okrs={overdueOKRs} />
)}

{/* All up-to-date celebration */}
{activeOKRs.length > 0 && overdueOKRs.length === 0 && (
  <div className="card p-4 border-l-4 border-l-accent-green bg-green-50/30">
    <p className="text-[13px] font-medium text-foreground">
      Alles aktuell! Deine Ziele sind auf dem neuesten Stand.
    </p>
  </div>
)}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/burak/Downloads/okr-tracker && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/dashboard/page.tsx && git commit -m "feat: integrate inline check-ins on dashboard"
```

---

## Chunk 4: OKR Creation — Full Page Route

### Task 6: Extract OKRFormFields from OKRForm

Extract the form body (fields, KR editing, AI suggestions) from the modal wrapper into a standalone component.

**Files:**
- Create: `src/components/okr/OKRFormFields.tsx`
- Modify: `src/components/okr/OKRForm.tsx` — import and use extracted component

- [ ] **Step 1: Create OKRFormFields**

Read the full `OKRForm.tsx` file. Extract everything inside the modal (form fields, state, category buttons, KR editing, AI suggestion panel, course selector) into `OKRFormFields.tsx` with these props:

```tsx
interface OKRFormFieldsProps {
  initialData?: OKR;
  currentQuarter?: string;
  onSubmit: (data: CreateOKRRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
  layout: "modal" | "page"; // Controls width/spacing
}
```

The component manages its own form state internally. When `layout === "page"`, render a two-column layout (60/40 split). When `layout === "modal"`, render the existing single-column step-based layout.

- [ ] **Step 2: Update OKRForm to wrap OKRFormFields**

Update `src/components/okr/OKRForm.tsx` to be a thin modal wrapper:
```tsx
export function OKRForm(props: OKRFormProps) {
  const focusTrapRef = useFocusTrap();
  return (
    <div className="modal-overlay" onClick={props.onCancel}>
      <div ref={focusTrapRef} className="modal-content" onClick={(e) => e.stopPropagation()}>
        <OKRFormFields {...props} layout="modal" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/burak/Downloads/okr-tracker && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/okr/OKRFormFields.tsx src/components/okr/OKRForm.tsx && git commit -m "refactor: extract OKRFormFields from OKRForm modal"
```

---

### Task 7: Create /okrs/new and /okrs/[id]/edit pages

**Files:**
- Create: `src/app/(authenticated)/okrs/new/page.tsx`
- Create: `src/app/(authenticated)/okrs/[id]/edit/page.tsx`
- Modify: `src/app/(authenticated)/okrs/page.tsx` — change "Neues OKR" button to use router.push

- [ ] **Step 1: Create /okrs/new page**

Create `src/app/(authenticated)/okrs/new/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { OKRFormFields } from "@/components/okr/OKRFormFields";
import { getCurrentQuarter } from "@/lib/okr-logic";
import type { CreateOKRRequest } from "@/types";

export default function NewOKRPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateOKRRequest) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/okrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("OKR erstellt");
        await queryClient.invalidateQueries({ queryKey: ["okrs"] });
        router.push("/okrs");
      } else {
        const error = await res.json();
        toast.error(error.error || "Fehler beim Erstellen");
      }
    } catch {
      toast.error("Fehler beim Erstellen");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb header */}
      <div className="border-b border-cream-300/50">
        <div className="h-14 flex items-center gap-3 px-6 max-w-[1400px] mx-auto">
          <Link href="/okrs" className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors">
            <ArrowLeft className="h-4 w-4 text-muted" />
          </Link>
          <div className="flex items-center gap-1.5 text-sm text-muted">
            <Link href="/okrs" className="hover:text-foreground transition-colors">Ziele</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Neues OKR</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[1400px] mx-auto">
          <OKRFormFields
            currentQuarter={getCurrentQuarter()}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/okrs")}
            isLoading={isSubmitting}
            layout="page"
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create /okrs/[id]/edit page**

Create `src/app/(authenticated)/okrs/[id]/edit/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { OKRFormFields } from "@/components/okr/OKRFormFields";
import { useOKR } from "@/lib/queries";
import type { CreateOKRRequest } from "@/types";

export default function EditOKRPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading: isLoadingOKR } = useOKR(id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const okr = data?.okr;

  const handleSubmit = async (formData: CreateOKRRequest) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/okrs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("OKR aktualisiert");
        await queryClient.invalidateQueries({ queryKey: ["okrs"] });
        router.push("/okrs");
      } else {
        const error = await res.json();
        toast.error(error.error || "Fehler beim Speichern");
      }
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingOKR) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!okr) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-[14px] text-muted">OKR nicht gefunden</p>
        <Link href="/okrs" className="btn-primary text-[13px]">
          Zuruck zu Ziele
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-cream-300/50">
        <div className="h-14 flex items-center gap-3 px-6 max-w-[1400px] mx-auto">
          <Link href="/okrs" className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors">
            <ArrowLeft className="h-4 w-4 text-muted" />
          </Link>
          <div className="flex items-center gap-1.5 text-sm text-muted">
            <Link href="/okrs" className="hover:text-foreground transition-colors">Ziele</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Bearbeiten</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[1400px] mx-auto">
          <OKRFormFields
            initialData={okr}
            currentQuarter={okr.quarter}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/okrs")}
            isLoading={isSubmitting}
            layout="page"
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update OKRs page to use navigation**

In `src/app/(authenticated)/okrs/page.tsx`:

1. Add `useRouter` import:
```tsx
import { useRouter } from "next/navigation";
```

2. In `OKRsContent`, add:
```tsx
const router = useRouter();
```

3. Change `handleNewOKR` to:
```tsx
const handleNewOKR = () => {
  router.push("/okrs/new");
};
```

4. Change `handleEditOKR` to:
```tsx
const handleEditOKR = (okr: OKR) => {
  router.push(`/okrs/${okr.id}/edit`);
};
```

5. Remove `showForm`, `editingOKR` state variables and the `handleSubmitOKR` function.

6. Remove the `OKRForm` modal rendering at the bottom (the `{showForm && <OKRForm .../>}` block).

7. Remove the `OKRForm` import.

- [ ] **Step 4: Verify build**

Run: `cd /Users/burak/Downloads/okr-tracker && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: OKR creation/editing as full-page routes (/okrs/new, /okrs/[id]/edit)"
```

---

## Chunk 5: Learnings Hub Rebuild

### Task 8: Create CategoryTiles component

**Files:**
- Create: `src/components/learnings/CategoryTiles.tsx`

- [ ] **Step 1: Create CategoryTiles**

Create `src/components/learnings/CategoryTiles.tsx`:

```tsx
"use client";

import {
  Palette, Code, Megaphone, TrendingUp,
  Settings, Users, DollarSign, MoreHorizontal,
} from "lucide-react";
import type { CourseCategory } from "@/types";

const CATEGORIES: { key: CourseCategory; label: string; icon: typeof Palette }[] = [
  { key: "design", label: "Design", icon: Palette },
  { key: "development", label: "Development", icon: Code },
  { key: "marketing", label: "Marketing", icon: Megaphone },
  { key: "sales", label: "Sales", icon: TrendingUp },
  { key: "operations", label: "Operations", icon: Settings },
  { key: "hr", label: "HR", icon: Users },
  { key: "finance", label: "Finance", icon: DollarSign },
  { key: "other", label: "Sonstiges", icon: MoreHorizontal },
];

interface CategoryTilesProps {
  selected: CourseCategory | null;
  onSelect: (category: CourseCategory | null) => void;
}

export function CategoryTiles({ selected, onSelect }: CategoryTilesProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {CATEGORIES.map(({ key, label, icon: Icon }) => {
        const isActive = selected === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(isActive ? null : key)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
              isActive
                ? "bg-foreground text-white shadow-sm"
                : "bg-cream-50 text-muted hover:bg-cream-100"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/learnings/CategoryTiles.tsx && git commit -m "feat: add CategoryTiles component for learnings hub"
```

---

### Task 9: Rebuild Learnings page as scroll-based hub

**Files:**
- Rewrite: `src/app/(authenticated)/learnings/page.tsx`

- [ ] **Step 1: Rewrite the learnings page**

Replace the tab-based layout with a scroll-based hub page containing these sections:

1. **Page Header** — "Learning Hub" title + AI suggest + add course buttons (same as current)
2. **AI Suggestions Panel** — (same as current, keep all logic)
3. **"Dein Lernfortschritt" Section** — active enrollments in 2-3 column grid with course cards. Show count in header. Completed courses in a collapsible subsection. Empty state: "Noch keine Kurse — entdecke den Katalog unten."
4. **"Entdecken" Section** — `CategoryTiles` for filtering, search input, course grid (3 columns at 1400px). Each card shows enroll button.
5. **"Team Lernen" Section** — Only for managers. Collapsible, collapsed by default. Uses existing `TeamLearnings` component.

Key changes from current:
- Remove `Tabs` import and tab state
- Remove `LearningFilters` component usage (replaced by `CategoryTiles` + search)
- Keep all mutation logic (enroll, unenroll, suggest)
- Keep `CourseDetailModal` and `AddLearningForm` modal usage
- Import `CategoryTiles` from the new component
- Active enrollments and catalog are both visible on one page (no tabs)
- Add a search input above the catalog grid
- Completed enrollments: separate subsection with collapsible toggle

- [ ] **Step 2: Verify build**

Run: `cd /Users/burak/Downloads/okr-tracker && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/learnings/page.tsx && git commit -m "feat: rebuild learnings as scroll-based hub (no tabs)"
```

---

## Chunk 6: Settings Profile Center + Career Redirect

### Task 10: Rewrite Settings as tab-based profile center

**Files:**
- Rewrite: `src/app/(authenticated)/settings/page.tsx`

- [ ] **Step 1: Rewrite settings page**

Rewrite `src/app/(authenticated)/settings/page.tsx` with 3 tabs:

**Tab navigation** using the existing `Tabs` component with `variant="underline"`.

**Tab 1: "Profil"** (default)
- Large avatar with initials fallback
- Two-column form at wider widths:
  - Left column: Name, Email (read-only), Department, Position
  - Right column: Craft Focus (dropdown with 8 categories), Bio textarea (new), Skills/Interests tag input (new — simple comma-separated for MVP)
- Save button with change detection (same pattern as current)

**Tab 2: "Karriere"**
- Import existing career components:
  - `useCareerProgress`, `useRequirementCompletions` from `@/lib/queries`
  - `CareerLadder` from `@/components/career/CareerLadder`
  - `CAREER_PATHS`, `getCareerPath`, `getNextLevel` from `@/lib/career-paths`
- Render the same content as current `/career` page:
  - Level overview cards (bestaetigtes Level + naechster Schritt)
  - Progress to next level bar
  - OKR qualification
  - Career ladder
- Link to Profil tab to change craft focus

**Tab 3: "Konto"**
- Account info: Email, auth method, creation date (same as current bottom card)
- Status badge (Aktiv)
- Logout button (form action to `/auth/signout`)

URL-driven tab state: read `?tab=` from URL search params. Default to "profil". Support `?tab=karriere` and `?tab=konto`.

```tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
// ... imports

type SettingsTab = "profil" | "karriere" | "konto";

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as SettingsTab | null;
  const activeTab = ["profil", "karriere", "konto"].includes(tabParam!) ? tabParam! : "profil";

  const handleTabChange = (tab: SettingsTab) => {
    router.replace(`/settings?tab=${tab}`, { scroll: false });
  };
  // ... rest of implementation
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/burak/Downloads/okr-tracker && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/settings/page.tsx && git commit -m "feat: settings as tab-based profile center (Profil/Karriere/Konto)"
```

---

### Task 11: Replace career page with redirect

**Files:**
- Rewrite: `src/app/(authenticated)/career/page.tsx`

- [ ] **Step 1: Replace career page with redirect**

Replace the entire content of `src/app/(authenticated)/career/page.tsx` with a server-side redirect:

```tsx
import { redirect } from "next/navigation";

export default function CareerPage() {
  redirect("/settings?tab=karriere");
}
```

Remove the `"use client"` directive and all existing imports/logic.

- [ ] **Step 2: Verify build**

Run: `cd /Users/burak/Downloads/okr-tracker && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/career/page.tsx && git commit -m "feat: redirect /career to /settings?tab=karriere"
```

---

## Chunk 7: Final Verification

### Task 12: Full build verification and visual check

- [ ] **Step 1: Run TypeScript check**

Run: `cd /Users/burak/Downloads/okr-tracker && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run production build**

Run: `cd /Users/burak/Downloads/okr-tracker && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Start dev server and verify all pages**

Start the dev server and verify each page loads without console errors:
- `/dashboard` — greeting, quarter hero, inline check-ins (if overdue), learning progress, stats
- `/okrs` — list view, "OKR" button navigates to `/okrs/new`
- `/okrs/new` — full-page form with breadcrumb
- `/learnings` — scroll-based hub with progress section, catalog section, team section (if manager)
- `/settings` — 3 tabs (Profil, Karriere, Konto)
- `/settings?tab=karriere` — career content loads
- `/career` — redirects to `/settings?tab=karriere`
- `/review` — wider layout
- `/team` — wider layout
- Sidebar — grouped sections, bottom profile link

- [ ] **Step 4: Commit all remaining changes**

```bash
git add -A && git commit -m "feat: complete UX redesign — all 8 areas implemented"
```

---

## Verification Checklist

| Feature | Expected Behavior |
|---------|------------------|
| All pages | Content width = `max-w-[1400px]` |
| Sidebar | 3 groups (Hauptmenu/Einblicke/Verwaltung) + bottom profile link |
| Sidebar | "Karriere" removed, "Mein Quartal" label preserved |
| Sidebar | Verwaltung only visible for manager/admin/hr |
| Dashboard | Overdue OKRs show inline check-in cards |
| Dashboard | Expanding one card collapses others |
| Dashboard | Save shows spinner, success collapses card |
| Dashboard | No overdue = celebration empty state |
| OKR creation | `/okrs/new` full-page form |
| OKR editing | `/okrs/[id]/edit` full-page form with pre-populated data |
| OKR editing | Loading state while fetching, error state if not found |
| Learnings | Single scroll page (no tabs) |
| Learnings | Category tiles (8 categories, toggleable) |
| Learnings | Active courses section + catalog section |
| Learnings | Team section (managers only, collapsible) |
| Settings | 3 tabs: Profil / Karriere / Konto |
| Settings | URL-driven tabs (`?tab=karriere`) |
| `/career` | Redirects to `/settings?tab=karriere` |
| Categories | All use canonical 8: design, development, marketing, sales, operations, hr, finance, other |
| Old categories | Graceful fallback to "other" in UI |
| `npx tsc --noEmit` | 0 errors |
| `npm run build` | Succeeds |
