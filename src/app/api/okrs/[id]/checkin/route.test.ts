import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import {
  MOCK_USER_ID,
  MOCK_ORG_ID,
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
  logCheckinCreate: vi.fn().mockResolvedValue(undefined),
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

function chainable(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn().mockReturnValue(builder);
  builder.insert = vi.fn().mockReturnValue(builder);
  builder.update = vi.fn().mockReturnValue(builder);
  builder.delete = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.gte = vi.fn().mockReturnValue(builder);
  builder.order = vi.fn().mockReturnValue(builder);
  builder.limit = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue(result);
  builder.then = (resolve: (v: unknown) => void) => resolve(result);
  return builder;
}

const VALID_CHECKIN_BODY = {
  confidence: 4,
  what_helped: 'Good teamwork',
  what_blocked: 'Unclear requirements',
  next_steps: 'Schedule meeting',
  key_result_updates: [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      current_value: 75,
    },
  ],
};

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/okrs/[id]/checkin', () => {
  it('returns 401 when not authenticated', async () => {
    unauthenticatedUser();

    const res = await GET(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/checkin`),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Nicht authentifiziert');
  });

  it('returns 404 when OKR not found', async () => {
    authenticatedUser();
    mockServiceFrom.mockReturnValue(
      chainable({ data: null, error: { code: 'PGRST116' } })
    );

    const res = await GET(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/checkin`),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('OKR nicht gefunden');
  });

  it('returns checkins for valid OKR', async () => {
    authenticatedUser();

    const checkins = [
      {
        id: 'checkin-1',
        okr_id: MOCK_OKR_ID,
        confidence: 4,
        checked_at: '2026-02-01T10:00:00Z',
      },
    ];

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // OKR ownership check
        return chainable({
          data: { id: MOCK_OKR_ID, user_id: MOCK_USER_ID },
          error: null,
        });
      }
      // checkins query
      const b = chainable({ data: checkins, error: null });
      (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
        resolve({ data: checkins, error: null });
      return b;
    });

    const res = await GET(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/checkin`),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.checkins).toBeDefined();
    expect(body.checkins).toHaveLength(1);
  });
});

describe('POST /api/okrs/[id]/checkin', () => {
  it('returns 401 when not authenticated', async () => {
    unauthenticatedUser();

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/checkin`, {
        method: 'POST',
        body: JSON.stringify(VALID_CHECKIN_BODY),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Nicht authentifiziert');
  });

  it('returns 400 for invalid check-in data', async () => {
    authenticatedUser();

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/checkin`, {
        method: 'POST',
        body: JSON.stringify({ confidence: 0 }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validierungsfehler');
  });

  it('returns 400 when confidence is out of range', async () => {
    authenticatedUser();

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/checkin`, {
        method: 'POST',
        body: JSON.stringify({
          ...VALID_CHECKIN_BODY,
          confidence: 6,
        }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validierungsfehler');
  });

  it('returns 404 when OKR not found', async () => {
    authenticatedUser();
    mockServiceFrom.mockReturnValue(
      chainable({ data: null, error: { code: 'PGRST116' } })
    );

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/checkin`, {
        method: 'POST',
        body: JSON.stringify(VALID_CHECKIN_BODY),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('OKR nicht gefunden');
  });

  it('returns 400 when OKR is archived', async () => {
    authenticatedUser();

    mockServiceFrom.mockReturnValue(
      chainable({
        data: {
          id: MOCK_OKR_ID,
          user_id: MOCK_USER_ID,
          organization_id: MOCK_ORG_ID,
          is_active: false,
          progress: 50,
        },
        error: null,
      })
    );

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/checkin`, {
        method: 'POST',
        body: JSON.stringify(VALID_CHECKIN_BODY),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('archivierte');
  });

  it('creates checkin successfully', async () => {
    authenticatedUser();

    const checkinResult = {
      id: 'checkin-new-id',
      okr_id: MOCK_OKR_ID,
      user_id: MOCK_USER_ID,
      confidence: 4,
      progress_update: 75,
    };

    const fullOkr = {
      id: MOCK_OKR_ID,
      title: 'Test OKR',
      progress: 75,
      key_results: [
        { id: 'kr-1', sort_order: 0, current_value: 75, title: 'KR1' },
      ],
    };

    let callCount = 0;
    mockServiceFrom.mockImplementation((table: string) => {
      callCount++;
      if (callCount === 1) {
        // OKR ownership + is_active check
        return chainable({
          data: {
            id: MOCK_OKR_ID,
            user_id: MOCK_USER_ID,
            organization_id: MOCK_ORG_ID,
            is_active: true,
            progress: 50,
          },
          error: null,
        });
      }
      if (callCount === 2 && table === 'okr_checkins') {
        // Cooldown check - return empty array (no recent checkins)
        const b = chainable({ data: [], error: null });
        (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
          resolve({ data: [], error: null });
        return b;
      }
      if (table === 'key_results') {
        // KR update (now parallel via Promise.all)
        const b = chainable({ data: null, error: null });
        (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
          resolve({ error: null });
        return b;
      }
      if (table === 'okr_checkins') {
        // Checkin insert
        return chainable({ data: checkinResult, error: null });
      }
      if (table === 'okrs') {
        // Could be progress fetch or full OKR fetch
        if (callCount <= 5) {
          return chainable({ data: { progress: 75 }, error: null });
        }
        return chainable({ data: fullOkr, error: null });
      }
      return chainable({ data: null, error: null });
    });

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/checkin`, {
        method: 'POST',
        body: JSON.stringify(VALID_CHECKIN_BODY),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.checkin).toBeDefined();
    expect(body.okr).toBeDefined();
  });

  it('rejects non-integer confidence', async () => {
    authenticatedUser();

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/checkin`, {
        method: 'POST',
        body: JSON.stringify({
          ...VALID_CHECKIN_BODY,
          confidence: 3.5,
        }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validierungsfehler');
  });
});
