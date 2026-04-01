import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { NutritionTable } from '@/components/nutrition-table';
import type { ProductNutrition } from '@/types/openfoodfacts';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
  useSearchParams: vi.fn(() => ({ get: vi.fn(() => null) })),
}));

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
  deleteComparisonById: vi.fn().mockResolvedValue(undefined),
  updateComparisonEans: vi.fn().mockResolvedValue(undefined),
  getSavedProductEans: vi.fn().mockResolvedValue(new Set()),
  findSavedComparison: vi.fn().mockResolvedValue(null),
  updateComparisonRuleset: vi.fn().mockResolvedValue(undefined),
  getNutritionSettings: vi.fn().mockResolvedValue(null),
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

const {
  saveProduct,
  saveComparison,
  findSavedComparison,
  deleteComparisonById,
  updateComparisonEans,
} = await import('@/lib/firestore');
const mockSaveProduct = vi.mocked(saveProduct);
const mockSaveComparison = vi.mocked(saveComparison);
const mockFindSavedComparison = vi.mocked(findSavedComparison);
const mockDeleteComparisonById = vi.mocked(deleteComparisonById);
const mockUpdateComparisonEans = vi.mocked(updateComparisonEans);

const { toast } = await import('sonner');

function makeProduct(
  overrides: Partial<ProductNutrition> = {},
): ProductNutrition {
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
    fireEvent.click(
      screen.getByRole('button', { name: /options for test product/i }),
    );
    expect(
      screen.queryByRole('menuitem', { name: /save product/i }),
    ).toBeNull();
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
    fireEvent.click(
      screen.getByRole('button', { name: /options for test product/i }),
    );
    expect(
      screen.getByRole('menuitem', { name: /save product/i }),
    ).toBeInTheDocument();
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
    expect(
      screen.queryByRole('menuitem', { name: /save comparison/i }),
    ).toBeNull();
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
    expect(
      screen.getByRole('menuitem', { name: /save comparison/i }),
    ).toBeInTheDocument();
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
    fireEvent.click(
      screen.getByRole('button', { name: /options for test product/i }),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: /save product/i }));
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
    fireEvent.click(screen.getByRole('menuitem', { name: /save comparison/i }));
    await waitFor(() => expect(onSaveComparison).toHaveBeenCalledTimes(1));
  });

  it('item is disabled while save product is in progress', async () => {
    let resolve!: () => void;
    const onSaveProduct = vi.fn(
      () =>
        new Promise<void>((res) => {
          resolve = res;
        }),
    );
    render(
      <NutritionTable
        products={[makeProduct()]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onSaveProduct={onSaveProduct}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /options for test product/i }),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: /save product/i }));
    // Re-open dropdown to inspect disabled state
    fireEvent.click(
      screen.getByRole('button', { name: /options for test product/i }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: /save product/i }),
      ).toHaveAttribute('data-disabled'),
    );
    resolve();
    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: /save product/i }),
      ).not.toHaveAttribute('data-disabled'),
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

async function renderCompareWithProducts(
  productOverrides: Partial<ProductNutrition>[] = [{}],
) {
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
    await waitFor(() =>
      expect(screen.getByText(product.product_name!)).toBeInTheDocument(),
    );
  }
}

describe('Compare page — save handlers', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser as never,
      loading: false,
      emailVerified: true,
      refreshEmailVerified: vi.fn(),
    });
    mockSaveProduct.mockResolvedValue(undefined);
    mockSaveComparison.mockResolvedValue('comparison-id-abc');
  });

  it('calls saveProduct with correct name and ean, then shows success toast', async () => {
    await renderCompareWithProducts([
      { code: '5000112637922', product_name: 'Nutella' },
    ]);
    fireEvent.click(
      screen.getByRole('button', { name: /options for nutella/i }),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: /save product/i }));
    await waitFor(() =>
      expect(mockSaveProduct).toHaveBeenCalledWith('uid-123', {
        name: 'Nutella',
        ean: '5000112637922',
      }),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Product saved'),
    );
  });

  it('shows "Product already saved" info toast on duplicate', async () => {
    mockSaveProduct.mockRejectedValueOnce(new Error('DUPLICATE'));
    await renderCompareWithProducts([
      { code: '11111115', product_name: 'Nutella' },
    ]);
    fireEvent.click(
      screen.getByRole('button', { name: /options for nutella/i }),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: /save product/i }));
    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith('Product already saved'),
    );
  });

  it('shows error toast when saveProduct fails with unknown error', async () => {
    mockSaveProduct.mockRejectedValueOnce(new Error('network'));
    await renderCompareWithProducts([
      { code: '11111115', product_name: 'Nutella' },
    ]);
    fireEvent.click(
      screen.getByRole('button', { name: /options for nutella/i }),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: /save product/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Failed to save product'),
    );
  });

  it('opens a dialog with pre-filled name when save comparison is clicked', async () => {
    await renderCompareWithProducts([
      { code: '11111115', product_name: 'Nutella' },
      { code: '22222220', product_name: 'Skippy' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /save comparison/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByRole('textbox')).toHaveValue('Nutella + 1 others');
  });

  it('calls saveComparison with the pre-filled name and eans on confirm', async () => {
    await renderCompareWithProducts([
      { code: '11111115', product_name: 'Nutella' },
      { code: '22222220', product_name: 'Skippy' },
      { code: '33333335', product_name: 'Jif' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /save comparison/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() =>
      expect(mockSaveComparison).toHaveBeenCalledWith('uid-123', {
        name: 'Nutella + 2 others',
        eans: ['11111115', '22222220', '33333335'],
      }),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Comparison saved'),
    );
  });

  it('calls saveComparison with a custom name when the user edits it', async () => {
    await renderCompareWithProducts([
      { code: '11111115', product_name: 'Nutella' },
      { code: '22222220', product_name: 'Skippy' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /save comparison/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'My custom name' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() =>
      expect(mockSaveComparison).toHaveBeenCalledWith('uid-123', {
        name: 'My custom name',
        eans: ['11111115', '22222220'],
      }),
    );
  });

  it('disables the Save button when the name is empty', async () => {
    await renderCompareWithProducts([
      { code: '11111115', product_name: 'Nutella' },
      { code: '22222220', product_name: 'Skippy' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /save comparison/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();
  });

  it('closes the dialog without saving when Cancel is clicked', async () => {
    await renderCompareWithProducts([
      { code: '11111115', product_name: 'Nutella' },
      { code: '22222220', product_name: 'Skippy' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /save comparison/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(mockSaveComparison).not.toHaveBeenCalled();
  });

  it('submits via Enter key in the name input', async () => {
    await renderCompareWithProducts([
      { code: '11111115', product_name: 'Nutella' },
      { code: '22222220', product_name: 'Skippy' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /save comparison/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    await waitFor(() => expect(mockSaveComparison).toHaveBeenCalledTimes(1));
  });

  it('shows "Comparison already saved" info toast on duplicate', async () => {
    mockSaveComparison.mockRejectedValueOnce(new Error('DUPLICATE'));
    await renderCompareWithProducts([
      { code: '11111115', product_name: 'Nutella' },
      { code: '22222220', product_name: 'Skippy' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /save comparison/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));
    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith('Comparison already saved'),
    );
  });

  it('does not render save buttons when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      emailVerified: false,
      refreshEmailVerified: vi.fn(),
    });
    await renderCompareWithProducts([
      { code: '11111115', product_name: 'Nutella' },
    ]);
    fireEvent.click(
      screen.getByRole('button', { name: /options for nutella/i }),
    );
    expect(
      screen.queryByRole('menuitem', { name: /save product/i }),
    ).toBeNull();
  });
});

// ─── NutritionTable — loaded comparison menu states ──────────────────────────

describe('NutritionTable — loaded comparison menu states', () => {
  const twoProducts = [
    makeProduct({ code: '111', product_name: 'Product A' }),
    makeProduct({ code: '222', product_name: 'Product B' }),
  ];

  it('fresh state: shows Save comparison, no Update/Save as new/Delete', () => {
    render(
      <NutritionTable
        products={twoProducts}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onSaveComparison={vi.fn()}
        onSaveAsNew={vi.fn()}
        onUpdateComparison={vi.fn()}
        onUnsaveComparison={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    expect(
      screen.getByRole('menuitem', { name: /save comparison/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /update/i })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /save as new/i })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /delete/i })).toBeNull();
  });

  it('unmodified saved state: shows only Delete "[name]"', () => {
    render(
      <NutritionTable
        products={twoProducts}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onSaveComparison={vi.fn()}
        onSaveAsNew={vi.fn()}
        onUpdateComparison={vi.fn()}
        onUnsaveComparison={vi.fn()}
        loadedComparisonName='Milks'
        isDirty={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    expect(
      screen.getByRole('menuitem', { name: /delete/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: /save comparison/i }),
    ).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /update/i })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /save as new/i })).toBeNull();
  });

  it('dirty state: shows Update, Save as new, and Delete — no Save comparison', () => {
    render(
      <NutritionTable
        products={twoProducts}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onSaveComparison={vi.fn()}
        onSaveAsNew={vi.fn()}
        onUpdateComparison={vi.fn()}
        onUnsaveComparison={vi.fn()}
        loadedComparisonName='Milks'
        isDirty={true}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    expect(
      screen.getByRole('menuitem', { name: /update/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /save as new/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /delete/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: /save comparison/i }),
    ).toBeNull();
  });

  it('calls onUpdateComparison when Update is clicked', async () => {
    const onUpdateComparison = vi.fn().mockResolvedValue(undefined);
    render(
      <NutritionTable
        products={twoProducts}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onUpdateComparison={onUpdateComparison}
        onSaveAsNew={vi.fn()}
        onUnsaveComparison={vi.fn()}
        loadedComparisonName='Milks'
        isDirty={true}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /update/i }));
    await waitFor(() => expect(onUpdateComparison).toHaveBeenCalledTimes(1));
  });

  it('calls onSaveAsNew when Save as new is clicked', () => {
    const onSaveAsNew = vi.fn();
    render(
      <NutritionTable
        products={twoProducts}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onUpdateComparison={vi.fn().mockResolvedValue(undefined)}
        onSaveAsNew={onSaveAsNew}
        onUnsaveComparison={vi.fn()}
        loadedComparisonName='Milks'
        isDirty={true}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /save as new/i }));
    expect(onSaveAsNew).toHaveBeenCalledTimes(1);
  });

  it('calls onUnsaveComparison when Delete is clicked in unmodified state', async () => {
    const onUnsaveComparison = vi.fn().mockResolvedValue(undefined);
    render(
      <NutritionTable
        products={twoProducts}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onUnsaveComparison={onUnsaveComparison}
        loadedComparisonName='Milks'
        isDirty={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /delete/i }));
    await waitFor(() => expect(onUnsaveComparison).toHaveBeenCalledTimes(1));
  });

  it('calls onUnsaveComparison when Delete is clicked in dirty state', async () => {
    const onUnsaveComparison = vi.fn().mockResolvedValue(undefined);
    render(
      <NutritionTable
        products={twoProducts}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onUpdateComparison={vi.fn().mockResolvedValue(undefined)}
        onSaveAsNew={vi.fn()}
        onUnsaveComparison={onUnsaveComparison}
        loadedComparisonName='Milks'
        isDirty={true}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /delete/i }));
    await waitFor(() => expect(onUnsaveComparison).toHaveBeenCalledTimes(1));
  });

  it('Update button is disabled while in progress', async () => {
    let resolve!: () => void;
    const onUpdateComparison = vi.fn(
      () =>
        new Promise<void>((res) => {
          resolve = res;
        }),
    );
    render(
      <NutritionTable
        products={twoProducts}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        onUpdateComparison={onUpdateComparison}
        onSaveAsNew={vi.fn()}
        onUnsaveComparison={vi.fn()}
        loadedComparisonName='Milks'
        isDirty={true}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /update/i }));
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: /update/i })).toHaveAttribute(
        'data-disabled',
      ),
    );
    resolve();
    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: /update/i }),
      ).not.toHaveAttribute('data-disabled'),
    );
  });
});

// ─── Compare page — update and delete comparison handlers ─────────────────────

describe('Compare page — update and delete comparison handlers', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser as never,
      loading: false,
      emailVerified: true,
      refreshEmailVerified: vi.fn(),
    });
    mockFindSavedComparison.mockResolvedValue(null);
  });

  it('shows Delete when products match a saved comparison', async () => {
    mockFindSavedComparison.mockResolvedValue({
      id: 'cmp-1',
      name: 'Milks',
      rulesetId: undefined,
    });
    await renderCompareWithProducts([
      { code: '11111115', product_name: 'Milk A' },
      { code: '22222220', product_name: 'Milk B' },
    ]);
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    expect(
      screen.getByRole('menuitem', { name: /delete/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: /save comparison/i }),
    ).toBeNull();
  });

  it('shows Update and Save as new when a product is added to a loaded comparison', async () => {
    // First two products match a saved comparison
    mockFindSavedComparison.mockResolvedValueOnce({
      id: 'cmp-1',
      name: 'Milks',
      rulesetId: undefined,
    });
    // After adding a third product, no match
    mockFindSavedComparison.mockResolvedValue(null);

    await renderCompareWithProducts([
      { code: '11111115', product_name: 'Milk A' },
      { code: '22222220', product_name: 'Milk B' },
    ]);

    // Add a third product
    const extraProduct = makeProduct({
      code: '33333335',
      product_name: 'Milk C',
    });
    mockFetchProduct.mockResolvedValueOnce(extraProduct);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '33333335' },
    });
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);
    await waitFor(() => expect(screen.getByText('Milk C')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    expect(
      screen.getByRole('menuitem', { name: /update/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /save as new/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /delete/i }),
    ).toBeInTheDocument();
  });

  it('calls updateComparisonEans and shows success toast when Update is clicked', async () => {
    mockFindSavedComparison.mockResolvedValueOnce({
      id: 'cmp-1',
      name: 'Milks',
      rulesetId: undefined,
    });
    mockFindSavedComparison.mockResolvedValue(null);

    await renderCompareWithProducts([
      { code: '11111115', product_name: 'Milk A' },
      { code: '22222220', product_name: 'Milk B' },
    ]);

    const extraProduct = makeProduct({
      code: '33333335',
      product_name: 'Milk C',
    });
    mockFetchProduct.mockResolvedValueOnce(extraProduct);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '33333335' },
    });
    fireEvent.submit(screen.getByRole('textbox').closest('form')!);
    await waitFor(() => expect(screen.getByText('Milk C')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /update/i }));

    await waitFor(() =>
      expect(mockUpdateComparisonEans).toHaveBeenCalledWith(
        'uid-123',
        'cmp-1',
        ['11111115', '22222220', '33333335'],
      ),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Comparison updated'),
    );
  });

  it('calls deleteComparisonById and shows success toast when Delete is clicked', async () => {
    mockFindSavedComparison.mockResolvedValue({
      id: 'cmp-1',
      name: 'Milks',
      rulesetId: undefined,
    });
    await renderCompareWithProducts([
      { code: '11111115', product_name: 'Milk A' },
      { code: '22222220', product_name: 'Milk B' },
    ]);

    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /delete/i }));

    await waitFor(() =>
      expect(mockDeleteComparisonById).toHaveBeenCalledWith('uid-123', 'cmp-1'),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Comparison removed'),
    );
  });
});
