import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from './route';
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
  logOKRUpdate: vi.fn().mockResolvedValue(undefined),
  logOKRDelete: vi.fn().mockResolvedValue(undefined),
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
  builder.order = vi.fn().mockReturnValue(builder);
  builder.limit = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue(result);
  builder.then = (resolve: (v: unknown) => void) => resolve(result);
  return builder;
}

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET ────────────────────────────────────────────────────────────────────

describe('GET /api/okrs/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    unauthenticatedUser();

    const res = await GET(makeRequest('/api/okrs/abc'), makeParams('abc'));
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
      makeRequest(`/api/okrs/${MOCK_OKR_ID}`),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('OKR nicht gefunden');
  });

  it('returns OKR with key results when found', async () => {
    authenticatedUser();
    mockServiceFrom.mockReturnValue(
      chainable({ data: { ...MOCK_OKR }, error: null })
    );

    const res = await GET(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}`),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.okr).toBeDefined();
    expect(body.okr.id).toBe(MOCK_OKR_ID);
    expect(body.okr.key_results).toHaveLength(1);
  });

  it('enforces user_id filter for ownership check', async () => {
    authenticatedUser();
    const builder = chainable({ data: { ...MOCK_OKR }, error: null });
    mockServiceFrom.mockReturnValue(builder);

    await GET(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}`),
      makeParams(MOCK_OKR_ID)
    );

    expect(builder.eq).toHaveBeenCalledWith('id', MOCK_OKR_ID);
    expect(builder.eq).toHaveBeenCalledWith('user_id', MOCK_USER_ID);
  });
});

// ── PATCH ──────────────────────────────────────────────────────────────────

describe('PATCH /api/okrs/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    unauthenticatedUser();

    const res = await PATCH(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated' }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Nicht authentifiziert');
  });

  it('returns 400 for invalid update data', async () => {
    authenticatedUser();

    const res = await PATCH(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: '' }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validierungsfehler');
  });

  it('returns 404 when OKR not found for update', async () => {
    authenticatedUser();
    mockServiceFrom.mockReturnValue(
      chainable({ data: null, error: { code: 'PGRST116' } })
    );

    const res = await PATCH(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated Title' }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('OKR nicht gefunden');
  });

  it('returns existing OKR when no fields changed', async () => {
    authenticatedUser();

    // Fetch existing returns OKR with same title
    mockServiceFrom.mockReturnValue(
      chainable({ data: { ...MOCK_OKR }, error: null })
    );

    const res = await PATCH(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: MOCK_OKR.title }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.okr).toBeDefined();
  });

  it('updates OKR successfully', async () => {
    authenticatedUser();

    const updatedOkr = { ...MOCK_OKR, title: 'Updated Title' };

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // fetch existing
        return chainable({ data: { ...MOCK_OKR }, error: null });
      }
      // update
      return chainable({ data: updatedOkr, error: null });
    });

    const res = await PATCH(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated Title' }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.okr.title).toBe('Updated Title');
  });

  it('accepts partial update with only category', async () => {
    authenticatedUser();

    const updatedOkr = { ...MOCK_OKR, category: 'skill' };

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({ data: { ...MOCK_OKR }, error: null });
      }
      return chainable({ data: updatedOkr, error: null });
    });

    const res = await PATCH(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}`, {
        method: 'PATCH',
        body: JSON.stringify({ category: 'skill' }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.okr.category).toBe('skill');
  });
});

// ── DELETE ──────────────────────────────────────────────────────────────────

describe('DELETE /api/okrs/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    unauthenticatedUser();

    const res = await DELETE(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}`, { method: 'DELETE' }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Nicht authentifiziert');
  });

  it('returns 404 when OKR not found for deletion', async () => {
    authenticatedUser();
    mockServiceFrom.mockReturnValue(
      chainable({ data: null, error: { code: 'PGRST116' } })
    );

    const res = await DELETE(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}`, { method: 'DELETE' }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('OKR nicht gefunden');
  });

  it('soft-deletes OKR successfully', async () => {
    authenticatedUser();

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // fetch existing for ownership check
        return chainable({
          data: {
            id: MOCK_OKR_ID,
            title: 'Test OKR',
            organization_id: MOCK_ORG_ID,
            user_id: MOCK_USER_ID,
            is_active: true,
          },
          error: null,
        });
      }
      // update (soft delete)
      const b = chainable({ data: null, error: null });
      (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
        resolve({ error: null });
      return b;
    });

    const res = await DELETE(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}`, { method: 'DELETE' }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 500 on delete database error', async () => {
    authenticatedUser();

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({
          data: {
            id: MOCK_OKR_ID,
            title: 'Test OKR',
            organization_id: MOCK_ORG_ID,
            user_id: MOCK_USER_ID,
            is_active: true,
          },
          error: null,
        });
      }
      // Simulate DB error on update
      const b = chainable({ data: null, error: null });
      (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
        resolve({ error: { message: 'DB Error' } });
      return b;
    });

    const res = await DELETE(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}`, { method: 'DELETE' }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Fehler beim Löschen');
  });
});
