import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import {
  MOCK_USER_ID,
  MOCK_ORG_ID,
  MOCK_OKR_ID,
  MOCK_OKR,
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
  logOKRDuplicate: vi.fn().mockResolvedValue(undefined),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
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
  builder.insert = vi.fn().mockReturnValue(builder);
  builder.update = vi.fn().mockReturnValue(builder);
  builder.delete = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.order = vi.fn().mockReturnValue(builder);
  builder.limit = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue(result);
  builder.then = (resolve: (v: unknown) => void) => resolve(result);
  return builder;
}

const VALID_DUPLICATE_BODY = {
  target_quarter: 'Q2 2026',
  reset_progress: true,
  copy_key_results: true,
};

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/okrs/[id]/duplicate', () => {
  it('returns 401 when not authenticated', async () => {
    unauthenticatedUser();

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/duplicate`, {
        method: 'POST',
        body: JSON.stringify(VALID_DUPLICATE_BODY),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Nicht authentifiziert');
  });

  it('returns 400 for invalid body', async () => {
    authenticatedUser();

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ target_quarter: 'invalid' }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validierungsfehler');
  });

  it('returns 400 when missing required fields', async () => {
    authenticatedUser();

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ target_quarter: 'Q2 2026' }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validierungsfehler');
  });

  it('returns 404 when source OKR not found', async () => {
    authenticatedUser();
    mockServiceFrom.mockReturnValue(
      chainable({ data: null, error: { code: 'PGRST116' } })
    );

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/duplicate`, {
        method: 'POST',
        body: JSON.stringify(VALID_DUPLICATE_BODY),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('OKR nicht gefunden');
  });

  it('returns 400 when target quarter is full', async () => {
    authenticatedUser();

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // fetch source OKR
        return chainable({ data: { ...MOCK_OKR }, error: null });
      }
      // count check
      const b = chainable({ data: null, error: null, count: 5 });
      (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
        resolve({ count: 5, error: null });
      return b;
    });

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/duplicate`, {
        method: 'POST',
        body: JSON.stringify(VALID_DUPLICATE_BODY),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Maximal');
  });

  it('duplicates OKR successfully with reset progress', async () => {
    authenticatedUser();

    const newOkrData = {
      id: 'new-dup-okr-id',
      user_id: MOCK_USER_ID,
      organization_id: MOCK_ORG_ID,
      title: MOCK_OKR.title,
      quarter: 'Q2 2026',
      progress: 0,
      confidence: 3,
    };

    const insertedKRs = [
      {
        id: 'new-kr-id',
        okr_id: 'new-dup-okr-id',
        title: 'Key Result 1',
        start_value: 0,
        target_value: 100,
        current_value: 0,
      },
    ];

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // fetch source OKR
        return chainable({ data: { ...MOCK_OKR }, error: null });
      }
      if (callCount === 2) {
        // count check
        const b = chainable({ data: null, error: null, count: 2 });
        (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
          resolve({ count: 2, error: null });
        return b;
      }
      if (callCount === 3) {
        // sort order
        return chainable({ data: { sort_order: 0 }, error: null });
      }
      if (callCount === 4) {
        // insert new OKR
        return chainable({ data: newOkrData, error: null });
      }
      if (callCount === 5) {
        // insert KRs
        const b = chainable({ data: insertedKRs, error: null });
        (b.select as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: insertedKRs,
          error: null,
        });
        return b;
      }
      return chainable({ data: null, error: null });
    });

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/duplicate`, {
        method: 'POST',
        body: JSON.stringify(VALID_DUPLICATE_BODY),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.okr).toBeDefined();
    expect(body.okr.id).toBe('new-dup-okr-id');
    expect(body.okr.key_results).toHaveLength(1);
  });

  it('duplicates without copying key results', async () => {
    authenticatedUser();

    const newOkrData = {
      id: 'new-dup-okr-id',
      user_id: MOCK_USER_ID,
      organization_id: MOCK_ORG_ID,
      title: MOCK_OKR.title,
      quarter: 'Q2 2026',
    };

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({ data: { ...MOCK_OKR }, error: null });
      }
      if (callCount === 2) {
        const b = chainable({ data: null, error: null, count: 0 });
        (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
          resolve({ count: 0, error: null });
        return b;
      }
      if (callCount === 3) {
        return chainable({ data: null, error: { code: 'PGRST116' } });
      }
      if (callCount === 4) {
        return chainable({ data: newOkrData, error: null });
      }
      return chainable({ data: null, error: null });
    });

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({
          ...VALID_DUPLICATE_BODY,
          copy_key_results: false,
        }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.okr).toBeDefined();
    expect(body.okr.key_results).toEqual([]);
  });

  it('rejects invalid quarter format', async () => {
    authenticatedUser();

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({
          ...VALID_DUPLICATE_BODY,
          target_quarter: 'Q5 2026',
        }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validierungsfehler');
  });
});
