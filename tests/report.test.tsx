import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { NutritionTable } from '@/components/nutrition-table';
import type { ProductNutrition } from '@/types/openfoodfacts';
import type { Report } from '@/types/firestore';
import { Suspense } from 'react';
import { vi } from 'vitest';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
  useSearchParams: vi.fn(() => ({ get: () => null })),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(() => ({ user: null, loading: false })),
}));

vi.mock('@/lib/firestore', () => ({
  getAllReports: vi.fn(),
  updateReportStatus: vi.fn().mockResolvedValue(undefined),
  getSavedProductEans: vi.fn().mockResolvedValue(new Set()),
  findSavedComparison: vi.fn().mockResolvedValue(null),
  getNutritionSettings: vi.fn().mockResolvedValue(null),
  saveProduct: vi.fn(),
  saveComparison: vi.fn(),
  deleteProduct: vi.fn(),
  deleteComparisonById: vi.fn(),
  updateComparisonEans: vi.fn(),
  updateComparisonRuleset: vi.fn(),
}));

vi.mock('@/lib/reports', () => ({
  submitReport: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/openfoodfacts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/openfoodfacts')>();
  return { ...actual, fetchProduct: vi.fn() };
});

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────

const { useAuth } = await import('@/contexts/auth-context');
const mockUseAuth = vi.mocked(useAuth);

const { getAllReports, updateReportStatus } = await import('@/lib/firestore');
const mockGetAllReports = vi.mocked(getAllReports);
const mockUpdateReportStatus = vi.mocked(updateReportStatus);

const { submitReport } = await import('@/lib/reports');
const mockSubmitReport = vi.mocked(submitReport);

const { fetchProduct } = await import('@/lib/openfoodfacts');
const mockFetchProduct = vi.mocked(fetchProduct);

const { useRouter } = await import('next/navigation');
const mockUseRouter = vi.mocked(useRouter);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProduct(
  overrides: Partial<ProductNutrition> = {},
): ProductNutrition {
  return {
    code: '12345670',
    product_name: 'Test Product',
    kcals: 100,
    protein: 5,
    carbohydrates: 20,
    sugar: 10,
    fat: 3,
    saturated_fat: 1,
    fiber: 2,
    salt: 0.5,
    ...overrides,
  };
}

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    code: '12345678',
    date: { toDate: () => new Date('2024-01-15') } as Report['date'],
    reason: 'missing product',
    status: 'open',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({
    user: null,
    loading: false,
    emailVerified: false,
    refreshEmailVerified: vi.fn(),
  });
});

// ─── Test 1: Report item renders with warning color ───────────────────────────

describe('NutritionTable — Report dropdown item', () => {
  it('renders with warning color class', async () => {
    const onReport = vi.fn();
    render(
      <NutritionTable
        products={[makeProduct()]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onReport={onReport}
      />,
    );

    const trigger = screen.getByRole('button', {
      name: /options for test product/i,
    });
    fireEvent.click(trigger);

    const reportItem = await screen.findByRole('menuitem', { name: /report/i });
    expect(reportItem.className).toMatch(/text-warning/);
  });

  // ─── Test 2: Clicking Report calls onReport ───────────────────────────────

  it('calls onReport with the product code when clicked', async () => {
    const onReport = vi.fn();
    render(
      <NutritionTable
        products={[makeProduct({ code: '12345678' })]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onReport={onReport}
      />,
    );

    const trigger = screen.getByRole('button', {
      name: /options for test product/i,
    });
    fireEvent.click(trigger);

    const reportItem = await screen.findByRole('menuitem', { name: /report/i });
    fireEvent.click(reportItem);

    expect(onReport).toHaveBeenCalledWith('12345678');
  });
});

// ─── Tests 3–5: Compare page dialog and silent reports ───────────────────────

describe('Compare page — report dialog', () => {
  async function renderAndSearch(product: ProductNutrition | null) {
    const ComparePage = (await import('@/app/compare/page')).default;
    render(
      <Suspense fallback={null}>
        <ComparePage />
      </Suspense>,
    );

    await screen.findByRole('textbox', { name: /ean barcodes/i });

    if (product !== null) {
      mockFetchProduct.mockResolvedValue(product);
    } else {
      mockFetchProduct.mockResolvedValue(null);
    }

    fireEvent.change(screen.getByRole('textbox', { name: /ean barcodes/i }), {
      target: { value: '12345670' },
    });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));
  }

  it('opens the AlertDialog with correct text when Report is clicked', async () => {
    await renderAndSearch(makeProduct());

    await screen.findByText('Test Product');

    const trigger = screen.getByRole('button', {
      name: /options for test product/i,
    });
    fireEvent.click(trigger);

    const reportItem = await screen.findByRole('menuitem', {
      name: /^report$/i,
    });
    fireEvent.click(reportItem);

    await screen.findByText('Report product data');
    expect(
      screen.getByText(/report missing or incorrect product data/i),
    ).toBeInTheDocument();
  });

  it('Cancel closes the dialog without calling submitReport', async () => {
    await renderAndSearch(makeProduct());
    await screen.findByText('Test Product');

    fireEvent.click(
      screen.getByRole('button', { name: /options for test product/i }),
    );
    fireEvent.click(await screen.findByRole('menuitem', { name: /^report$/i }));
    await screen.findByText('Report product data');

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByText('Report product data')).not.toBeInTheDocument();
    });
    expect(mockSubmitReport).not.toHaveBeenCalled();
  });

  it('Confirm calls submitReport with incorrect data, shows toast, and closes dialog', async () => {
    const { toast } = await import('sonner');
    await renderAndSearch(makeProduct());
    await screen.findByText('Test Product');

    fireEvent.click(
      screen.getByRole('button', { name: /options for test product/i }),
    );
    fireEvent.click(await screen.findByRole('menuitem', { name: /^report$/i }));
    await screen.findByText('Report product data');

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(mockSubmitReport).toHaveBeenCalledWith(
        '12345670',
        'incorrect data',
      );
    });
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Report submitted');
    await waitFor(() => {
      expect(screen.queryByText('Report product data')).not.toBeInTheDocument();
    });
  });

  it('calls submitReport with missing product when fetchProduct returns null', async () => {
    await renderAndSearch(null);

    await waitFor(() => {
      expect(mockSubmitReport).toHaveBeenCalledWith(
        '12345670',
        'missing product',
      );
    });
  });
});

// ─── Tests 6–10: Admin page ───────────────────────────────────────────────────

describe('Admin page', () => {
  async function renderAdmin() {
    mockUseAuth.mockReturnValue({
      user: { id: 'admin-uid', displayName: 'Admin' },
      loading: false,
      emailVerified: true,
      refreshEmailVerified: vi.fn(),
    });
    const AdminPage = (await import('@/app/admin/page')).default;
    render(<AdminPage />);
  }

  it('redirects to / when not authenticated', async () => {
    const mockReplace = vi.fn();
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as unknown as ReturnType<typeof useRouter>);

    const AdminPage = (await import('@/app/admin/page')).default;
    render(<AdminPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('redirects to / when getAllReports throws a permission error', async () => {
    const mockReplace = vi.fn();
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as unknown as ReturnType<typeof useRouter>);
    mockGetAllReports.mockRejectedValue(new Error('permission-denied'));

    await renderAdmin();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('renders the report list for an admin user', async () => {
    mockGetAllReports.mockResolvedValue([
      makeReport({ code: '12345678', status: 'open' }),
      makeReport({
        code: '87654321',
        status: 'open',
        reason: 'incorrect data',
      }),
    ]);

    await renderAdmin();

    await screen.findByText('12345678');
    expect(screen.getByText('87654321')).toBeInTheDocument();
  });

  it('calls updateReportStatus with solved when Solved is clicked', async () => {
    mockGetAllReports.mockResolvedValue([makeReport({ code: '12345678' })]);

    await renderAdmin();
    await screen.findByText('12345678');

    fireEvent.click(
      screen.getByRole('button', { name: /actions for 12345678/i }),
    );
    fireEvent.click(await screen.findByText('Change status'));
    fireEvent.click(await screen.findByRole('menuitem', { name: /^solved$/i }));

    await waitFor(() => {
      expect(mockUpdateReportStatus).toHaveBeenCalledWith('12345678', 'solved');
    });
  });

  it('calls updateReportStatus with dismissed when Dismissed is clicked', async () => {
    mockGetAllReports.mockResolvedValue([makeReport({ code: '12345678' })]);

    await renderAdmin();
    await screen.findByText('12345678');

    fireEvent.click(
      screen.getByRole('button', { name: /actions for 12345678/i }),
    );
    fireEvent.click(await screen.findByText('Change status'));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: /^dismissed$/i }),
    );

    await waitFor(() => {
      expect(mockUpdateReportStatus).toHaveBeenCalledWith(
        '12345678',
        'dismissed',
      );
    });
  });

  it('status filter shows only matching reports', async () => {
    mockGetAllReports.mockResolvedValue([
      makeReport({ code: '11111111', status: 'open' }),
      makeReport({ code: '22222222', status: 'solved' }),
      makeReport({ code: '33333333', status: 'dismissed' }),
    ]);

    await renderAdmin();
    await screen.findByText('11111111');

    fireEvent.click(screen.getByRole('button', { name: /^open/i }));

    await waitFor(() => {
      expect(screen.getByText('11111111')).toBeInTheDocument();
      expect(screen.queryByText('22222222')).not.toBeInTheDocument();
      expect(screen.queryByText('33333333')).not.toBeInTheDocument();
    });
  });
});
