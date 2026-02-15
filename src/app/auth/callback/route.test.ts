import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// ── Module-level mocks ─────────────────────────────────────────────────────

const mockExchangeCodeForSession = vi.fn();
const mockSignOut = vi.fn();
const mockServiceFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      exchangeCodeForSession: (...args: unknown[]) => mockExchangeCodeForSession(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  }),
  createServiceClient: vi.fn().mockResolvedValue({
    from: (...args: unknown[]) => mockServiceFrom(...args),
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    audit: vi.fn(),
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(url: string) {
  return new Request(new URL(url, 'http://localhost:3000'));
}

function chainable(result: { data: unknown; error: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(result);
  chain.upsert = vi.fn().mockResolvedValue(result);
  chain.then = (resolve: (val: typeof result) => void) => resolve(result);
  return chain;
}

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
};

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /auth/callback', () => {
  it('redirects to /dashboard on successful code exchange', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Profile lookup: existing active user
    const profileChain = chainable({ data: { id: 'user-1', status: 'active' }, error: null });
    // Count query chain
    const countChain = chainable({ data: null, error: null, count: 5 });
    // Upsert chain
    const upsertChain = chainable({ data: null, error: null });

    let fromCallCount = 0;
    mockServiceFrom.mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) return profileChain;  // profiles.select('id, status')
      if (fromCallCount === 2) return countChain;     // profiles.select('*', { count })
      return upsertChain;                              // profiles.upsert
    });

    const request = makeRequest('/auth/callback?code=test-auth-code');
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('/dashboard');
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('test-auth-code');
  });

  it('redirects to custom next path when provided', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const profileChain = chainable({ data: { id: 'user-1', status: 'active' }, error: null });
    const countChain = chainable({ data: null, error: null, count: 5 });
    const upsertChain = chainable({ data: null, error: null });

    let fromCallCount = 0;
    mockServiceFrom.mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) return profileChain;
      if (fromCallCount === 2) return countChain;
      return upsertChain;
    });

    const request = makeRequest('/auth/callback?code=test-auth-code&next=/settings');
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('/settings');
  });

  it('redirects to login error page when no code provided', async () => {
    const request = makeRequest('/auth/callback');
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('/auth/login');
    expect(location).toContain('error=auth_failed');
  });

  it('redirects to login error page when code exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid code' },
    });

    const request = makeRequest('/auth/callback?code=invalid-code');
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('/auth/login');
    expect(location).toContain('error=auth_failed');
  });

  it('defaults next parameter to /dashboard', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const profileChain = chainable({ data: { id: 'user-1', status: 'active' }, error: null });
    const countChain = chainable({ data: null, error: null, count: 5 });
    const upsertChain = chainable({ data: null, error: null });

    let fromCallCount = 0;
    mockServiceFrom.mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) return profileChain;
      if (fromCallCount === 2) return countChain;
      return upsertChain;
    });

    const request = makeRequest('/auth/callback?code=test-code');
    const response = await GET(request);

    const location = response.headers.get('location');
    expect(location).toContain('/dashboard');
  });

  it('blocks suspended user and redirects to login with error', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockSignOut.mockResolvedValue({ error: null });

    const profileChain = chainable({ data: { id: 'user-1', status: 'suspended' }, error: null });
    mockServiceFrom.mockReturnValue(profileChain);

    const request = makeRequest('/auth/callback?code=test-code');
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('/auth/login');
    expect(location).toContain('error=suspended');
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('blocks inactive user and redirects to login with error', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    mockSignOut.mockResolvedValue({ error: null });

    const profileChain = chainable({ data: { id: 'user-1', status: 'inactive' }, error: null });
    mockServiceFrom.mockReturnValue(profileChain);

    const request = makeRequest('/auth/callback?code=test-code');
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('/auth/login');
    expect(location).toContain('error=suspended');
  });

  it('sanitizes redirect path to prevent open redirect', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const profileChain = chainable({ data: { id: 'user-1', status: 'active' }, error: null });
    const countChain = chainable({ data: null, error: null, count: 5 });
    const upsertChain = chainable({ data: null, error: null });

    let fromCallCount = 0;
    mockServiceFrom.mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) return profileChain;
      if (fromCallCount === 2) return countChain;
      return upsertChain;
    });

    const request = makeRequest('/auth/callback?code=test-code&next=//evil.com');
    const response = await GET(request);

    const location = response.headers.get('location');
    // Should sanitize to /dashboard, not redirect to evil.com
    expect(location).toContain('/dashboard');
    expect(location).not.toContain('evil.com');
  });

  it('sanitizes redirect path with protocol injection', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const profileChain = chainable({ data: { id: 'user-1', status: 'active' }, error: null });
    const countChain = chainable({ data: null, error: null, count: 5 });
    const upsertChain = chainable({ data: null, error: null });

    let fromCallCount = 0;
    mockServiceFrom.mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) return profileChain;
      if (fromCallCount === 2) return countChain;
      return upsertChain;
    });

    const request = makeRequest('/auth/callback?code=test-code&next=https://evil.com');
    const response = await GET(request);

    const location = response.headers.get('location');
    expect(location).toContain('/dashboard');
    expect(location).not.toContain('evil.com');
  });
});
