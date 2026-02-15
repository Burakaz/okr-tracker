/**
 * Shared Supabase mock helpers for API route tests.
 *
 * Creates chainable query builder mocks that mirror Supabase's fluent API,
 * and mock factories for createClient / createServiceClient.
 */
import { vi } from 'vitest';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Creates a chainable mock query builder.
 * Every method returns `this` by default so calls can be chained.
 * Call `.single` or `.select` to terminate the chain and return { data, error }.
 */
export function createMockQueryBuilder(
  resolvedValue: { data: unknown; error: unknown; count?: number | null } = {
    data: null,
    error: null,
  }
): MockQueryBuilder {
  const builder: MockQueryBuilder = {} as MockQueryBuilder;

  const chainMethods = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'order',
    'limit',
    'range',
  ] as const;

  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  // `.single()` is the terminal call — it resolves the chain
  builder.single = vi.fn().mockResolvedValue(resolvedValue);

  // `.from()` starts a new chain
  builder.from = vi.fn().mockReturnValue(builder);

  // Override select to also be a terminal if needed
  // By default select chains, but callers can override for terminal behavior
  return builder;
}

/**
 * Creates a mock auth user result.
 */
export function mockAuthUser(user: { id: string; email?: string } | null) {
  if (!user) {
    return {
      data: { user: null },
      error: { message: 'Not authenticated' },
    };
  }
  return {
    data: {
      user: {
        id: user.id,
        email: user.email || 'test@example.com',
      },
    },
    error: null,
  };
}

// ── Factories ──────────────────────────────────────────────────────────────

export const MOCK_USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
export const MOCK_ORG_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
export const MOCK_OKR_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

export const MOCK_PROFILE = {
  id: MOCK_USER_ID,
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: null,
  role: 'employee',
  status: 'active',
  department: 'Engineering',
  manager_id: null,
  career_level_id: null,
  organization_id: MOCK_ORG_ID,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const MOCK_OKR = {
  id: MOCK_OKR_ID,
  user_id: MOCK_USER_ID,
  organization_id: MOCK_ORG_ID,
  title: 'Test OKR',
  why_it_matters: 'Because testing matters',
  quarter: 'Q1 2026',
  category: 'performance',
  progress: 50,
  status: 'on_track',
  confidence: 3,
  scope: 'personal',
  due_date: '2026-03-31',
  is_active: true,
  is_focus: false,
  sort_order: 0,
  parent_okr_id: null,
  team_id: null,
  last_checkin_at: null,
  next_checkin_at: null,
  checkin_count: 0,
  created_at: '2026-01-15T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
  key_results: [
    {
      id: 'kr-uuid-1111',
      okr_id: MOCK_OKR_ID,
      title: 'Key Result 1',
      start_value: 0,
      target_value: 100,
      current_value: 50,
      unit: null,
      progress: 50,
      sort_order: 0,
      source_url: null,
      source_label: null,
      created_at: '2026-01-15T00:00:00Z',
      updated_at: '2026-01-15T00:00:00Z',
    },
  ],
};
