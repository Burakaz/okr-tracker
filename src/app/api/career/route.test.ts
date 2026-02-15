import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.single = vi.fn().mockResolvedValue(result);
  return builder;
}

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/career', () => {
  it('returns 401 when not authenticated', async () => {
    unauthenticatedUser();

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Nicht authentifiziert');
  });

  it('returns null progress when profile has no organization', async () => {
    authenticatedUser();
    mockServiceFrom.mockReturnValue(
      chainable({
        data: { organization_id: null },
        error: null,
      })
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.progress).toBeNull();
  });

  it('returns null progress when profile not found', async () => {
    authenticatedUser();
    mockServiceFrom.mockReturnValue(
      chainable({ data: null, error: { code: 'PGRST116' } })
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.progress).toBeNull();
  });

  it('returns career progress when available', async () => {
    authenticatedUser();

    const progress = {
      id: 'career-1',
      user_id: MOCK_USER_ID,
      organization_id: MOCK_ORG_ID,
      current_level_id: 'level-1',
      qualifying_okr_count: 4,
      total_okrs_attempted: 10,
    };

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
      // career progress
      return chainable({ data: progress, error: null });
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.progress).toBeDefined();
    expect(body.progress.qualifying_okr_count).toBe(4);
  });

  it('returns null progress when no career record exists (PGRST116)', async () => {
    authenticatedUser();

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({
          data: { organization_id: MOCK_ORG_ID },
          error: null,
        });
      }
      return chainable({
        data: null,
        error: { code: 'PGRST116', message: 'No rows' },
      });
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.progress).toBeNull();
  });

  it('returns 500 on unexpected database error', async () => {
    authenticatedUser();

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return chainable({
          data: { organization_id: MOCK_ORG_ID },
          error: null,
        });
      }
      return chainable({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Connection failed' },
      });
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Karriere');
  });
});
