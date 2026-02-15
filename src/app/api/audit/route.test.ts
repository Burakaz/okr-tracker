import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import {
  MOCK_USER_ID,
  MOCK_ORG_ID,
} from '@/test/mocks/supabase';

// ── Module-level mocks ─────────────────────────────────────────────────────

const mockGetUser = vi.fn();
const mockServiceFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
  createServiceClient: vi.fn().mockResolvedValue({
    from: (...args: unknown[]) => mockServiceFrom(...args),
  }),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

function authenticatedUser() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: MOCK_USER_ID, email: 'test@example.com' } },
    error: null,
  });
}

function unauthenticatedUser() {
  mockGetUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Not authenticated' },
  });
}

function chainable(result: { data: unknown; error: unknown; count?: number | null }) {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.order = vi.fn().mockReturnValue(builder);
  builder.range = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue(result);
  builder.then = (resolve: (v: unknown) => void) => resolve(result);
  return builder;
}

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/audit', () => {
  it('returns 401 when not authenticated', async () => {
    unauthenticatedUser();

    const res = await GET(makeRequest('/api/audit'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Nicht authentifiziert');
  });

  it('returns 404 when profile not found', async () => {
    authenticatedUser();
    mockServiceFrom.mockReturnValue(
      chainable({ data: null, error: { code: 'PGRST116' } })
    );

    const res = await GET(makeRequest('/api/audit'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Profil nicht gefunden');
  });

  it('returns 404 when profile has no organization', async () => {
    authenticatedUser();
    mockServiceFrom.mockReturnValue(
      chainable({
        data: { organization_id: null, role: 'employee' },
        error: null,
      })
    );

    const res = await GET(makeRequest('/api/audit'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Profil nicht gefunden');
  });

  it('returns audit logs for regular employee (own logs only)', async () => {
    authenticatedUser();

    const logs = [
      {
        id: 'log-1',
        user_id: MOCK_USER_ID,
        action: 'okr_create',
        resource_type: 'okr',
        created_at: '2026-02-01T10:00:00Z',
      },
    ];

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // profile fetch
        return chainable({
          data: {
            organization_id: MOCK_ORG_ID,
            role: 'employee',
          },
          error: null,
        });
      }
      // audit logs query
      const b = chainable({ data: logs, error: null, count: 1 });
      (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
        resolve({ data: logs, error: null, count: 1 });
      return b;
    });

    const res = await GET(makeRequest('/api/audit'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.logs).toBeDefined();
    expect(body.logs).toHaveLength(1);
    expect(body.pagination).toBeDefined();
    expect(body.pagination.total).toBe(1);
    expect(body.pagination.page).toBe(1);
  });

  it('returns audit logs for admin (all org logs)', async () => {
    authenticatedUser();

    const logs = [
      {
        id: 'log-1',
        user_id: 'other-user',
        action: 'okr_create',
        resource_type: 'okr',
        created_at: '2026-02-01T10:00:00Z',
      },
      {
        id: 'log-2',
        user_id: MOCK_USER_ID,
        action: 'okr_update',
        resource_type: 'okr',
        created_at: '2026-02-02T10:00:00Z',
      },
    ];

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({
          data: {
            organization_id: MOCK_ORG_ID,
            role: 'admin',
          },
          error: null,
        });
      }
      const b = chainable({ data: logs, error: null, count: 2 });
      (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
        resolve({ data: logs, error: null, count: 2 });
      return b;
    });

    const res = await GET(makeRequest('/api/audit'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.logs).toHaveLength(2);
    expect(body.pagination.total).toBe(2);
  });

  it('supports pagination parameters', async () => {
    authenticatedUser();

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({
          data: {
            organization_id: MOCK_ORG_ID,
            role: 'employee',
          },
          error: null,
        });
      }
      const b = chainable({ data: [], error: null, count: 100 });
      (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
        resolve({ data: [], error: null, count: 100 });
      return b;
    });

    const res = await GET(makeRequest('/api/audit?page=3&limit=10'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pagination.page).toBe(3);
    expect(body.pagination.limit).toBe(10);
  });

  it('caps limit at 100', async () => {
    authenticatedUser();

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({
          data: {
            organization_id: MOCK_ORG_ID,
            role: 'employee',
          },
          error: null,
        });
      }
      const b = chainable({ data: [], error: null, count: 0 });
      (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
        resolve({ data: [], error: null, count: 0 });
      return b;
    });

    const res = await GET(makeRequest('/api/audit?limit=500'));
    const body = await res.json();

    expect(body.pagination.limit).toBe(100);
  });

  it('filters by resource_type query param', async () => {
    authenticatedUser();

    let callCount = 0;
    const auditBuilder = chainable({ data: [], error: null, count: 0 });
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({
          data: {
            organization_id: MOCK_ORG_ID,
            role: 'employee',
          },
          error: null,
        });
      }
      (auditBuilder as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
        resolve({ data: [], error: null, count: 0 });
      return auditBuilder;
    });

    await GET(makeRequest('/api/audit?resource_type=okr'));

    // Check that eq was called with resource_type filter
    expect(auditBuilder.eq).toHaveBeenCalledWith('resource_type', 'okr');
  });

  it('filters by action query param', async () => {
    authenticatedUser();

    let callCount = 0;
    const auditBuilder = chainable({ data: [], error: null, count: 0 });
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({
          data: {
            organization_id: MOCK_ORG_ID,
            role: 'employee',
          },
          error: null,
        });
      }
      (auditBuilder as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
        resolve({ data: [], error: null, count: 0 });
      return auditBuilder;
    });

    await GET(makeRequest('/api/audit?action=okr_create'));

    expect(auditBuilder.eq).toHaveBeenCalledWith('action', 'okr_create');
  });

  it('returns 500 on database error', async () => {
    authenticatedUser();

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({
          data: {
            organization_id: MOCK_ORG_ID,
            role: 'employee',
          },
          error: null,
        });
      }
      const b = chainable({ data: null, error: { message: 'DB error' } });
      (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
        resolve({ data: null, error: { message: 'DB error' }, count: null });
      return b;
    });

    const res = await GET(makeRequest('/api/audit'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Audit');
  });
});
