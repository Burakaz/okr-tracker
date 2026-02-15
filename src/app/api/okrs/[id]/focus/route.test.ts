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
  logFocusToggle: vi.fn().mockResolvedValue(undefined),
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
  builder.single = vi.fn().mockResolvedValue(result);
  builder.then = (resolve: (v: unknown) => void) => resolve(result);
  return builder;
}

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/okrs/[id]/focus', () => {
  it('returns 401 when not authenticated', async () => {
    unauthenticatedUser();

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/focus`, { method: 'POST' }),
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

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/focus`, { method: 'POST' }),
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
          is_focus: false,
          is_active: false,
          organization_id: MOCK_ORG_ID,
          quarter: 'Q1 2026',
          user_id: MOCK_USER_ID,
        },
        error: null,
      })
    );

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/focus`, { method: 'POST' }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Archivierte');
  });

  it('toggles focus ON successfully', async () => {
    authenticatedUser();

    const updatedOkr = {
      ...MOCK_OKR,
      is_focus: true,
      key_results: [{ ...MOCK_OKR.key_results[0] }],
    };

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // fetch existing
        return chainable({
          data: {
            id: MOCK_OKR_ID,
            is_focus: false,
            is_active: true,
            organization_id: MOCK_ORG_ID,
            quarter: 'Q1 2026',
            user_id: MOCK_USER_ID,
          },
          error: null,
        });
      }
      if (callCount === 2) {
        // count focused OKRs
        const b = chainable({ data: null, error: null, count: 1 });
        (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
          resolve({ count: 1, error: null });
        return b;
      }
      // update
      return chainable({ data: updatedOkr, error: null });
    });

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/focus`, { method: 'POST' }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.okr).toBeDefined();
    expect(body.okr.is_focus).toBe(true);
  });

  it('toggles focus OFF successfully', async () => {
    authenticatedUser();

    const updatedOkr = {
      ...MOCK_OKR,
      is_focus: false,
      key_results: [{ ...MOCK_OKR.key_results[0] }],
    };

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({
          data: {
            id: MOCK_OKR_ID,
            is_focus: true,
            is_active: true,
            organization_id: MOCK_ORG_ID,
            quarter: 'Q1 2026',
            user_id: MOCK_USER_ID,
          },
          error: null,
        });
      }
      // No count check needed when toggling OFF
      return chainable({ data: updatedOkr, error: null });
    });

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/focus`, { method: 'POST' }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.okr).toBeDefined();
  });

  it('returns 400 when max focus limit reached', async () => {
    authenticatedUser();

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({
          data: {
            id: MOCK_OKR_ID,
            is_focus: false,
            is_active: true,
            organization_id: MOCK_ORG_ID,
            quarter: 'Q1 2026',
            user_id: MOCK_USER_ID,
          },
          error: null,
        });
      }
      // count returns MAX_FOCUS (2)
      const b = chainable({ data: null, error: null, count: 2 });
      (b as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
        resolve({ count: 2, error: null });
      return b;
    });

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/focus`, { method: 'POST' }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Maximal');
    expect(body.error).toContain('Fokus');
  });

  it('returns 500 on update error', async () => {
    authenticatedUser();

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({
          data: {
            id: MOCK_OKR_ID,
            is_focus: true,
            is_active: true,
            organization_id: MOCK_ORG_ID,
            quarter: 'Q1 2026',
            user_id: MOCK_USER_ID,
          },
          error: null,
        });
      }
      return chainable({
        data: null,
        error: { message: 'Update error' },
      });
    });

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/focus`, { method: 'POST' }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Fokus');
  });
});
