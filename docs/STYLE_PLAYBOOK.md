# Style Playbook -- OKR Tracker

> Source of truth extracted from the Password Manager (`passwort-manager`).
> Every value below is exact. Use these values verbatim so the OKR Tracker is
> pixel-identical to the Password Manager.

---

## 1. CSS Custom Properties (`:root` in `globals.css`)

```css
:root {
  --background: #f5f4f0;
  --foreground: #1a1a1a;
  --card-bg: #ffffff;
  --border-color: #e8e5e1;
  --text-muted: #7a7a7a;
  --accent-green: #22c55e;
  --cream-50: #faf9f7;
  --cream-100: #f7f6f3;
  --cream-200: #f5f4f0;
  --cream-300: #e8e5e1;
  --cream-400: #d4d1cd;
  --sidebar-bg: #faf9f7;
}
```

---

## 2. Tailwind Config Tokens (`tailwind.config.ts`)

### Colors

| Token               | Hex        | Usage                             |
|----------------------|------------|-----------------------------------|
| `background`         | `#f5f5f0`  | Page background                   |
| `foreground`         | `#1a1a1a`  | Primary text, active sidebar bg   |
| `cream-50`           | `#fafaf8`  | Table header bg                   |
| `cream-100`          | `#f8f8f5`  | Input bg, hover bg                |
| `cream-200`          | `#f5f5f0`  | Ghost hover, scope-toggle bg      |
| `cream-300`          | `#e8e8e3`  | Borders, dividers                 |
| `cream-400`          | `#d4d4cf`  | Scrollbar thumb, empty-state icon |
| `cream-500`          | `#b8b8b3`  | (available, not heavily used)     |
| `warm-50`            | `#faf9f7`  | Sidebar background                |
| `warm-100`           | `#f5f4f0`  | Warm surfaces                     |
| `warm-200`           | `#e5e0d5`  |                                   |
| `warm-300`           | `#d4cfc4`  |                                   |
| `warm-400`           | `#b8b3a8`  |                                   |
| `warm-500`           | `#9c9790`  |                                   |
| `accent-green`       | `#22c55e`  | Success, active checkbox          |
| `accent-greenLight`  | `#dcfce7`  | Success badge bg, scope indicator |
| `accent-greenDark`   | `#16a34a`  | Success hover, badge-green text   |
| `muted.DEFAULT`      | `#6b6b6b`  | Muted text                        |
| `muted.light`        | `#9a9a9a`  | Lighter muted text                |

### Box Shadows

| Token        | Value                            |
|--------------|----------------------------------|
| `sidebar`    | `4px 0 24px rgba(0, 0, 0, 0.04)` |
| `card`       | `0 2px 8px rgba(0, 0, 0, 0.04)`  |
| `cardHover`  | `0 4px 12px rgba(0, 0, 0, 0.08)` |

### Border Radius

| Token  | Value  |
|--------|--------|
| `xl`   | `12px` |
| `2xl`  | `16px` |
| `3xl`  | `20px` |

---

## 3. Typography

### Font Family

- **Google Font**: `Inter` with `subsets: ["latin"]`
- Applied via: `<body className={`${inter.className} antialiased ...`}>`

### Font Sizes (used throughout)

| Tailwind / CSS             | Pixel Equivalent | Where Used                                    |
|----------------------------|------------------|-----------------------------------------------|
| `text-[10px]`              | 10px             | Org subtitle, role display, scope toggle label |
| `text-[11px]`              | 11px             | Scope toggle buttons, email in dropdown, filter reset |
| `0.625rem` (section-header)| 10px             | Section headers (uppercase)                   |
| `0.6875rem` (badge)        | 11px             | Badge text                                    |
| `text-xs` / `0.75rem`      | 12px             | Table headers, scope indicator                |
| `text-[13px]` / `0.8125rem`| 13px             | **Primary UI text** -- buttons, inputs, sidebar items, dropdown items, search, profile name |
| `text-sm` / `0.875rem`     | 14px             | Org name in sidebar                           |
| `body font-size`           | 14px             | Base body font-size                           |
| `1rem`                     | 16px             | Empty state title                             |

### Font Weights

| Weight | Usage                                  |
|--------|----------------------------------------|
| 400    | Default body text                      |
| 500    | Buttons, sidebar-item active, badges, profile name, empty-state title |
| 600    | Section headers, org name (semibold)   |

### Line Height

- Body: `1.5`

### Letter Spacing

| Context        | Value      |
|----------------|------------|
| Section headers | `0.075em` |
| Table headers   | `0.025em` |
| Scope label     | `tracking-wider` (Tailwind default: `0.05em`) |

### Text Transform

- Section headers: `uppercase`
- Table headers: `uppercase`
- Scope toggle labels: `uppercase`

---

## 4. Layout Dimensions

### Core Layout

```
+------------------------------------------------------+
| Sidebar (w-52)  |  Main (flex-1 overflow-hidden)      |
| 208px           |                                      |
|                 |  Header (h-14 = 56px)                |
|                 |  ---------------------------------   |
|                 |  Content (flex-1 flex overflow-hidden)|
|                 |                                      |
|                 |    List (flex-1)  | Detail (w-[520px])|
+------------------------------------------------------+
```

| Element           | Class / Value                      | Pixels   |
|--------------------|------------------------------------|----------|
| Sidebar width      | `w-52`                            | 208px    |
| Header height      | `h-14`                            | 56px     |
| Detail panel width | `w-[520px]`                       | 520px    |
| Sidebar margin     | `margin: 1rem` (from `.sidebar-container`) | 16px all sides |
| Sidebar height     | `calc(100vh - 2rem)`              | viewport - 32px |
| Sidebar radius     | `border-radius: 1.25rem` (20px)   | 20px     |

### Outer Shell

```tsx
<div className="flex h-screen bg-background">
  <Sidebar ... />               {/* w-52 */}
  <main className="flex-1 overflow-hidden">
    {children}
  </main>
</div>
```

### Dashboard Page Inner Layout

```tsx
<div className="h-full flex flex-col">
  <Header ... />                 {/* h-14 border-b */}
  <div className="flex-1 flex overflow-hidden relative">
    <div className="flex-1 overflow-y-auto">   {/* List */}
      ...
    </div>
    <div className="absolute top-0 right-0 h-full w-[520px] ... z-20">
      {/* Detail panel - slides in/out */}
    </div>
    {/* Overlay for mobile: bg-black/5 z-10 lg:hidden */}
  </div>
</div>
```

---

## 5. Component Patterns

### 5.1 Sidebar Container (`.sidebar-container`)

```css
.sidebar-container {
  background-color: var(--sidebar-bg);       /* #faf9f7 */
  border-radius: 1.25rem;                    /* 20px */
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  margin: 1rem;                              /* 16px */
  height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

### 5.2 Sidebar Item (`.sidebar-item`)

```css
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;                /* 10px */
  padding: 0.625rem 0.875rem;  /* 10px 14px */
  font-size: 0.8125rem;        /* 13px */
  border-radius: 0.5rem;       /* 8px */
  color: var(--text-muted);    /* #7a7a7a */
  transition: all 0.15s ease;
  cursor: pointer;
}

.sidebar-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
  color: var(--foreground);
}

.sidebar-item.active {
  background-color: var(--foreground);  /* #1a1a1a */
  color: white;
  font-weight: 500;
}

.sidebar-item.active svg { color: white; }
.sidebar-item.active:hover { background-color: #333; color: white; }
```

### 5.3 FilterButton (client-side filter, no page navigation)

```tsx
function FilterButton({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`sidebar-item w-full ${active ? "active" : ""}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
```

### 5.4 NavItem (link-based navigation)

```tsx
function NavItem({ href, icon, label, active }: {
  href: string; icon: React.ReactNode; label: string; active: boolean;
}) {
  return (
    <Link href={href} className={`sidebar-item ${active ? "active" : ""}`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}
```

### 5.5 Scope Toggle (Team / Personal switcher)

```tsx
<div className="flex gap-0.5 p-0.5 bg-cream-200 rounded-lg">
  <Link
    href="/dashboard?scope=team"
    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all ${
      isActive
        ? "bg-white text-foreground shadow-sm"
        : "text-muted hover:text-foreground"
    }`}
  >
    <Icon className="h-3 w-3" />
    Label
  </Link>
</div>
```

### 5.6 Dropdown Overlay Pattern

Every dropdown uses a two-layer pattern:

```tsx
{showMenu && (
  <>
    {/* Invisible full-screen overlay to catch outside clicks */}
    <div
      className="fixed inset-0 z-10"
      onClick={() => setShowMenu(false)}
      onKeyDown={(e) => e.key === "Escape" && setShowMenu(false)}
    />
    {/* Dropdown menu */}
    <div className="dropdown-menu" role="menu">
      ...items...
    </div>
  </>
)}
```

### 5.7 Header

```tsx
<header className="h-14 flex items-center justify-between px-6 border-b border-cream-300/50">
  {/* Left: Scope indicator + Search */}
  {/* Right: Action buttons + Notifications + User menu */}
</header>
```

**Scope Indicator** in header:
```tsx
<div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
  isTeam
    ? "bg-accent-greenLight text-accent-green"
    : "bg-cream-200 text-muted"
}`}>
```

**Search input:**
```tsx
<input
  className="w-full py-2 pl-10 pr-4 bg-cream-100/50 border border-cream-300/50 rounded-lg text-[13px] text-foreground placeholder:text-muted focus:outline-none focus:border-cream-400"
/>
```

### 5.8 Detail Panel (slide-in from right)

```tsx
<div className={`absolute top-0 right-0 h-full w-[520px] bg-white border-l border-cream-300 shadow-lg transform transition-transform duration-300 ease-in-out z-20 ${
  isOpen ? "translate-x-0" : "translate-x-full"
}`}>
```

### 5.9 Modal Overlay

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background-color: white;
  border-radius: 1rem;         /* 16px */
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2);
  max-width: 28rem;            /* 448px */
  width: 100%;
  margin: 1rem;
  max-height: 90vh;
  overflow-y: auto;
}
```

---

## 6. Button Variants

All buttons share these base properties:

```css
display: inline-flex;
align-items: center;
justify-content: center;
gap: 0.5rem;            /* 8px */
padding: 0.5rem 1rem;   /* 8px 16px */
font-size: 0.8125rem;   /* 13px */
font-weight: 500;
border-radius: 0.5rem;  /* 8px */
transition: all 0.15s ease;
cursor: pointer;
```

| Variant       | Background           | Color           | Border                     | Hover BG           | Focus Ring          |
|---------------|----------------------|-----------------|----------------------------|--------------------|---------------------|
| `.btn-primary`  | `var(--foreground)` (#1a1a1a) | `white`  | none                       | `#333`             | `0 0 0 2px var(--cream-300)` |
| `.btn-secondary`| `white`             | `var(--foreground)` | `1px solid var(--cream-300)` | `var(--cream-100)` + border `var(--cream-400)` | `0 0 0 2px var(--cream-300)` |
| `.btn-danger`   | `#dc2626`           | `white`         | none                       | `#b91c1c`          | `0 0 0 2px #fecaca` |
| `.btn-ghost`    | `transparent`       | `var(--foreground)` | none                  | `var(--cream-200)` | `0 0 0 2px var(--cream-300)` |
| `.btn-success`  | `var(--accent-green)` (#22c55e) | `white` | none                  | `#16a34a`          | `0 0 0 2px #bbf7d0` |

All disabled states: `opacity: 0.5; cursor: not-allowed;`

Header buttons use additional overrides: `text-[13px] gap-1.5 py-1.5`

---

## 7. Icon System (lucide-react)

### Icon Sizes by Context

| Context                        | Size Class     | Pixels |
|--------------------------------|----------------|--------|
| Sidebar nav icons              | `h-4 w-4`     | 16x16  |
| Scope toggle icons             | `h-3 w-3`     | 12x12  |
| Header action icons            | `h-3.5 w-3.5` | 14x14  |
| Header search icon             | `h-4 w-4`     | 16x16  |
| Notification bell              | `h-4 w-4`     | 16x16  |
| Dropdown item icons            | `h-3.5 w-3.5` | 14x14  |
| Profile chevron                | `h-3.5 w-3.5` | 14x14  |
| Org placeholder icon           | `h-4 w-4`     | 16x16  |
| Empty state icon               | `w-12 h-12` (3rem) | 48x48 |
| Team checkbox checkmark        | `w-3 h-3`     | 12x12  |

### Icons Used (from lucide-react)

```
Key, CreditCard, FileText, Share2, Users, Settings, LayoutGrid,
ChevronDown, Building2, Lock, Star, LogOut, Trash2, EyeOff,
Search, Plus, Bell, Upload, User (as UserIcon)
```

---

## 8. Badge Variants

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;  /* 4px 8px */
  border-radius: 9999px;    /* fully rounded */
  font-size: 0.6875rem;     /* 11px */
  font-weight: 500;
}
```

| Variant        | Background       | Text Color    |
|----------------|------------------|---------------|
| `.badge-green`  | `#dcfce7`       | `#16a34a`     |
| `.badge-yellow` | `#fef9c3`       | `#a16207`     |
| `.badge-red`    | `#fee2e2`       | `#dc2626`     |
| `.badge-blue`   | `#dbeafe`       | `#2563eb`     |
| `.badge-gray`   | `var(--cream-200)` | `var(--text-muted)` |

### OKR Mapping Suggestion

| Badge      | OKR Usage                    |
|------------|------------------------------|
| badge-green | On Track / Completed        |
| badge-yellow| At Risk / In Progress       |
| badge-red   | Off Track / Behind          |
| badge-blue  | New / Not Started           |
| badge-gray  | Draft / Archived            |

---

## 9. Input Styles

```css
.input {
  width: 100%;
  padding: 0.5rem 0.75rem;        /* 8px 12px */
  background-color: var(--cream-100);
  border: 1px solid var(--cream-300);
  border-radius: 0.5rem;           /* 8px */
  font-size: 0.8125rem;            /* 13px */
  color: var(--foreground);
  transition: all 0.15s ease;
}

.input::placeholder { color: #a0a0a0; }

.input:focus {
  outline: none;
  border-color: var(--cream-400);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.04);
}
```

---

## 10. Card Styles

```css
.card {
  background-color: white;
  border-radius: 1rem;             /* 16px */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--cream-300);
}

.card-hover {
  transition: box-shadow 0.15s ease;
}

.card-hover:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}
```

---

## 11. Table Styles

```css
.table { width: 100%; font-size: 0.8125rem; }

.table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 500;
  color: var(--text-muted);
  background-color: var(--cream-50);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.table td {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--cream-300);
}
```

---

## 12. Dropdown Menu

```css
.dropdown-menu {
  position: absolute;
  right: 0;
  margin-top: 0.5rem;
  width: 12rem;                     /* 192px */
  background-color: white;
  border-radius: 0.75rem;           /* 12px */
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--cream-300);
  padding: 0.25rem;
  z-index: 50;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;             /* 13px */
  color: var(--foreground);
  border-radius: 0.375rem;          /* 6px */
  transition: background-color 0.15s ease;
  cursor: pointer;
}

.dropdown-item:hover { background-color: var(--cream-100); }

.dropdown-item-danger {
  /* Same as .dropdown-item but: */
  color: #dc2626;
}
.dropdown-item-danger:hover { background-color: #fef2f2; }
```

---

## 13. Section Headers

```css
.section-header {
  font-size: 0.625rem;        /* 10px */
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.075em;
  padding: 1rem 0.875rem 0.5rem;
}
```

---

## 14. Empty State

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  text-align: center;
}

.empty-state-icon   { width: 3rem; height: 3rem; color: var(--cream-400); margin-bottom: 1rem; }
.empty-state-title  { font-size: 1rem; font-weight: 500; color: var(--foreground); margin-bottom: 0.375rem; }
.empty-state-description { font-size: 0.8125rem; color: var(--text-muted); }
```

---

## 15. Scrollbar

```css
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track  { background: transparent; }
::-webkit-scrollbar-thumb  { background: #d4d1cd; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #b8b5b1; }
```

---

## 16. Skeleton Loading Animation

```css
@keyframes skeleton-wave {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-wave {
  background: linear-gradient(90deg,
    #d4d1cd 0%, #c8c5c1 20%, #bfbcb8 40%,
    #c8c5c1 60%, #d4d1cd 80%, #d4d1cd 100%);
  background-size: 200% 100%;
  animation: skeleton-wave 1.5s ease-in-out infinite;
}
```

---

## 17. Toast (Sonner) Configuration

```tsx
<Toaster
  position="top-right"
  richColors
  closeButton
  duration={3000}
  toastOptions={{
    style: {
      borderRadius: '12px',
      fontSize: '13px',
    },
  }}
/>
```

---

## 18. Transition Timing

All interactive elements use: `transition: all 0.15s ease;`

Detail panel slide: `transition-transform duration-300 ease-in-out`

ChevronDown rotation: `transition-transform` with `rotate-180` when open.

---

## 19. Spacing Conventions

| Context                        | Value             |
|--------------------------------|-------------------|
| Sidebar internal padding       | `px-4 py-5` (logo area), `px-3 py-1` (nav), `px-3 py-2` (footer) |
| Header horizontal padding      | `px-6`           |
| Sidebar item gap               | `space-y-0.5` (2px between items) |
| Button gap (icon + text)       | `gap-2` (Tailwind) or `gap: 0.5rem` (CSS) |
| Section header padding         | `1rem 0.875rem 0.5rem` |
| Profile button padding         | `p-2` inner, `p-3` outer container |
| Card border-radius             | `1rem` (16px)    |
| Sidebar border-radius          | `1.25rem` (20px) |
| Modal border-radius            | `1rem` (16px)    |
| Dropdown border-radius         | `0.75rem` (12px) |
| Button / Input border-radius   | `0.5rem` (8px)   |
| Badge border-radius            | `9999px` (pill)  |
| Dropdown item border-radius    | `0.375rem` (6px) |

---

## 20. Z-Index Scale

| Layer                  | z-index |
|------------------------|---------|
| Dropdown overlay       | `z-10`  |
| Detail panel           | `z-20`  |
| Modal overlay          | `z-50`  |
| Dropdown menu          | `z-50`  |
| Profile menu (sidebar) | `z-50`  |

---

## 21. Color Palette Summary (All Hex Values)

### Neutrals
| Name         | Hex       |
|--------------|-----------|
| Foreground   | `#1a1a1a` |
| Hover dark   | `#333333` |
| Muted        | `#7a7a7a` / `#6b6b6b` (Tailwind) |
| Muted light  | `#9a9a9a` |
| Placeholder  | `#a0a0a0` |
| Cream-50     | `#faf9f7` / `#fafaf8` (Tailwind) |
| Cream-100    | `#f7f6f3` / `#f8f8f5` (Tailwind) |
| Cream-200    | `#f5f4f0` / `#f5f5f0` (Tailwind) |
| Cream-300    | `#e8e5e1` / `#e8e8e3` (Tailwind) |
| Cream-400    | `#d4d1cd` / `#d4d4cf` (Tailwind) |
| Scrollbar hover | `#b8b5b1` |
| White        | `#ffffff` |

### Semantic
| Name              | Hex        |
|-------------------|------------|
| Accent Green      | `#22c55e`  |
| Green Dark        | `#16a34a`  |
| Green Light BG    | `#dcfce7`  |
| Green Focus Ring  | `#bbf7d0`  |
| Danger            | `#dc2626`  |
| Danger Dark       | `#b91c1c`  |
| Danger Light BG   | `#fee2e2`  |
| Danger Focus Ring | `#fecaca`  |
| Danger Hover BG   | `#fef2f2`  |
| Yellow BG         | `#fef9c3`  |
| Yellow Text       | `#a16207`  |
| Blue BG           | `#dbeafe`  |
| Blue Text         | `#2563eb`  |

---

## 22. User Avatar Pattern

### In Sidebar (32x32)
```tsx
{user.avatar_url ? (
  <img src={user.avatar_url} alt={user.name}
    className="w-8 h-8 rounded-full object-cover"
    referrerPolicy="no-referrer" />
) : (
  <div className="w-8 h-8 rounded-full bg-cream-300 flex items-center justify-center">
    <span className="text-[11px] font-medium text-foreground">{initials}</span>
  </div>
)}
```

### In Header (28x28)
```tsx
{user.avatar_url ? (
  <img src={user.avatar_url} alt={user.name}
    className="w-7 h-7 rounded-full object-cover"
    referrerPolicy="no-referrer" />
) : (
  <div className="w-7 h-7 rounded-full bg-cream-300 flex items-center justify-center">
    <span className="text-xs font-medium text-foreground">
      {user.name.charAt(0).toUpperCase()}
    </span>
  </div>
)}
```

---

## 23. Org Logo / Branding Pattern

### In Sidebar
```tsx
{orgLogo ? (
  <img src={orgLogo} alt="Org" className="w-8 h-8 rounded-lg object-cover" />
) : (
  <div className="w-8 h-8 bg-cream-200 rounded-lg flex items-center justify-center border border-cream-300">
    <Building2 className="h-4 w-4 text-muted" />
  </div>
)}
```

---

## 24. Loading / Suspense Patterns

### Page-level spinner
```tsx
<div className="h-full flex items-center justify-center bg-background">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
</div>
```

### Sidebar skeleton
```tsx
<aside className="sidebar-container w-52">
  <div className="px-4 py-5">
    <div className="animate-pulse h-8 bg-cream-200 rounded" />
  </div>
</aside>
```

### List skeleton
Uses `<VaultListSkeleton count={8} />` with the `.skeleton-wave` animation class.

---

## 25. Border Conventions

| Pattern                         | Value                          |
|---------------------------------|--------------------------------|
| Standard border                 | `border-cream-300` or `1px solid var(--cream-300)` |
| Subtle / semi-transparent       | `border-cream-300/50`          |
| Section divider in sidebar      | `border-t border-cream-300/50` |
| Header bottom border            | `border-b border-cream-300/50` |
| Detail panel left border        | `border-l border-cream-300`    |
| Dropdown internal divider       | `border-t border-cream-300/50 my-0.5` |
| Table cell top border           | `border-top: 1px solid var(--cream-300)` |
