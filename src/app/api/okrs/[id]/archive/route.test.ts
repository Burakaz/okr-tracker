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
  logOKRArchive: vi.fn().mockResolvedValue(undefined),
  logOKRRestore: vi.fn().mockResolvedValue(undefined),
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
  builder.single = vi.fn().mockResolvedValue(result);
  builder.then = (resolve: (v: unknown) => void) => resolve(result);
  return builder;
}

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/okrs/[id]/archive', () => {
  it('returns 401 when not authenticated', async () => {
    unauthenticatedUser();

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/archive`, {
        method: 'POST',
        body: JSON.stringify({ archive: true }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Nicht authentifiziert');
  });

  it('returns 400 when archive field is missing', async () => {
    authenticatedUser();

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/archive`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('archive');
  });

  it('returns 400 when archive field is not a boolean', async () => {
    authenticatedUser();

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/archive`, {
        method: 'POST',
        body: JSON.stringify({ archive: 'yes' }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('archive');
  });

  it('returns 404 when OKR not found', async () => {
    authenticatedUser();
    mockServiceFrom.mockReturnValue(
      chainable({ data: null, error: { code: 'PGRST116' } })
    );

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/archive`, {
        method: 'POST',
        body: JSON.stringify({ archive: true }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('OKR nicht gefunden');
  });

  it('archives OKR successfully (archive: true)', async () => {
    authenticatedUser();

    const archivedOkr = { ...MOCK_OKR, is_active: false, is_focus: false };

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
      return chainable({ data: archivedOkr, error: null });
    });

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/archive`, {
        method: 'POST',
        body: JSON.stringify({ archive: true }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.okr).toBeDefined();
    expect(body.okr.is_active).toBe(false);
  });

  it('restores OKR successfully (archive: false)', async () => {
    authenticatedUser();

    const restoredOkr = { ...MOCK_OKR, is_active: true, is_focus: false };

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
            is_active: false,
          },
          error: null,
        });
      }
      return chainable({ data: restoredOkr, error: null });
    });

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/archive`, {
        method: 'POST',
        body: JSON.stringify({ archive: false }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.okr).toBeDefined();
    expect(body.okr.is_active).toBe(true);
  });

  it('returns 500 on update database error', async () => {
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
      return chainable({
        data: null,
        error: { message: 'DB error' },
      });
    });

    const res = await POST(
      makeRequest(`/api/okrs/${MOCK_OKR_ID}/archive`, {
        method: 'POST',
        body: JSON.stringify({ archive: true }),
      }),
      makeParams(MOCK_OKR_ID)
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Archivieren');
  });
});
