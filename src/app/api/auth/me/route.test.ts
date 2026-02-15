import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { MOCK_USER_ID, MOCK_PROFILE } from '@/test/mocks/supabase';

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

describe('GET /api/auth/me', () => {
  it('returns 401 when not authenticated', async () => {
    unauthenticatedUser();

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Nicht authentifiziert');
  });

  it('returns 404 when profile not found', async () => {
    authenticatedUser();
    mockServiceFrom.mockReturnValue(
      chainable({ data: null, error: { code: 'PGRST116' } })
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Profil nicht gefunden');
  });

  it('returns user profile successfully', async () => {
    authenticatedUser();
    mockServiceFrom.mockReturnValue(
      chainable({ data: { ...MOCK_PROFILE }, error: null })
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.user).toBeDefined();
    expect(body.user.id).toBe(MOCK_USER_ID);
    expect(body.user.name).toBe('Test User');
    expect(body.user.role).toBe('employee');
    expect(body.user.email).toBe('test@example.com');
  });

  it('falls back to auth email when profile email is null', async () => {
    authenticatedUser();
    mockServiceFrom.mockReturnValue(
      chainable({
        data: { ...MOCK_PROFILE, email: null },
        error: null,
      })
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.user.email).toBe('test@example.com');
  });

  it('returns all expected profile fields', async () => {
    authenticatedUser();
    mockServiceFrom.mockReturnValue(
      chainable({ data: { ...MOCK_PROFILE }, error: null })
    );

    const res = await GET();
    const body = await res.json();

    const expectedKeys = [
      'id',
      'email',
      'name',
      'avatar_url',
      'role',
      'status',
      'department',
      'manager_id',
      'career_level_id',
      'organization_id',
      'created_at',
      'updated_at',
    ];

    for (const key of expectedKeys) {
      expect(body.user).toHaveProperty(key);
    }
  });

  it('includes correct status and department from profile', async () => {
    authenticatedUser();
    mockServiceFrom.mockReturnValue(
      chainable({
        data: {
          ...MOCK_PROFILE,
          status: 'suspended',
          department: 'Sales',
        },
        error: null,
      })
    );

    const res = await GET();
    const body = await res.json();

    expect(body.user.status).toBe('suspended');
    expect(body.user.department).toBe('Sales');
  });
});
