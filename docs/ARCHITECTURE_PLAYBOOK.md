# Architecture Playbook -- OKR Tracker

> Extracted from the Password Manager (`passwort-manager`).
> Every pattern, file path, and code structure below is exact.
> Other agents must follow these patterns so the OKR Tracker
> maintains architectural parity with the Password Manager.

---

## 1. Directory Structure Mapping

### Password Manager Structure

```
src/
  app/
    layout.tsx                    # Root layout (font, providers, toaster)
    globals.css                   # CSS custom properties + utility classes
    page.tsx                      # Landing / redirect
    dashboard/
      layout.tsx                  # Server layout (auth check, data prefetch)
      page.tsx                    # Client page (main UI)
      settings/
        page.tsx
      team/
        ...
    admin/
      layout.tsx
      organisation/
        page.tsx
      trash/
        page.tsx
    auth/
      login/
      ...
    api/
      auth/
        me/route.ts
        logout/route.ts
        register/route.ts
        sessions/route.ts
        sessions/[id]/route.ts
      vault/
        route.ts                  # GET (list), POST (create)
        [id]/route.ts             # PATCH (update), DELETE
        [id]/copy/route.ts
        [id]/share/route.ts
        [id]/transfer/route.ts
        import/route.ts
      teams/route.ts
      users/route.ts
      audit/route.ts
      whitelist/route.ts
      org/route.ts
  components/
    layout/
      Sidebar.tsx
      Header.tsx
      DashboardClientWrapper.tsx
    vault/                        # Domain-specific components
      VaultItemList.tsx
      VaultItemDetail.tsx
      VaultItemForm.tsx
      BulkImportModal.tsx
      ExternalShareModal.tsx
      VaultCryptoContext.tsx
    ui/                           # Shared UI primitives
      ConfirmDialog.tsx
      Skeleton.tsx
    DataPreloader.tsx
  hooks/
    useRealtimeQuery.ts
  lib/
    queries.ts                    # React Query hooks
    audit.ts                      # Audit logging helpers
    encryption.ts                 # Encryption utilities
    supabase/
      client.ts                   # Browser client
      server.ts                   # Server client + service client
      middleware.ts               # Session refresh middleware
  providers/
    QueryProvider.tsx              # React Query provider
  types/
    index.ts                      # All TypeScript types
  middleware.ts                   # Next.js middleware (delegates to supabase/middleware)
tailwind.config.ts
```

### OKR Tracker Equivalent

```
src/
  app/
    layout.tsx                    # Root layout (Inter font, QueryProvider, Toaster)
    globals.css                   # SAME CSS custom properties + utility classes
    page.tsx                      # Landing / redirect
    dashboard/
      layout.tsx                  # Server layout (auth, prefetch objectives/key-results)
      page.tsx                    # Client page (OKR board UI)
      settings/
        page.tsx
    admin/
      layout.tsx
      organisation/
        page.tsx
    auth/
      login/
      ...
    api/
      auth/
        me/route.ts
        logout/route.ts
        register/route.ts
      objectives/
        route.ts                  # GET (list), POST (create)
        [id]/route.ts             # PATCH, DELETE
      key-results/
        route.ts
        [id]/route.ts
        [id]/checkin/route.ts     # POST check-in
      teams/route.ts
      users/route.ts
      audit/route.ts
      cycles/route.ts             # OKR cycles / periods
  components/
    layout/
      Sidebar.tsx                 # SAME visual pattern, different nav items
      Header.tsx                  # SAME visual pattern
      DashboardClientWrapper.tsx  # SAME context pattern
    okr/                          # Domain-specific (replaces vault/)
      ObjectiveList.tsx
      ObjectiveDetail.tsx
      ObjectiveForm.tsx
      KeyResultCard.tsx
      CheckInModal.tsx
      ProgressBar.tsx
    ui/                           # SAME shared UI primitives
      ConfirmDialog.tsx
      Skeleton.tsx
    DataPreloader.tsx
  hooks/
    useRealtimeQuery.ts           # SAME pattern
  lib/
    queries.ts                    # SAME pattern, different entities
    audit.ts                      # SAME pattern
    supabase/
      client.ts                   # IDENTICAL
      server.ts                   # IDENTICAL
      middleware.ts               # IDENTICAL
  providers/
    QueryProvider.tsx              # IDENTICAL
  types/
    index.ts                      # OKR-specific types
  middleware.ts                   # IDENTICAL
tailwind.config.ts                # IDENTICAL
```

---

## 2. Root Layout Pattern (`src/app/layout.tsx`)

The root layout establishes the provider hierarchy and global configuration.

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OKR Tracker",
  description: "OKR Tracking for Teams",
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  robots: { index: false, follow: false,
    googleBot: { index: false, follow: false } },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-background`}
        suppressHydrationWarning>
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={3000}
            toastOptions={{
              style: { borderRadius: '12px', fontSize: '13px' },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
```

**Key rules:**
- `Inter` font, latin subset
- `suppressHydrationWarning` on both `<html>` and `<body>`
- Provider order: `QueryProvider` wraps everything
- Toaster config: `top-right`, `richColors`, `closeButton`, `3000ms`, `12px` radius, `13px` font

---

## 3. Server Layout -> Client Wrapper -> React Query Flow

This is the most critical architectural pattern. The flow is:

```
Server Component (layout.tsx)
  |-- Auth check (redirect if not authenticated)
  |-- Parallel data fetching (Supabase server client)
  |-- Renders <DashboardClientWrapper> with server data as props
        |-- Creates React Context for shared state
        |-- Renders <Sidebar> (receives context + server data)
        |-- Renders <main>{children}</main>
              |-- children = page.tsx (client component)
              |-- page.tsx uses React Query hooks for client data
              |-- page.tsx uses Realtime subscriptions
```

### Server Layout (`dashboard/layout.tsx`)

```tsx
// This is a SERVER component (no "use client")
export default async function DashboardLayout({ children }) {
  // 1. Create Supabase server client
  const supabase = await createClient();

  // 2. Auth check
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/auth/login");

  // 3. Load user from DB + status check
  const { data: user } = await supabase
    .from("users").select("*").eq("id", authUser.id).single();
  if (!user) redirect("/auth/login");
  if (user.status !== "active") redirect("/auth/login?error=suspended");

  // 4. Parallel data fetching
  const serviceClient = await createServiceClient();
  const [foldersResult, teamMembershipsResult, logoResult] = await Promise.all([
    supabase.from("folders").select("*").eq("owner_id", user.id).order("name"),
    supabase.from("team_members").select("team_id").eq("user_id", user.id),
    serviceClient.storage.from("logos").list("", { limit: 10, ... }),
  ]);

  // 5. Dependent query (teams need membership IDs)
  const teamIds = teamMembershipsResult.data?.map(m => m.team_id) || [];
  let teams = [];
  if (teamIds.length > 0) {
    const { data } = await supabase
      .from("teams").select("*").in("id", teamIds).order("name");
    teams = data || [];
  }

  // 6. Render client wrapper with server data
  return (
    <>
      <DataPreloader />
      <DashboardClientWrapper
        user={user}
        folders={folders || []}
        teams={teams}
        orgLogo={orgLogo}
      >
        {children}
      </DashboardClientWrapper>
    </>
  );
}
```

**OKR equivalent**: Replace `folders` with `cycles` (OKR time periods), keep `teams` and `user` the same.

---

## 4. DashboardClientWrapper -> Context -> Sidebar + Main Pattern

```tsx
"use client";

import { useState, createContext, useContext, type ReactNode } from "react";
import { Sidebar, type FilterType } from "./Sidebar";

// 1. Define context type
interface DashboardContextType {
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  teams: Team[];
  selectedTeamIds: string[];
  setSelectedTeamIds: (ids: string[]) => void;
  toggleTeamFilter: (teamId: string) => void;
}

// 2. Create context
const DashboardContext = createContext<DashboardContextType | null>(null);

// 3. Export consumer hook with error boundary
export function useDashboardFilter() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardFilter must be used within DashboardClientWrapper");
  }
  return context;
}

// 4. Provider component
export function DashboardClientWrapper({
  user, folders, teams, orgLogo, children,
}: DashboardClientWrapperProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  const toggleTeamFilter = (teamId: string) => {
    if (teamId === "") {
      setSelectedTeamIds([]);              // Reset all
    } else {
      setSelectedTeamIds(prev =>
        prev.includes(teamId)
          ? prev.filter(id => id !== teamId)
          : [...prev, teamId]
      );
    }
  };

  return (
    <DashboardContext.Provider value={{
      activeFilter, setActiveFilter,
      teams, selectedTeamIds, setSelectedTeamIds, toggleTeamFilter,
    }}>
      <div className="flex h-screen bg-background">
        <Sidebar
          user={user}
          folders={folders}
          teams={teams}
          orgLogo={orgLogo}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          selectedTeamIds={selectedTeamIds}
          onTeamToggle={toggleTeamFilter}
        />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </DashboardContext.Provider>
  );
}
```

**Key rules:**
- Context is created INSIDE the client wrapper, not at root
- Sidebar receives BOTH server data (user, teams) and client state (activeFilter)
- The `<main>` receives page components as `{children}`
- Layout classes: `flex h-screen bg-background`

**OKR mapping**: Change `FilterType` to OKR filter types (e.g., `"all" | "my-okrs" | "team-okrs" | "completed" | "at-risk"`). Keep the same toggle and context patterns.

---

## 5. Client Page Pattern (`dashboard/page.tsx`)

```tsx
"use client";

// 1. Wrap in Suspense at top level
export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardContent />
    </Suspense>
  );
}

// 2. Inner component uses hooks
function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeFilter, teams, selectedTeamIds } = useDashboardFilter();

  // 3. React Query for data
  const { data: vaultData, isLoading } = useVaultItems(currentScope);
  const { data: userData } = useCurrentUser();

  // 4. Realtime subscription
  useVaultItemsRealtime();

  // 5. Client-side filtering with useMemo
  const filteredItems = useMemo(() => {
    let result = items;
    // ...filter logic...
    return result;
  }, [items, activeFilter, searchQuery, selectedTeamIds, currentScope]);

  // 6. Optimistic update helpers
  const optimisticAddItem = (newItem) => {
    queryClient.setQueryData(["vaultItems", currentScope], (old) => ({
      items: [newItem, ...(old?.items || [])],
    }));
  };

  // 7. Render: Header + List + Detail panel
  return (
    <div className="h-full flex flex-col">
      <Header ... />
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-y-auto">{/* List */}</div>
        <div className="absolute ... w-[520px] ... z-20">{/* Detail */}</div>
      </div>
      {/* Modals rendered conditionally */}
    </div>
  );
}
```

---

## 6. API Route Pattern

Every API route follows this exact structure:

```tsx
import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { logSomeAction } from "@/lib/audit";

export async function GET(request: NextRequest) {
  // 1. Create Supabase client (respects RLS)
  const supabase = await createClient();

  // 2. Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const filter = searchParams.get("filter");

  // 4. Database query
  let query = supabase.from("table").select("*").eq("owner_id", user.id);
  // Apply filters...
  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 5. Return JSON response
  return NextResponse.json({ items: data });
}

export async function POST(request: NextRequest) {
  // 1-2. Same auth pattern
  const supabase = await createClient();
  const serviceClient = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Parse body
  const body = await request.json();

  // 4. Validate
  if (!body.name) {
    return NextResponse.json(
      { error: "Name is required" }, { status: 400 }
    );
  }

  // 5. Insert using service client (bypasses RLS when needed)
  const { data: item, error } = await serviceClient
    .from("table")
    .insert({ ... })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 6. Audit log (non-blocking, errors are logged but don't fail the request)
  await logSomeAction(user.id, item.id, body.name);

  // 7. Return created item
  return NextResponse.json({ item }, { status: 201 });
}
```

**Key rules:**
- `createClient()` for user-scoped queries (respects RLS)
- `createServiceClient()` when you need to bypass RLS (cross-user reads, admin ops)
- Auth check is ALWAYS first
- Validation returns 400
- DB errors return 500
- Audit logging never throws (errors are console.error'd)
- POST returns 201 with the created entity
- Response shape: `{ items: [] }` for lists, `{ item: {} }` for singles

---

## 7. React Query Hook Patterns (`src/lib/queries.ts`)

### Query Hook (read)

```tsx
export function useObjectives(cycleId?: string) {
  return useQuery<{ objectives: Objective[] }>({
    queryKey: ["objectives", cycleId],
    queryFn: async () => {
      const res = await fetch(`/api/objectives?cycle=${cycleId}`);
      if (!res.ok) throw new Error("Failed to load objectives");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,  // 2 minutes
  });
}
```

### Query Key Conventions

| Entity       | PW-Manager Key             | OKR Equivalent Key          |
|--------------|----------------------------|-----------------------------|
| Main items   | `["vaultItems", scope]`    | `["objectives", cycleId]`   |
| Teams        | `["teams"]`                | `["teams"]`                 |
| Current user | `["currentUser"]`          | `["currentUser"]`           |
| Users (admin)| `["users"]`                | `["users"]`                 |
| Key Results  | n/a                        | `["keyResults", objectiveId]` |
| Cycles       | n/a                        | `["cycles"]`                |

### Mutation Hook

```tsx
export function useCreateObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateObjectiveRequest) => {
      const res = await fetch("/api/objectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
    },
  });
}
```

### Prefetch Pattern

```tsx
export function usePrefetchData() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.prefetchQuery({
      queryKey: ["objectives", "current"],
      queryFn: () => fetch("/api/objectives?cycle=current").then(r => r.json()),
    });
    queryClient.prefetchQuery({
      queryKey: ["teams"],
      queryFn: () => fetch("/api/teams").then(r => r.json()),
    });
    queryClient.prefetchQuery({
      queryKey: ["currentUser"],
      queryFn: () => fetch("/api/auth/me").then(r => r.json()),
    });
  };
}
```

---

## 8. QueryProvider Pattern (`src/providers/QueryProvider.tsx`)

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000,       // 5 minutes
          gcTime: 10 * 60 * 1000,          // 10 minutes (formerly cacheTime)
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Key settings:**
- `staleTime`: 5 min default (individual hooks can override, e.g., 2 min for vault items)
- `gcTime`: 10 min
- `refetchOnWindowFocus`: false
- `retry`: 1
- QueryClient is created inside `useState` to avoid re-creation on re-renders

---

## 9. Supabase Client Pattern

### Three Client Types

| Client           | File                    | Purpose                             | RLS   |
|------------------|-------------------------|--------------------------------------|-------|
| Browser          | `supabase/client.ts`    | Client components, realtime          | Yes   |
| Server           | `supabase/server.ts` `createClient()` | Server components, API routes (user-scoped) | Yes   |
| Service          | `supabase/server.ts` `createServiceClient()` | API routes (admin/cross-user ops) | **No (bypasses RLS)** |

### Browser Client (`supabase/client.ts`)

```tsx
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server Client (`supabase/server.ts`)

```tsx
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const enhancedOptions = {
                ...options,
                maxAge: 60 * 60 * 24 * 7,    // 7 days
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
              };
              cookieStore.set(name, value, enhancedOptions);
            });
          } catch { /* ignored in Server Components */ }
        },
      },
    }
  );
}
```

### Service Client (bypasses RLS)

```tsx
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

### Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 10. Realtime Subscription Pattern (`src/hooks/useRealtimeQuery.ts`)

### Generic Invalidation Hook

```tsx
export function useRealtimeQueryInvalidation(
  table: string,
  queryKeys: string[][],
  options?: { schema?: string; filter?: string; enabled?: boolean }
) {
  const queryClient = useQueryClient();
  const supabase = createClient();   // Browser client
  const { schema = "public", filter, enabled = true } = options || {};

  const invalidateQueries = useCallback(() => {
    queryKeys.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    });
  }, [queryClient, queryKeys]);

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime-invalidate:${schema}:${table}${filter ? `:${filter}` : ""}`;

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", {
        event: "*",
        schema,
        table,
        ...(filter ? { filter } : {}),
      }, () => {
        invalidateQueries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, table, schema, filter, enabled, invalidateQueries]);
}
```

### Domain-Specific Convenience Hooks

```tsx
// For OKR Tracker:
export function useObjectivesRealtime(enabled = true) {
  useRealtimeQueryInvalidation("objectives", [["objectives"]], { enabled });
  useRealtimeQueryInvalidation("key_results", [["objectives"], ["keyResults"]], { enabled });
}

export function useAdminRealtime(enabled = true) {
  useRealtimeQueryInvalidation("users", [["users"]], { enabled });
  useRealtimeQueryInvalidation("teams", [["teams"]], { enabled });
}
```

**Key rules:**
- Uses the BROWSER Supabase client (not server)
- Listens to `event: "*"` (INSERT, UPDATE, DELETE)
- On any change, invalidates React Query cache (triggers refetch)
- Returns cleanup function that removes the channel
- Channel names are namespaced: `realtime-invalidate:public:tablename`

---

## 11. Optimistic Update Pattern

The Password Manager uses manual optimistic updates (not React Query's `onMutate`).

### Pattern

```tsx
// 1. Define helpers that directly mutate the query cache
const optimisticAddItem = (newItem: DecryptedItem) => {
  queryClient.setQueryData<{ items: DecryptedItem[] }>(
    ["items", scope],
    (old) => ({ items: [newItem, ...(old?.items || [])] })
  );
};

const optimisticRemoveItem = (itemId: string) => {
  queryClient.setQueryData<{ items: DecryptedItem[] }>(
    ["items", scope],
    (old) => ({ items: (old?.items || []).filter(item => item.id !== itemId) })
  );
};

const optimisticUpdateItem = (updatedItem: DecryptedItem) => {
  queryClient.setQueryData<{ items: DecryptedItem[] }>(
    ["items", scope],
    (old) => ({
      items: (old?.items || []).map(item =>
        item.id === updatedItem.id ? updatedItem : item
      ),
    })
  );
};

// 2. Usage in handler
const handleToggleFavorite = async (item) => {
  // Immediate UI update
  const updatedItem = { ...item, is_favorite: !item.is_favorite };
  optimisticUpdateItem(updatedItem);
  toast.success("Updated");

  try {
    const res = await fetch(`/api/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: !item.is_favorite }),
    });

    if (!res.ok) {
      // REVERT on error
      optimisticUpdateItem(item);
      toast.error("Update failed");
    } else {
      // Background sync
      invalidateQueries();
    }
  } catch {
    // REVERT on error
    optimisticUpdateItem(item);
    toast.error("Update failed");
  }
};
```

### Invalidation Helper

```tsx
const invalidateItems = async () => {
  await queryClient.invalidateQueries({
    queryKey: ["items"],
    refetchType: 'all',
  });
};
```

**Key rules:**
1. Update UI immediately via `queryClient.setQueryData`
2. Make API call
3. On success: background sync via `invalidateQueries`
4. On failure: REVERT the optimistic update, show error toast
5. Also update local component state if needed (`setSelectedItem`)

---

## 12. Audit Logging Pattern (`src/lib/audit.ts`)

### Core Function

```tsx
import { createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

interface AuditLogParams {
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

export async function createAuditLog({
  userId, action, resourceType, resourceId, details = {},
}: AuditLogParams): Promise<void> {
  const supabase = await createServiceClient();
  const headersList = await headers();

  const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]
    || headersList.get("x-real-ip") || "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";

  const { error } = await supabase.from("audit_logs").insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId || null,
    details,
    ip_address: ipAddress,
    user_agent: userAgent,
    geo_location: null,
  });

  if (error) {
    console.error("Failed to create audit log:", error);
    // Never throw -- audit logging is non-critical
  }
}
```

### Convenience Functions (OKR equivalents)

```tsx
export async function logObjectiveCreate(
  userId: string, objectiveId: string, title: string
): Promise<void> {
  await createAuditLog({
    userId,
    action: "create",
    resourceType: "objective",
    resourceId: objectiveId,
    details: { title },
  });
}

export async function logKeyResultUpdate(
  userId: string, krId: string, title: string, changedFields: string[]
): Promise<void> {
  await createAuditLog({
    userId,
    action: "update",
    resourceType: "key_result",
    resourceId: krId,
    details: { title, changed_fields: changedFields },
  });
}

export async function logCheckIn(
  userId: string, krId: string, value: number, previousValue: number
): Promise<void> {
  await createAuditLog({
    userId,
    action: "update",
    resourceType: "check_in",
    resourceId: krId,
    details: { value, previous_value: previousValue },
  });
}
```

### OKR Audit Action Types

```tsx
export type AuditAction =
  | "login"
  | "logout"
  | "view"
  | "create"
  | "update"
  | "delete"
  | "check_in"
  | "assign"
  | "unassign"
  | "close_cycle";
```

**Key rules:**
- Always uses `createServiceClient()` (bypasses RLS)
- Collects IP from `x-forwarded-for` or `x-real-ip` headers
- Collects user agent from headers
- NEVER throws errors -- logs to console.error only
- Called in API routes AFTER the main operation succeeds

---

## 13. Middleware Pattern (`src/middleware.ts`)

### Entry Point

```tsx
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### Session Update Logic (`supabase/middleware.ts`)

The middleware handles:

1. **Session refresh**: Creates a Supabase server client that reads/writes cookies on every request, keeping the session alive.

2. **Protected route redirect**: Defines protected paths and redirects to `/auth/login?redirect=...` if no user.

3. **Suspended user block**: For API routes, checks user status in DB and returns 403 if not active.

4. **Auth page redirect**: Redirects authenticated users away from `/auth/*` and `/` to `/dashboard`.

### Protected Paths (OKR equivalent)

```tsx
const protectedPaths = [
  "/dashboard",
  "/admin",
  "/api/objectives",
  "/api/key-results",
  "/api/cycles",
  "/api/audit",
  "/api/users",
  "/api/teams",
];
```

### Cookie Configuration

```tsx
const enhancedOptions = {
  ...options,
  maxAge: 60 * 60 * 24 * 7,    // 7 days in seconds
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};
```

---

## 14. TypeScript Types Pattern (`src/types/index.ts`)

### Structure Convention

Types are organized in this order:
1. Union/enum types (roles, statuses, categories)
2. Database entity interfaces
3. Nested data interfaces
4. Union data types
5. API request/response types
6. Filter types

### OKR Types

```tsx
// Roles & Status
export type UserRole = "super_admin" | "admin" | "member";
export type UserStatus = "active" | "suspended" | "offboarded";

// OKR-specific enums
export type ObjectiveStatus = "draft" | "active" | "completed" | "cancelled";
export type KeyResultType = "number" | "percentage" | "currency" | "boolean";
export type ConfidenceLevel = "on_track" | "at_risk" | "off_track";
export type CycleStatus = "planning" | "active" | "closed";

// Audit
export type AuditAction =
  | "login" | "logout" | "view" | "create"
  | "update" | "delete" | "check_in"
  | "assign" | "unassign" | "close_cycle";

// Database entities
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Cycle {
  id: string;
  name: string;              // e.g., "Q1 2026"
  start_date: string;
  end_date: string;
  status: CycleStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Objective {
  id: string;
  title: string;
  description: string | null;
  cycle_id: string;
  owner_id: string;
  team_id: string | null;
  status: ObjectiveStatus;
  progress: number;           // 0-100, computed from key results
  created_at: string;
  updated_at: string;
}

export interface KeyResult {
  id: string;
  objective_id: string;
  title: string;
  description: string | null;
  type: KeyResultType;
  start_value: number;
  target_value: number;
  current_value: number;
  unit: string | null;        // e.g., "%", "users", "$"
  confidence: ConfidenceLevel;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  key_result_id: string;
  value: number;
  note: string | null;
  created_by: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: AuditAction;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  geo_location: string | null;
  created_at: string;
  user?: Pick<User, "name" | "email" | "avatar_url">;
}

// API types
export interface CreateObjectiveRequest {
  title: string;
  description?: string;
  cycle_id: string;
  team_id?: string;
}

export interface UpdateObjectiveRequest {
  title?: string;
  description?: string;
  status?: ObjectiveStatus;
}

export interface CreateKeyResultRequest {
  objective_id: string;
  title: string;
  type: KeyResultType;
  start_value: number;
  target_value: number;
  unit?: string;
}

export interface CheckInRequest {
  value: number;
  note?: string;
}
```

---

## 15. Key Architectural Rules Summary

1. **Server Components for auth + data prefetch, Client Components for interactivity.**
   Never mix -- the boundary is the `"use client"` directive.

2. **Provider hierarchy**: `QueryProvider > (domain-specific providers) > DashboardClientWrapper > Sidebar + Page`

3. **Data flow**: Server layout fetches initial data -> passes as props to client wrapper -> client wrapper creates context -> pages use React Query hooks for reactive data.

4. **API routes always**: auth check first, validate, operate, audit log, respond.

5. **Supabase client selection**:
   - Browser client: client components + realtime
   - Server client: server components + API routes (user-scoped)
   - Service client: API routes needing cross-user access

6. **Realtime**: Subscribe to postgres_changes, invalidate React Query cache on any change. Never manually update cache from realtime payloads.

7. **Optimistic updates**: Update cache immediately, revert on failure, background-sync on success.

8. **Toast notifications**: Use `sonner` with `toast.success()` and `toast.error()`. Short German messages in the Password Manager; use English for OKR Tracker.

9. **Error handling**: API routes return `{ error: string }` with appropriate status codes. Client code shows toast on error.

10. **Audit logging**: Non-blocking, fire-and-forget. Never fails the main operation.

11. **Filtering**: Client-side via `useMemo` over React Query cache data. Sidebar sets filter state via context; page reads and filters.

12. **URL state**: Use `searchParams` for scope/filter. Use `router.push` for navigation, `router.replace` for non-history updates.

---

## 16. Package Dependencies (Expected)

```json
{
  "dependencies": {
    "next": "^15.x",
    "@supabase/ssr": "^0.5.x",
    "@supabase/supabase-js": "^2.x",
    "@tanstack/react-query": "^5.x",
    "lucide-react": "^0.4x",
    "sonner": "^1.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "@types/react": "^19.x",
    "@types/node": "^22.x"
  }
}
```
