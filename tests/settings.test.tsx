import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// Mock auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

// Mock firestore helpers
vi.mock('@/lib/firestore', () => ({
  getSavedProducts: vi.fn(),
  getSavedComparisons: vi.fn(),
  deleteProduct: vi.fn(),
  deleteComparison: vi.fn(),
}));

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
  updateProfile: vi.fn().mockResolvedValue(undefined),
  updatePassword: vi.fn().mockResolvedValue(undefined),
  deleteUser: vi.fn().mockResolvedValue(undefined),
  reauthenticateWithCredential: vi.fn().mockResolvedValue(undefined),
  EmailAuthProvider: { credential: vi.fn() },
}));

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  getFirestore: vi.fn(),
}));

// Mock @/lib/firebase
vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: { email: 'test@example.com', providerData: [{ providerId: 'password' }] } },
  db: {},
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const { useAuth } = await import('@/contexts/auth-context');
const mockUseAuth = vi.mocked(useAuth);

const { useRouter } = await import('next/navigation');
const mockUseRouter = vi.mocked(useRouter);

const { getSavedProducts, getSavedComparisons, deleteProduct, deleteComparison } =
  await import('@/lib/firestore');
const mockGetSavedProducts = vi.mocked(getSavedProducts);
const mockGetSavedComparisons = vi.mocked(getSavedComparisons);
const mockDeleteProduct = vi.mocked(deleteProduct);
const mockDeleteComparison = vi.mocked(deleteComparison);

const mockUser = { id: 'uid-123', displayName: 'Test User' };
const mockPush = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: mockPush } as never);
  mockGetSavedProducts.mockResolvedValue([]);
  mockGetSavedComparisons.mockResolvedValue([]);
});

async function renderSettings() {
  const { default: SettingsPage } = await import('@/app/settings/page');
  render(<SettingsPage />);
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

describe('Settings page — auth guard', () => {
  it('redirects to /login when user is null after loading', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    await renderSettings();
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=/settings'),
    );
  });

  it('renders nothing while loading', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    await renderSettings();
    expect(screen.queryByRole('heading', { name: /settings/i })).toBeNull();
  });
});

// ─── Layout ───────────────────────────────────────────────────────────────────

describe('Settings page — layout', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: mockUser as never, loading: false });
  });

  it('renders "Settings" header and all four sidebar tabs when authenticated', async () => {
    await renderSettings();
    expect(
      screen.getByRole('heading', { name: /^settings$/i, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^account$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^nutrition$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^products$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^comparisons$/i })).toBeInTheDocument();
  });

  it('renders the logout button', async () => {
    await renderSettings();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('switching tabs renders the correct section subheader', async () => {
    await renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /^products$/i }));
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /products/i, level: 2 }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /^comparisons$/i }));
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /comparisons/i, level: 2 }),
      ).toBeInTheDocument(),
    );
  });
});

// ─── Account tab ──────────────────────────────────────────────────────────────

describe('Settings page — Account tab', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: mockUser as never, loading: false });
  });

  it('renders display name input, password section, and delete account button', async () => {
    await renderSettings();
    expect(screen.getByRole('textbox', { name: /display name/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save name/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
  });

  it('shows inline confirmation when delete account is clicked', async () => {
    await renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /yes, delete/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });
});

// ─── Products tab ─────────────────────────────────────────────────────────────

describe('Settings page — Products tab', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: mockUser as never, loading: false });
  });

  it('shows empty state when there are no saved products', async () => {
    mockGetSavedProducts.mockResolvedValue([]);
    await renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /^products$/i }));
    await waitFor(() =>
      expect(screen.getByText(/no saved products yet/i)).toBeInTheDocument(),
    );
  });

  it('renders table with saved products including Name, EAN Code, and Actions columns', async () => {
    mockGetSavedProducts.mockResolvedValue([
      { id: 'p1', name: 'Nutella', ean: '5000112637922' },
    ]);
    await renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /^products$/i }));
    await waitFor(() =>
      expect(screen.getByText('Nutella')).toBeInTheDocument(),
    );
    expect(screen.getByText('5000112637922')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view nutella/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unsave nutella/i })).toBeInTheDocument();
  });

  it('clicking Unsave calls deleteProduct and removes the row', async () => {
    mockGetSavedProducts.mockResolvedValue([
      { id: 'p1', name: 'Nutella', ean: '5000112637922' },
    ]);
    mockDeleteProduct.mockResolvedValue(undefined);
    await renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /^products$/i }));
    await waitFor(() =>
      expect(screen.getByText('Nutella')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /unsave nutella/i }));
    await waitFor(() =>
      expect(mockDeleteProduct).toHaveBeenCalledWith('uid-123', '5000112637922'),
    );
    await waitFor(() =>
      expect(screen.queryByText('Nutella')).toBeNull(),
    );
  });
});

// ─── Comparisons tab ──────────────────────────────────────────────────────────

describe('Settings page — Comparisons tab', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: mockUser as never, loading: false });
  });

  it('shows empty state when there are no saved comparisons', async () => {
    mockGetSavedComparisons.mockResolvedValue([]);
    await renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /^comparisons$/i }));
    await waitFor(() =>
      expect(screen.getByText(/no saved comparisons yet/i)).toBeInTheDocument(),
    );
  });

  it('renders table with saved comparisons including correct name format and EAN codes', async () => {
    mockGetSavedComparisons.mockResolvedValue([
      {
        id: 'c1',
        name: 'Nutella + 1 others',
        eans: ['5000112637922', '8076809513388'],
      },
    ]);
    await renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /^comparisons$/i }));
    await waitFor(() =>
      expect(screen.getByText('Nutella + 1 others')).toBeInTheDocument(),
    );
    expect(
      screen.getByText('5000112637922, 8076809513388'),
    ).toBeInTheDocument();
  });

  it('clicking Unsave calls deleteComparison and removes the row', async () => {
    const eans = ['5000112637922', '8076809513388'];
    mockGetSavedComparisons.mockResolvedValue([
      { id: 'c1', name: 'Nutella + 1 others', eans },
    ]);
    mockDeleteComparison.mockResolvedValue(undefined);
    await renderSettings();
    fireEvent.click(screen.getByRole('button', { name: /^comparisons$/i }));
    await waitFor(() =>
      expect(screen.getByText('Nutella + 1 others')).toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /unsave nutella \+ 1 others/i }),
    );
    await waitFor(() =>
      expect(mockDeleteComparison).toHaveBeenCalledWith('uid-123', eans),
    );
    await waitFor(() =>
      expect(screen.queryByText('Nutella + 1 others')).toBeNull(),
    );
  });
});
