import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockSignInWithOAuth = vi.fn();
const mockSearchParamsGet = vi.fn().mockReturnValue(null);

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  })),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => ({
    get: mockSearchParamsGet,
  })),
}));

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchParamsGet.mockReturnValue(null);
});

describe('LoginPage', () => {
  it('renders the login page with title and description', () => {
    render(<LoginPage />);

    expect(screen.getByText('Willkommen zurück')).toBeInTheDocument();
    expect(
      screen.getByText('Melden Sie sich an, um auf Ihre OKRs zuzugreifen')
    ).toBeInTheDocument();
  });

  it('renders the Google login button', () => {
    render(<LoginPage />);

    expect(screen.getByText('Mit Google anmelden')).toBeInTheDocument();
  });

  it('renders the OKR logo text', () => {
    render(<LoginPage />);

    expect(screen.getByText('OKR')).toBeInTheDocument();
    expect(screen.getByText('ADMKRS')).toBeInTheDocument();
  });

  it('renders the admin notice', () => {
    render(<LoginPage />);

    expect(
      screen.getByText(
        'Neue Konten müssen von einem Administrator freigeschaltet werden.'
      )
    ).toBeInTheDocument();
  });

  it('calls signInWithOAuth when Google button is clicked', async () => {
    mockSignInWithOAuth.mockResolvedValue({ error: null });

    render(<LoginPage />);

    const button = screen.getByText('Mit Google anmelden');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'google',
          options: expect.objectContaining({
            queryParams: expect.objectContaining({
              access_type: 'offline',
              prompt: 'select_account',
            }),
          }),
        })
      );
    });
  });

  it('shows error message when login fails', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      error: { message: 'OAuth error' },
    });

    render(<LoginPage />);

    const button = screen.getByText('Mit Google anmelden');
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.'
        )
      ).toBeInTheDocument();
    });
  });

  it('disables button during loading state', async () => {
    // Make the promise hang to keep loading
    mockSignInWithOAuth.mockReturnValue(new Promise(() => {}));

    render(<LoginPage />);

    const button = screen.getByText('Mit Google anmelden');
    fireEvent.click(button);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const loginButton = buttons.find(
        (b) => b.getAttribute('disabled') !== null
      );
      expect(loginButton).toBeDefined();
    });
  });

  it('shows suspended error when error=suspended in URL', () => {
    mockSearchParamsGet.mockImplementation((key: string) => {
      if (key === 'error') return 'suspended';
      return null;
    });

    render(<LoginPage />);

    expect(
      screen.getByText(
        'Ihr Account wurde gesperrt. Bitte kontaktieren Sie einen Administrator.'
      )
    ).toBeInTheDocument();
  });
});
