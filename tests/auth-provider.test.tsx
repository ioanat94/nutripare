import { act, render, screen, waitFor } from '@testing-library/react';

import { vi } from 'vitest';

// ─── Firebase mocks ───────────────────────────────────────────────────────────

const mockOnAuthStateChanged = vi.fn();

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mockOnAuthStateChanged,
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ id: 'uid-1', displayName: 'Test' }),
  }),
  setDoc: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/firestore', () => ({
  saveNutritionSettings: vi.fn().mockResolvedValue(undefined),
}));

const mockCurrentUser = {
  uid: 'uid-1',
  email: 'test@example.com',
  emailVerified: false,
  reload: vi.fn().mockResolvedValue(undefined),
};

// Wrap in a container so tests can set currentUser to null
const mockAuthContainer: { currentUser: typeof mockCurrentUser | null } = {
  currentUser: mockCurrentUser,
};

vi.mock('@/lib/firebase', () => ({
  auth: new Proxy(mockAuthContainer, {
    get(target, prop) {
      if (prop === 'currentUser') return target.currentUser;
      return undefined;
    },
  }),
  db: {},
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { AuthProvider, useAuth } = await import('@/contexts/auth-context');

function AuthStatusDisplay() {
  const { emailVerified, loading } = useAuth();
  if (loading) return <div data-testid='status'>loading</div>;
  return (
    <div data-testid='status'>{emailVerified ? 'verified' : 'unverified'}</div>
  );
}

function makeFirebaseUser(emailVerified: boolean) {
  return { uid: 'uid-1', email: 'test@example.com', emailVerified };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthContainer.currentUser = mockCurrentUser;
  mockCurrentUser.emailVerified = false;
  mockCurrentUser.reload.mockResolvedValue(undefined);

  // Default: immediately call the callback with an unverified user
  mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
    callback(makeFirebaseUser(false));
    return vi.fn();
  });
});

// ─── visibilitychange ─────────────────────────────────────────────────────────

describe('AuthProvider — visibilitychange / focus listeners', () => {
  it('sets emailVerified to true when tab becomes visible and reload confirms verification', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <AuthStatusDisplay />
        </AuthProvider>,
      );
    });

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unverified'),
    );

    // Simulate the user verifying their email in another tab
    mockCurrentUser.reload.mockImplementation(() => {
      mockCurrentUser.emailVerified = true;
      return Promise.resolve(undefined);
    });

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('verified'),
    );
  });

  it('does not update emailVerified when reload shows the email is still unverified', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <AuthStatusDisplay />
        </AuthProvider>,
      );
    });

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unverified'),
    );

    // reload does not flip the flag
    mockCurrentUser.emailVerified = false;

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // still unverified
    expect(screen.getByTestId('status')).toHaveTextContent('unverified');
  });

  it('does not call reload when the tab becomes hidden', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <AuthStatusDisplay />
        </AuthProvider>,
      );
    });

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockCurrentUser.reload).not.toHaveBeenCalled();
  });

  it('sets emailVerified to true when window focus fires and reload confirms verification', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <AuthStatusDisplay />
        </AuthProvider>,
      );
    });

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unverified'),
    );

    mockCurrentUser.reload.mockImplementation(() => {
      mockCurrentUser.emailVerified = true;
      return Promise.resolve(undefined);
    });

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('verified'),
    );
  });

  it('does not call reload when the user is already verified', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(makeFirebaseUser(true));
      return vi.fn();
    });
    mockCurrentUser.emailVerified = true;

    await act(async () => {
      render(
        <AuthProvider>
          <AuthStatusDisplay />
        </AuthProvider>,
      );
    });

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockCurrentUser.reload).not.toHaveBeenCalled();
  });

  it('does not call reload when no user is signed in', async () => {
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null);
      return vi.fn();
    });
    mockAuthContainer.currentUser = null;

    await act(async () => {
      render(
        <AuthProvider>
          <AuthStatusDisplay />
        </AuthProvider>,
      );
    });

    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockCurrentUser.reload).not.toHaveBeenCalled();
  });
});
