// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Module-level mocks ─────────────────────────────────────────────────────

const mockGetUser = vi.fn();
const mockProfileSelect = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(
    (_url: string, key: string, _opts: unknown) => {
      // Service client (for suspended check) uses service key
      if (key === 'test-service-key') {
        return {
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockProfileSelect,
              }),
            }),
          }),
        };
      }
      // Auth client
      return {
        auth: {
          getUser: mockGetUser,
        },
      };
    }
  ),
}));

// Must import after mocks are set up
import { updateSession } from './middleware';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeNextRequest(pathname: string) {
  const url = new URL(pathname, 'http://localhost:3000');
  return new NextRequest(url, {
    headers: new Headers(),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
});

describe('updateSession - middleware', () => {
  describe('unauthenticated user redirects', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
    });

    it('redirects unauthenticated user from /dashboard to /auth/login', async () => {
      const response = await updateSession(makeNextRequest('/dashboard'));

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/auth/login');
      expect(location).toContain('redirect=%2Fdashboard');
    });

    it('redirects unauthenticated user from /admin to /auth/login', async () => {
      const response = await updateSession(makeNextRequest('/admin'));

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/auth/login');
    });

    it('redirects unauthenticated user from /api/okrs to /auth/login', async () => {
      const response = await updateSession(makeNextRequest('/api/okrs'));

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/auth/login');
    });

    it('redirects unauthenticated user from /api/audit to /auth/login', async () => {
      const response = await updateSession(makeNextRequest('/api/audit'));

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/auth/login');
    });

    it('redirects unauthenticated user from /api/career to /auth/login', async () => {
      const response = await updateSession(makeNextRequest('/api/career'));

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/auth/login');
    });

    it('does NOT redirect unauthenticated user from /auth/login', async () => {
      const response = await updateSession(makeNextRequest('/auth/login'));

      // Should pass through (200)
      expect(response.status).toBe(200);
    });
  });

  describe('authenticated user redirects', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      });
    });

    it('redirects authenticated user from / to /dashboard', async () => {
      const response = await updateSession(makeNextRequest('/'));

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/dashboard');
    });

    it('redirects authenticated user from /auth/login to /dashboard', async () => {
      const response = await updateSession(makeNextRequest('/auth/login'));

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/dashboard');
    });

    it('does NOT redirect authenticated user from /auth/signout', async () => {
      const response = await updateSession(makeNextRequest('/auth/signout'));

      expect(response.status).toBe(200);
    });

    it('allows authenticated user to access /dashboard', async () => {
      const response = await updateSession(makeNextRequest('/dashboard'));

      // Not a redirect to login
      expect(response.status).toBe(200);
    });
  });

  describe('suspended user handling', () => {
    it('blocks suspended user from API routes with 403', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'suspended@example.com' } },
        error: null,
      });
      mockProfileSelect.mockResolvedValue({
        data: { status: 'suspended' },
        error: null,
      });

      const response = await updateSession(makeNextRequest('/api/okrs'));

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Account suspended');
    });

    it('blocks inactive user from API routes with 403', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'inactive@example.com' } },
        error: null,
      });
      mockProfileSelect.mockResolvedValue({
        data: { status: 'inactive' },
        error: null,
      });

      const response = await updateSession(makeNextRequest('/api/okrs'));

      expect(response.status).toBe(403);
    });

    it('allows active user through API routes', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-1', email: 'active@example.com' } },
        error: null,
      });
      mockProfileSelect.mockResolvedValue({
        data: { status: 'active' },
        error: null,
      });

      const response = await updateSession(makeNextRequest('/api/okrs'));

      expect(response.status).toBe(200);
    });
  });

  describe('redirect parameter preservation', () => {
    it('preserves the original path in redirect query param', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const response = await updateSession(
        makeNextRequest('/dashboard/settings')
      );

      const location = response.headers.get('location');
      expect(location).toContain('redirect=%2Fdashboard%2Fsettings');
    });
  });
});
