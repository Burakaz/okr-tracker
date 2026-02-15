import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import {
  MOCK_USER_ID,
  MOCK_ORG_ID,
  MOCK_OKR,
  MOCK_OKR_ID,
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

vi.mock('@/lib/audit', () => ({
  logOKRCreate: vi.fn().mockResolvedValue(undefined),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
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

/** Build a chainable Supabase mock. */
function chainable(result: { data: unknown; error: unknown; count?: number | null }) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn().mockReturnValue(builder);
  builder.insert = vi.fn().mockReturnValue(builder);
  builder.update = vi.fn().mockReturnValue(builder);
  builder.delete = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.order = vi.fn().mockReturnValue(builder);
  builder.limit = vi.fn().mockReturnValue(builder);
  builder.range = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue(result);
  // Make the builder itself thenable for non-single queries
  builder.then = (resolve: (v: unknown) => void) => resolve(result);
  return builder;
}

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/okrs', () => {
  it('returns 401 when not authenticated', async () => {
    unauthenticatedUser();

    const res = await GET(makeRequest('/api/okrs'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Nicht authentifiziert');
  });

  it('returns OKRs for authenticated user', async () => {
    authenticatedUser();

    const okrsData = [
      { ...MOCK_OKR, key_results: [{ ...MOCK_OKR.key_results[0], sort_order: 0 }] },
    ];

    const builder = chainable({ data: okrsData, error: null });
    mockServiceFrom.mockReturnValue(builder);

    const res = await GET(makeRequest('/api/okrs'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.okrs).toBeDefined();
    expect(body.okrs).toHaveLength(1);
    expect(body.okrs[0].title).toBe('Test OKR');
  });

  it('filters by quarter when query param is provided', async () => {
    authenticatedUser();

    const builder = chainable({ data: [], error: null });
    mockServiceFrom.mockReturnValue(builder);

    await GET(makeRequest('/api/okrs?quarter=Q2%202026'));

    // Verify eq was called with quarter filter
    expect(builder.eq).toHaveBeenCalledWith('user_id', MOCK_USER_ID);
    expect(builder.eq).toHaveBeenCalledWith('quarter', 'Q2 2026');
  });

  it('returns 500 on database error', async () => {
    authenticatedUser();

    const builder = chainable({ data: null, error: { message: 'DB error' } });
    mockServiceFrom.mockReturnValue(builder);

    const res = await GET(makeRequest('/api/okrs'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Fehler beim Laden der OKRs');
  });

  it('returns empty array when user has no OKRs', async () => {
    authenticatedUser();

    const builder = chainable({ data: [], error: null });
    mockServiceFrom.mockReturnValue(builder);

    const res = await GET(makeRequest('/api/okrs'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.okrs).toEqual([]);
  });
});

describe('POST /api/okrs', () => {
  const validBody = {
    title: 'New OKR',
    quarter: 'Q1 2026',
    category: 'performance',
    key_results: [
      { title: 'KR 1', start_value: 0, target_value: 100 },
    ],
  };

  it('returns 401 when not authenticated', async () => {
    unauthenticatedUser();

    const res = await POST(
      makeRequest('/api/okrs', {
        method: 'POST',
        body: JSON.stringify(validBody),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Nicht authentifiziert');
  });

  it('returns 400 for invalid body', async () => {
    authenticatedUser();

    const res = await POST(
      makeRequest('/api/okrs', {
        method: 'POST',
        body: JSON.stringify({ title: '' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validierungsfehler');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when missing key_results', async () => {
    authenticatedUser();

    const res = await POST(
      makeRequest('/api/okrs', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          quarter: 'Q1 2026',
          category: 'performance',
        }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validierungsfehler');
  });

  it('returns 404 when profile not found', async () => {
    authenticatedUser();

    // Call sequence: profiles (single), okrs (count), etc.
    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // profiles query
        return chainable({ data: null, error: { message: 'Not found' } });
      }
      return chainable({ data: null, error: null });
    });

    const res = await POST(
      makeRequest('/api/okrs', {
        method: 'POST',
        body: JSON.stringify(validBody),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Profil nicht gefunden');
  });

  it('returns 400 when no organization assigned', async () => {
    authenticatedUser();

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({
          data: { organization_id: null },
          error: null,
        });
      }
      return chainable({ data: null, error: null });
    });

    const res = await POST(
      makeRequest('/api/okrs', {
        method: 'POST',
        body: JSON.stringify(validBody),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Keine Organisation zugewiesen');
  });

  it('returns 400 when max OKRs per quarter reached', async () => {
    authenticatedUser();

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // profiles
        return chainable({
          data: { organization_id: MOCK_ORG_ID },
          error: null,
        });
      }
      if (callCount === 2) {
        // okrs count
        const b = chainable({ data: null, error: null, count: 5 });
        // Override to return count directly
        (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
          resolve({ count: 5, error: null });
        (b.select as ReturnType<typeof vi.fn>).mockReturnValue(b);
        return b;
      }
      return chainable({ data: null, error: null });
    });

    const res = await POST(
      makeRequest('/api/okrs', {
        method: 'POST',
        body: JSON.stringify(validBody),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Maximal');
  });

  it('creates OKR successfully with valid data', async () => {
    authenticatedUser();

    const newOkrData = {
      id: 'new-okr-id',
      user_id: MOCK_USER_ID,
      organization_id: MOCK_ORG_ID,
      title: 'New OKR',
      quarter: 'Q1 2026',
      category: 'performance',
      scope: 'personal',
      sort_order: 0,
    };

    const insertedKRs = [
      {
        id: 'new-kr-id',
        okr_id: 'new-okr-id',
        title: 'KR 1',
        start_value: 0,
        target_value: 100,
        current_value: 0,
      },
    ];

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // profiles
        return chainable({
          data: { organization_id: MOCK_ORG_ID },
          error: null,
        });
      }
      if (callCount === 2) {
        // okrs count check
        const b = chainable({ data: null, error: null, count: 2 });
        (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
          resolve({ count: 2, error: null });
        return b;
      }
      if (callCount === 3) {
        // last sort_order
        return chainable({
          data: { sort_order: 1 },
          error: null,
        });
      }
      if (callCount === 4) {
        // insert OKR
        return chainable({ data: newOkrData, error: null });
      }
      if (callCount === 5) {
        // insert key results - returns directly (no single)
        const b = chainable({ data: insertedKRs, error: null });
        (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
          resolve({ data: insertedKRs, error: null });
        // Make select resolve directly
        (b.select as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: insertedKRs,
          error: null,
        });
        return b;
      }
      return chainable({ data: null, error: null });
    });

    const res = await POST(
      makeRequest('/api/okrs', {
        method: 'POST',
        body: JSON.stringify(validBody),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.okr).toBeDefined();
    expect(body.okr.title).toBe('New OKR');
    expect(body.okr.key_results).toHaveLength(1);
  });

  it('rejects invalid quarter format', async () => {
    authenticatedUser();

    const res = await POST(
      makeRequest('/api/okrs', {
        method: 'POST',
        body: JSON.stringify({
          ...validBody,
          quarter: 'invalid',
        }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validierungsfehler');
  });

  it('rejects invalid category', async () => {
    authenticatedUser();

    const res = await POST(
      makeRequest('/api/okrs', {
        method: 'POST',
        body: JSON.stringify({
          ...validBody,
          category: 'invalid-cat',
        }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
  });
});
