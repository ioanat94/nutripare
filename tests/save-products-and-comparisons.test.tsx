import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { NutritionTable } from '@/components/nutrition-table';
import type { ProductNutrition } from '@/types/openfoodfacts';

// Mock auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

// Mock firestore helpers
vi.mock('@/lib/firestore', () => ({
  saveProduct: vi.fn(),
  saveComparison: vi.fn(),
  deleteProduct: vi.fn(),
  deleteComparison: vi.fn(),
  getSavedProductEans: vi.fn().mockResolvedValue(new Set()),
  isComparisonSaved: vi.fn().mockResolvedValue(false),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

const { useAuth } = await import('@/contexts/auth-context');
const mockUseAuth = vi.mocked(useAuth);

const { saveProduct, saveComparison } = await import('@/lib/firestore');
const mockSaveProduct = vi.mocked(saveProduct);
const mockSaveComparison = vi.mocked(saveComparison);

const { toast } = await import('sonner');

function makeProduct(overrides: Partial<ProductNutrition> = {}): ProductNutrition {
  return {
    code: '111',
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

const mockUser = { id: 'uid-123', displayName: 'Test User' };

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── NutritionTable save button visibility ────────────────────────────────────

describe('NutritionTable — save buttons', () => {
  it('does not render save product button when onSaveProduct is not provided', () => {
    render(
      <NutritionTable
        products={[makeProduct()]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /options for test product/i }));
    expect(screen.queryByRole('menuitem', { name: /^save$/i })).toBeNull();
  });

  it('renders save product button when onSaveProduct is provided', () => {
    render(
      <NutritionTable
        products={[makeProduct()]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onSaveProduct={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /options for test product/i }));
    expect(screen.getByRole('menuitem', { name: /^save$/i })).toBeInTheDocument();
  });

  it('does not render save comparison button for fewer than 2 products', () => {
    render(
      <NutritionTable
        products={[makeProduct()]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onSaveComparison={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    expect(screen.queryByRole('menuitem', { name: /^save$/i })).toBeNull();
  });

  it('renders save comparison button when 2+ products and onSaveComparison is provided', () => {
    const products = [
      makeProduct({ code: '111', product_name: 'Product A' }),
      makeProduct({ code: '222', product_name: 'Product B' }),
    ];
    render(
      <NutritionTable
        products={products}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onSaveComparison={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    expect(screen.getByRole('menuitem', { name: /^save$/i })).toBeInTheDocument();
  });

  it('calls onSaveProduct with the correct product code when clicked', async () => {
    const onSaveProduct = vi.fn().mockResolvedValue(undefined);
    render(
      <NutritionTable
        products={[makeProduct({ code: '999' })]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onSaveProduct={onSaveProduct}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /options for test product/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^save$/i }));
    await waitFor(() => expect(onSaveProduct).toHaveBeenCalledWith('999'));
  });

  it('calls onSaveComparison when save comparison button is clicked', async () => {
    const onSaveComparison = vi.fn().mockResolvedValue(undefined);
    const products = [
      makeProduct({ code: '111' }),
      makeProduct({ code: '222' }),
    ];
    render(
      <NutritionTable
        products={products}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onSaveComparison={onSaveComparison}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^save$/i }));
    await waitFor(() => expect(onSaveComparison).toHaveBeenCalledTimes(1));
  });

  it('item is disabled while save product is in progress', async () => {
    let resolve!: () => void;
    const onSaveProduct = vi.fn(
      () => new Promise<void>((res) => { resolve = res; }),
    );
    render(
      <NutritionTable
        products={[makeProduct()]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onSaveProduct={onSaveProduct}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /options for test product/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^save$/i }));
    // Re-open dropdown to inspect disabled state
    fireEvent.click(screen.getByRole('button', { name: /options for test product/i }));
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: /^save$/i })).toHaveAttribute('data-disabled'),
    );
    resolve();
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: /^save$/i })).not.toHaveAttribute('data-disabled'),
    );
  });
});

// ─── Compare page save handlers ───────────────────────────────────────────────

// We test the handlers indirectly by rendering ComparePage with mocked auth
// and verifying toast calls after simulating saves via NutritionTable props.
// Direct handler tests use the compare page component.

vi.mock('@/lib/openfoodfacts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/openfoodfacts')>();
  return { ...actual, fetchProduct: vi.fn() };
});

const { fetchProduct } = await import('@/lib/openfoodfacts');
const mockFetchProduct = vi.mocked(fetchProduct);

async function renderCompareWithProducts(productOverrides: Partial<ProductNutrition>[] = [{}]) {
  const { default: ComparePage } = await import('@/app/compare/page');
  render(<ComparePage />);

  // Submit a barcode for each product
  for (const overrides of productOverrides) {
    const product = makeProduct(overrides);
    mockFetchProduct.mockResolvedValueOnce(product);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: product.code },
    });
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);
    await waitFor(() => expect(screen.getByText(product.product_name!)).toBeInTheDocument());
  }
}

describe('Compare page — save handlers', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: mockUser as never, loading: false });
    mockSaveProduct.mockResolvedValue(undefined);
    mockSaveComparison.mockResolvedValue(undefined);
  });

  it('calls saveProduct with correct name and ean, then shows success toast', async () => {
    await renderCompareWithProducts([{ code: '5000112637922', product_name: 'Nutella' }]);
    fireEvent.click(screen.getByRole('button', { name: /options for nutella/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^save$/i }));
    await waitFor(() =>
      expect(mockSaveProduct).toHaveBeenCalledWith('uid-123', {
        name: 'Nutella',
        ean: '5000112637922',
      }),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Product saved'));
  });

  it('shows "Product already saved" info toast on duplicate', async () => {
    mockSaveProduct.mockRejectedValueOnce(new Error('DUPLICATE'));
    await renderCompareWithProducts([{ code: '11111111', product_name: 'Nutella' }]);
    fireEvent.click(screen.getByRole('button', { name: /options for nutella/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^save$/i }));
    await waitFor(() => expect(toast.info).toHaveBeenCalledWith('Product already saved'));
  });

  it('shows error toast when saveProduct fails with unknown error', async () => {
    mockSaveProduct.mockRejectedValueOnce(new Error('network'));
    await renderCompareWithProducts([{ code: '11111111', product_name: 'Nutella' }]);
    fireEvent.click(screen.getByRole('button', { name: /options for nutella/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^save$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to save product'));
  });

  it('calls saveComparison with correctly formatted name and eans', async () => {
    await renderCompareWithProducts([
      { code: '11111111', product_name: 'Nutella' },
      { code: '22222222', product_name: 'Skippy' },
      { code: '33333333', product_name: 'Jif' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^save$/i }));
    await waitFor(() =>
      expect(mockSaveComparison).toHaveBeenCalledWith('uid-123', {
        name: 'Nutella + 2 others',
        eans: ['11111111', '22222222', '33333333'],
      }),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Comparison saved'));
  });

  it('shows "Comparison already saved" info toast on duplicate', async () => {
    mockSaveComparison.mockRejectedValueOnce(new Error('DUPLICATE'));
    await renderCompareWithProducts([
      { code: '11111111', product_name: 'Nutella' },
      { code: '22222222', product_name: 'Skippy' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^save$/i }));
    await waitFor(() => expect(toast.info).toHaveBeenCalledWith('Comparison already saved'));
  });

  it('does not render save buttons when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    await renderCompareWithProducts([{ code: '11111111', product_name: 'Nutella' }]);
    fireEvent.click(screen.getByRole('button', { name: /options for nutella/i }));
    expect(screen.queryByRole('menuitem', { name: /^save$/i })).toBeNull();
  });
});
