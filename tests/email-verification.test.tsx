import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { Suspense } from 'react';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn(), push: vi.fn() })),
  useSearchParams: vi.fn(() => ({ get: vi.fn().mockReturnValue(null) })),
}));

// Mock auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

// Mutable mock user so reload() can flip emailVerified
const mockCurrentUser = {
  email: 'test@example.com',
  emailVerified: false,
  reload: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: mockCurrentUser },
}));

vi.mock('firebase/auth', () => ({
  sendEmailVerification: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
  applyActionCode: vi.fn().mockResolvedValue(undefined),
}));

// Stub sub-components so login page renders without deep dependency chains
vi.mock('@/components/auth-screen', () => ({
  AuthScreen: () => <div data-testid='auth-screen' />,
}));
vi.mock('@/components/auth-form', () => ({
  AuthForm: () => null,
}));
vi.mock('@firebase-oss/ui-react', () => ({
  GoogleSignInButton: () => null,
  useOnUserAuthenticated: vi.fn(),
}));

const { useAuth } = await import('@/contexts/auth-context');
const mockUseAuth = vi.mocked(useAuth);

const { useRouter } = await import('next/navigation');
const mockUseRouter = vi.mocked(useRouter);

const { sendEmailVerification, signOut, applyActionCode } =
  await import('firebase/auth');
const mockSendEmailVerification = vi.mocked(sendEmailVerification);
const mockSignOut = vi.mocked(signOut);
const mockApplyActionCode = vi.mocked(applyActionCode);

const mockReplace = vi.fn();
const mockUser = { id: 'uid-1', displayName: 'Test' };

const mockRefreshEmailVerified = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  vi.clearAllMocks();
  mockCurrentUser.emailVerified = false;
  mockCurrentUser.reload.mockResolvedValue(undefined);
  mockRefreshEmailVerified.mockResolvedValue(undefined);
  mockUseRouter.mockReturnValue({
    replace: mockReplace,
    push: vi.fn(),
  } as never);
  mockUseAuth.mockReturnValue({
    user: null,
    loading: false,
    emailVerified: false,
    refreshEmailVerified: mockRefreshEmailVerified,
  } as never);
});

async function renderLoginPage() {
  const { default: LoginPage } = await import('@/app/login/page');
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <LoginPage />
      </Suspense>,
    );
  });
}

async function renderVerificationScreen() {
  const { EmailVerificationScreen } =
    await import('@/components/email-verification-screen');
  const onVerified = vi.fn();
  const onSignOut = vi.fn();
  await act(async () => {
    render(
      <EmailVerificationScreen
        email='test@example.com'
        onVerified={onVerified}
        onSignOut={onSignOut}
      />,
    );
  });
  return { onVerified, onSignOut };
}

// ─── Rendering guards ─────────────────────────────────────────────────────────

describe('Email verification — login page rendering', () => {
  it('shows the verification screen when user is signed in but email is not verified', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser as never,
      loading: false,
      emailVerified: false,
      refreshEmailVerified: mockRefreshEmailVerified,
    });
    await renderLoginPage();
    await waitFor(() =>
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument(),
    );
    expect(screen.queryByRole('button', { name: /sign in/i })).toBeNull();
  });

  it('does not show the verification screen when the user email is verified', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser as never,
      loading: false,
      emailVerified: true,
      refreshEmailVerified: mockRefreshEmailVerified,
    });
    await renderLoginPage();
    expect(screen.queryByText(/check your inbox/i)).toBeNull();
  });

  it('does not show the verification screen for OAuth users (emailVerified is always true)', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser as never,
      loading: false,
      emailVerified: true,
      refreshEmailVerified: mockRefreshEmailVerified,
    });
    await renderLoginPage();
    expect(screen.queryByText(/check your inbox/i)).toBeNull();
  });
});

// ─── Button behaviours ────────────────────────────────────────────────────────

describe('Email verification — verification screen buttons', () => {
  it('"Resend email" calls sendEmailVerification and shows a success message', async () => {
    await renderVerificationScreen();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /resend email/i }));
    });
    await waitFor(() =>
      expect(mockSendEmailVerification).toHaveBeenCalledOnce(),
    );
    expect(screen.getByText(/verification email sent/i)).toBeInTheDocument();
  });

  it('"Check again" calls onVerified when email is now verified', async () => {
    mockCurrentUser.reload.mockImplementation(() => {
      mockCurrentUser.emailVerified = true;
      return Promise.resolve(undefined);
    });
    const { onVerified } = await renderVerificationScreen();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /check again/i }));
    });
    await waitFor(() => expect(onVerified).toHaveBeenCalledOnce());
  });

  it('"Check again" shows "Not verified yet" when email is still unverified', async () => {
    mockCurrentUser.emailVerified = false;
    await renderVerificationScreen();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /check again/i }));
    });
    await waitFor(() =>
      expect(screen.getByText(/not verified yet/i)).toBeInTheDocument(),
    );
  });

  it('"Sign out" button calls signOut', async () => {
    const { onSignOut } = await renderVerificationScreen();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
    });
    await waitFor(() => expect(mockSignOut).toHaveBeenCalledOnce());
    expect(onSignOut).toHaveBeenCalledOnce();
  });
});

// ─── Login page — Check again flow ───────────────────────────────────────────

describe('Email verification — login page Check again flow', () => {
  it('calls refreshEmailVerified then navigates when Check again confirms verification', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser as never,
      loading: false,
      emailVerified: false,
      refreshEmailVerified: mockRefreshEmailVerified,
    });
    mockCurrentUser.reload.mockImplementation(() => {
      mockCurrentUser.emailVerified = true;
      return Promise.resolve(undefined);
    });

    await renderLoginPage();
    await waitFor(() =>
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /check again/i }));
    });

    await waitFor(() =>
      expect(mockRefreshEmailVerified).toHaveBeenCalledOnce(),
    );
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});

// ─── Auth action page ─────────────────────────────────────────────────────────

const { useSearchParams } = await import('next/navigation');
const mockUseSearchParams = vi.mocked(useSearchParams);

function makeSearchParams(params: Record<string, string>) {
  return { get: (key: string) => params[key] ?? null } as never;
}

async function renderActionPage() {
  const { default: AuthActionPage } = await import('@/app/auth/action/page');
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <AuthActionPage />
      </Suspense>,
    );
  });
}

describe('Auth action page — email verification', () => {
  it('shows loading state initially', async () => {
    mockApplyActionCode.mockReturnValue(new Promise(() => {}));
    mockUseSearchParams.mockReturnValue(
      makeSearchParams({ mode: 'verifyEmail', oobCode: 'abc123' }),
    );
    await renderActionPage();
    expect(screen.getByText(/verifying/i)).toBeInTheDocument();
  });

  it('shows success state after applyActionCode resolves', async () => {
    mockApplyActionCode.mockResolvedValue(undefined);
    mockUseSearchParams.mockReturnValue(
      makeSearchParams({ mode: 'verifyEmail', oobCode: 'abc123' }),
    );
    await renderActionPage();
    await waitFor(() =>
      expect(screen.getByText(/email verified/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: /go to app/i }),
    ).toBeInTheDocument();
  });

  it('calls refreshEmailVerified after applyActionCode so the auth context is updated', async () => {
    mockApplyActionCode.mockResolvedValue(undefined);
    mockUseSearchParams.mockReturnValue(
      makeSearchParams({ mode: 'verifyEmail', oobCode: 'abc123' }),
    );
    await renderActionPage();
    await waitFor(() =>
      expect(mockRefreshEmailVerified).toHaveBeenCalledOnce(),
    );
  });

  it('shows error state when applyActionCode rejects', async () => {
    mockApplyActionCode.mockRejectedValue(new Error('expired'));
    mockUseSearchParams.mockReturnValue(
      makeSearchParams({ mode: 'verifyEmail', oobCode: 'abc123' }),
    );
    await renderActionPage();
    await waitFor(() =>
      expect(screen.getByText(/link invalid/i)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: /go to sign in/i }),
    ).toBeInTheDocument();
  });

  it('shows error state when mode or oobCode is missing', async () => {
    mockUseSearchParams.mockReturnValue(makeSearchParams({}));
    await renderActionPage();
    await waitFor(() =>
      expect(screen.getByText(/link invalid/i)).toBeInTheDocument(),
    );
  });
});
