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
  renameComparison: vi.fn(),
  getNutritionSettings: vi.fn().mockResolvedValue(null),
  saveNutritionSettings: vi.fn().mockResolvedValue(undefined),
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
  auth: {
    currentUser: {
      email: 'test@example.com',
      providerData: [{ providerId: 'password' }],
    },
  },
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

const {
  getSavedProducts,
  getSavedComparisons,
  deleteProduct,
  deleteComparison,
  renameComparison,
  getNutritionSettings,
} = await import('@/lib/firestore');
const mockGetSavedProducts = vi.mocked(getSavedProducts);
const mockGetSavedComparisons = vi.mocked(getSavedComparisons);
const mockDeleteProduct = vi.mocked(deleteProduct);
const mockDeleteComparison = vi.mocked(deleteComparison);
const mockRenameComparison = vi.mocked(renameComparison);
const mockGetNutritionSettings = vi.mocked(getNutritionSettings);

const mockUser = { id: 'uid-123', displayName: 'Test User' };
const mockPush = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: mockPush } as never);
  mockGetSavedProducts.mockResolvedValue([]);
  mockGetSavedComparisons.mockResolvedValue([]);
});

async function renderSettings(tab?: string) {
  const { default: SettingsPage } =
    await import('@/app/settings/[[...tab]]/page');
  const params = Promise.resolve(tab ? { tab: [tab] } : {});
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <SettingsPage params={params} />
      </Suspense>,
    );
  });
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
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /^settings$/i, level: 1 }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('link', { name: /^account$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /^nutrition$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /^products$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /^comparisons$/i }),
    ).toBeInTheDocument();
  });

  it('renders the logout button', async () => {
    await renderSettings();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /log out/i }),
      ).toBeInTheDocument(),
    );
  });

  it('renders the correct section subheader for the products tab', async () => {
    await renderSettings('products');
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /products/i, level: 2 }),
      ).toBeInTheDocument(),
    );
  });

  it('renders the correct section subheader for the comparisons tab', async () => {
    await renderSettings('comparisons');
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
    await waitFor(() =>
      expect(
        screen.getByRole('textbox', { name: /display name/i }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: /save name/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /change password/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /delete account/i }),
    ).toBeInTheDocument();
  });

  it('shows inline confirmation when delete account is clicked', async () => {
    await renderSettings();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /delete account/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /delete account/i }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /yes, delete/i }),
      ).toBeInTheDocument(),
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
    await renderSettings('products');
    await waitFor(() =>
      expect(screen.getByText(/no saved products yet/i)).toBeInTheDocument(),
    );
  });

  it('renders table with saved products including Name, EAN Code, and Actions columns', async () => {
    mockGetSavedProducts.mockResolvedValue([
      { id: 'p1', name: 'Nutella', ean: '5000112637922' },
    ]);
    await renderSettings('products');
    await waitFor(() =>
      expect(screen.getByText('Nutella')).toBeInTheDocument(),
    );
    expect(screen.getByText('5000112637922')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /view nutella/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /unsave nutella/i }),
    ).toBeInTheDocument();
  });

  it('clicking Unsave calls deleteProduct and removes the row', async () => {
    mockGetSavedProducts.mockResolvedValue([
      { id: 'p1', name: 'Nutella', ean: '5000112637922' },
    ]);
    mockDeleteProduct.mockResolvedValue(undefined);
    await renderSettings('products');
    await waitFor(() =>
      expect(screen.getByText('Nutella')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /unsave nutella/i }));
    await waitFor(() =>
      expect(mockDeleteProduct).toHaveBeenCalledWith(
        'uid-123',
        '5000112637922',
      ),
    );
    await waitFor(() => expect(screen.queryByText('Nutella')).toBeNull());
  });
});

// ─── Comparisons tab ──────────────────────────────────────────────────────────

describe('Settings page — Comparisons tab', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: mockUser as never, loading: false });
  });

  it('shows empty state when there are no saved comparisons', async () => {
    mockGetSavedComparisons.mockResolvedValue([]);
    await renderSettings('comparisons');
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
    await renderSettings('comparisons');
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
    await renderSettings('comparisons');
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

  it('clicking the pencil shows an input pre-filled with the current name', async () => {
    mockGetSavedComparisons.mockResolvedValue([
      { id: 'c1', name: 'Nutella + 1 others', eans: ['111', '222'] },
    ]);
    await renderSettings('comparisons');
    await waitFor(() =>
      expect(screen.getByText('Nutella + 1 others')).toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /rename nutella \+ 1 others/i }),
    );
    const input = screen.getByDisplayValue(
      'Nutella + 1 others',
    ) as HTMLInputElement;
    expect(input.value).toBe('Nutella + 1 others');
    expect(
      screen.getByRole('button', { name: /save name/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('clicking cancel restores the original name without calling renameComparison', async () => {
    mockGetSavedComparisons.mockResolvedValue([
      { id: 'c1', name: 'Nutella + 1 others', eans: ['111', '222'] },
    ]);
    await renderSettings('comparisons');
    await waitFor(() =>
      expect(screen.getByText('Nutella + 1 others')).toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /rename nutella \+ 1 others/i }),
    );
    fireEvent.change(screen.getByDisplayValue('Nutella + 1 others'), {
      target: { value: 'Changed name' },
    });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.getByText('Nutella + 1 others')).toBeInTheDocument();
    expect(mockRenameComparison).not.toHaveBeenCalled();
  });

  it('search input is not rendered when there are no saved comparisons', async () => {
    mockGetSavedComparisons.mockResolvedValue([]);
    await renderSettings('comparisons');
    await waitFor(() =>
      expect(screen.getByText(/no saved comparisons yet/i)).toBeInTheDocument(),
    );
    expect(screen.queryByPlaceholderText(/search by name or ean/i)).toBeNull();
  });

  it('saving a new name calls renameComparison and updates the displayed name', async () => {
    mockGetSavedComparisons.mockResolvedValue([
      { id: 'c1', name: 'Nutella + 1 others', eans: ['111', '222'] },
    ]);
    mockRenameComparison.mockResolvedValue(undefined);
    await renderSettings('comparisons');
    await waitFor(() =>
      expect(screen.getByText('Nutella + 1 others')).toBeInTheDocument(),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /rename nutella \+ 1 others/i }),
    );
    fireEvent.change(screen.getByDisplayValue('Nutella + 1 others'), {
      target: { value: 'My comparison' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save name/i }));
    await waitFor(() =>
      expect(mockRenameComparison).toHaveBeenCalledWith(
        'uid-123',
        'c1',
        'My comparison',
      ),
    );
    await waitFor(() =>
      expect(screen.getByText('My comparison')).toBeInTheDocument(),
    );
    expect(screen.queryByDisplayValue('My comparison')).toBeNull();
  });
});

// ─── Products tab — compare selection ────────────────────────────────────────

describe('Settings page — Products tab — compare selection', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: mockUser as never, loading: false });
    mockGetSavedProducts.mockResolvedValue([
      { id: 'p1', name: 'Nutella', ean: '5000112637922' },
      { id: 'p2', name: 'Skippy', ean: '8076809513388' },
      { id: 'p3', name: 'Jif', ean: '1111111111111' },
    ]);
  });

  it('does not show the compare button when fewer than 2 products are selected', async () => {
    await renderSettings('products');
    await waitFor(() =>
      expect(screen.getByText('Nutella')).toBeInTheDocument(),
    );
    expect(screen.queryByRole('link', { name: /compare/i })).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: /select nutella/i }));
    expect(screen.queryByRole('link', { name: /compare 1/i })).toBeNull();
  });

  it('shows the compare button when 2 products are selected', async () => {
    await renderSettings('products');
    await waitFor(() =>
      expect(screen.getByText('Nutella')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /select nutella/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /select skippy/i }));
    expect(
      screen.getByRole('link', { name: /compare 2 products/i }),
    ).toBeInTheDocument();
  });

  it('compare button href contains the selected EANs', async () => {
    await renderSettings('products');
    await waitFor(() =>
      expect(screen.getByText('Nutella')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /select nutella/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /select skippy/i }));
    const link = screen.getByRole('link', {
      name: /compare 2 products/i,
    }) as HTMLAnchorElement;
    expect(link.href).toContain('5000112637922');
    expect(link.href).toContain('8076809513388');
  });

  it('updates the compare button count as more products are selected', async () => {
    await renderSettings('products');
    await waitFor(() =>
      expect(screen.getByText('Nutella')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /select nutella/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /select skippy/i }));
    expect(
      screen.getByRole('link', { name: /compare 2 products/i }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /select jif/i }));
    expect(
      screen.getByRole('link', { name: /compare 3 products/i }),
    ).toBeInTheDocument();
  });

  it('deselecting a product removes its EAN from the compare link', async () => {
    await renderSettings('products');
    await waitFor(() =>
      expect(screen.getByText('Nutella')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /select nutella/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /select skippy/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /select nutella/i }));
    expect(screen.queryByRole('link', { name: /compare/i })).toBeNull();
  });

  it('unsaving a selected product removes it from the selection', async () => {
    mockDeleteProduct.mockResolvedValue(undefined);
    await renderSettings('products');
    await waitFor(() =>
      expect(screen.getByText('Nutella')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /select nutella/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /select skippy/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /select jif/i }));
    fireEvent.click(screen.getByRole('button', { name: /unsave nutella/i }));
    await waitFor(() => expect(screen.queryByText('Nutella')).toBeNull());
    const link = screen.getByRole('link', {
      name: /compare 2 products/i,
    }) as HTMLAnchorElement;
    expect(link.href).not.toContain('5000112637922');
    expect(link.href).toContain('8076809513388');
    expect(link.href).toContain('1111111111111');
  });
});

// ─── Products tab — search ────────────────────────────────────────────────────

describe('Settings page — Products tab — search', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: mockUser as never, loading: false });
    mockGetSavedProducts.mockResolvedValue([
      { id: 'p1', name: 'Nutella', ean: '5000112637922' },
      { id: 'p2', name: 'Skippy', ean: '8076809513388' },
    ]);
  });

  it('search input is not rendered when there are no saved products', async () => {
    mockGetSavedProducts.mockResolvedValue([]);
    await renderSettings('products');
    await waitFor(() =>
      expect(screen.getByText(/no saved products yet/i)).toBeInTheDocument(),
    );
    expect(screen.queryByPlaceholderText(/search by name or ean/i)).toBeNull();
  });

  it('filters products by name', async () => {
    await renderSettings('products');
    await waitFor(() =>
      expect(screen.getByText('Nutella')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByPlaceholderText(/search by name or ean/i), {
      target: { value: 'nut' },
    });
    expect(screen.getByText('Nutella')).toBeInTheDocument();
    expect(screen.queryByText('Skippy')).toBeNull();
  });

  it('filters products by EAN', async () => {
    await renderSettings('products');
    await waitFor(() =>
      expect(screen.getByText('Nutella')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByPlaceholderText(/search by name or ean/i), {
      target: { value: '8076' },
    });
    expect(screen.getByText('Skippy')).toBeInTheDocument();
    expect(screen.queryByText('Nutella')).toBeNull();
  });

  it('shows empty message when no products match the search', async () => {
    await renderSettings('products');
    await waitFor(() =>
      expect(screen.getByText('Nutella')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByPlaceholderText(/search by name or ean/i), {
      target: { value: 'xyz' },
    });
    expect(
      screen.getByText(/no products match your search/i),
    ).toBeInTheDocument();
  });

  it('clearing the search restores all products', async () => {
    await renderSettings('products');
    await waitFor(() =>
      expect(screen.getByText('Nutella')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByPlaceholderText(/search by name or ean/i), {
      target: { value: 'nut' },
    });
    expect(screen.queryByText('Skippy')).toBeNull();
    fireEvent.change(screen.getByPlaceholderText(/search by name or ean/i), {
      target: { value: '' },
    });
    expect(screen.getByText('Nutella')).toBeInTheDocument();
    expect(screen.getByText('Skippy')).toBeInTheDocument();
  });
});

// ─── Comparisons tab — search ─────────────────────────────────────────────────

describe('Settings page — Comparisons tab — search', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: mockUser as never, loading: false });
    mockGetSavedComparisons.mockResolvedValue([
      {
        id: 'c1',
        name: 'Nutella + 1 others',
        eans: ['5000112637922', '8076809513388'],
      },
      {
        id: 'c2',
        name: 'Skippy vs Jif',
        eans: ['1111111111111', '2222222222222'],
      },
    ]);
  });

  it('filters comparisons by name', async () => {
    await renderSettings('comparisons');
    await waitFor(() =>
      expect(screen.getByText('Nutella + 1 others')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByPlaceholderText(/search by name or ean/i), {
      target: { value: 'skippy' },
    });
    expect(screen.getByText('Skippy vs Jif')).toBeInTheDocument();
    expect(screen.queryByText('Nutella + 1 others')).toBeNull();
  });

  it('filters comparisons by EAN', async () => {
    await renderSettings('comparisons');
    await waitFor(() =>
      expect(screen.getByText('Nutella + 1 others')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByPlaceholderText(/search by name or ean/i), {
      target: { value: '5000112637922' },
    });
    expect(screen.getByText('Nutella + 1 others')).toBeInTheDocument();
    expect(screen.queryByText('Skippy vs Jif')).toBeNull();
  });

  it('shows empty message when no comparisons match the search', async () => {
    await renderSettings('comparisons');
    await waitFor(() =>
      expect(screen.getByText('Nutella + 1 others')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByPlaceholderText(/search by name or ean/i), {
      target: { value: 'xyz' },
    });
    expect(
      screen.getByText(/no comparisons match your search/i),
    ).toBeInTheDocument();
  });

  it('clearing the search restores all comparisons', async () => {
    await renderSettings('comparisons');
    await waitFor(() =>
      expect(screen.getByText('Nutella + 1 others')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByPlaceholderText(/search by name or ean/i), {
      target: { value: 'skippy' },
    });
    expect(screen.queryByText('Nutella + 1 others')).toBeNull();
    fireEvent.change(screen.getByPlaceholderText(/search by name or ean/i), {
      target: { value: '' },
    });
    expect(screen.getByText('Nutella + 1 others')).toBeInTheDocument();
    expect(screen.getByText('Skippy vs Jif')).toBeInTheDocument();
  });
});

// ─── Nutrition tab — rulesets search ─────────────────────────────────────────

describe('Settings page — Nutrition tab — rulesets search', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: mockUser as never, loading: false });
    mockGetNutritionSettings.mockResolvedValue({
      visibleRows: [],
      showCrown: true,
      showFlag: true,
      rowOrder: [],
      rulesets: [
        { id: 'r1', name: 'Balanced', rules: [] },
        { id: 'r2', name: 'Low Sugar', rules: [] },
      ],
    });
  });

  it('filters rulesets by name', async () => {
    await renderSettings('nutrition');
    await waitFor(() =>
      expect(screen.getByText('Balanced')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByPlaceholderText(/search by name/i), {
      target: { value: 'sugar' },
    });
    expect(screen.getByText('Low Sugar')).toBeInTheDocument();
    expect(screen.queryByText('Balanced')).toBeNull();
  });

  it('shows empty message when no rulesets match the search', async () => {
    await renderSettings('nutrition');
    await waitFor(() =>
      expect(screen.getByText('Balanced')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByPlaceholderText(/search by name/i), {
      target: { value: 'xyz' },
    });
    expect(
      screen.getByText(/no rulesets match your search/i),
    ).toBeInTheDocument();
  });

  it('clearing the search restores all rulesets', async () => {
    await renderSettings('nutrition');
    await waitFor(() =>
      expect(screen.getByText('Balanced')).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByPlaceholderText(/search by name/i), {
      target: { value: 'sugar' },
    });
    expect(screen.queryByText('Balanced')).toBeNull();
    fireEvent.change(screen.getByPlaceholderText(/search by name/i), {
      target: { value: '' },
    });
    expect(screen.getByText('Balanced')).toBeInTheDocument();
    expect(screen.getByText('Low Sugar')).toBeInTheDocument();
  });
});
