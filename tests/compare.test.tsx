import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { mapProduct, parseEanInput } from '@/lib/openfoodfacts';

import type { OFFProductResponse } from '@/types/openfoodfacts';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
  useSearchParams: vi.fn(() => ({ get: vi.fn(() => null) })),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(() => ({ user: null, loading: false })),
}));

vi.mock('@/lib/firestore', () => ({
  saveProduct: vi.fn(),
  saveComparison: vi.fn(),
}));

vi.mock('@/lib/openfoodfacts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/openfoodfacts')>();
  return {
    ...actual,
    fetchProduct: vi.fn(),
    fetchProducts: vi.fn(),
  };
});

const { fetchProduct, fetchProducts } = await import('@/lib/openfoodfacts');
const mockFetchProduct = vi.mocked(fetchProduct);
const mockFetchProducts = vi.mocked(fetchProducts);

describe('parseEanInput', () => {
  it('returns empty arrays for empty string', () => {
    expect(parseEanInput('')).toEqual({ valid: [], invalid: [] });
  });

  it('returns empty arrays for only commas and spaces', () => {
    expect(parseEanInput(' , , ')).toEqual({ valid: [], invalid: [] });
  });

  it('trims whitespace from codes', () => {
    expect(parseEanInput(' 12345670 , 87654325 ')).toEqual({
      valid: ['12345670', '87654325'],
      invalid: [],
    });
  });

  it('deduplicates repeated codes', () => {
    expect(parseEanInput('12345670,12345670,87654325')).toEqual({
      valid: ['12345670', '87654325'],
      invalid: [],
    });
  });

  it('handles a single code without comma', () => {
    expect(parseEanInput('1234567890128')).toEqual({
      valid: ['1234567890128'],
      invalid: [],
    });
  });

  it('handles multiple codes with irregular spacing', () => {
    expect(parseEanInput('12345670 ,87654325,  11223344  ')).toEqual({
      valid: ['12345670', '87654325', '11223344'],
      invalid: [],
    });
  });

  it('separates valid EANs from invalid tokens', () => {
    expect(parseEanInput('12345670,abc,87654325')).toEqual({
      valid: ['12345670', '87654325'],
      invalid: ['abc'],
    });
  });

  it('rejects an EAN-8 with a wrong check digit', () => {
    expect(parseEanInput('12345671')).toEqual({
      valid: [],
      invalid: ['12345671'],
    });
  });

  it('rejects an EAN-13 with a wrong check digit', () => {
    expect(parseEanInput('1234567890121')).toEqual({
      valid: [],
      invalid: ['1234567890121'],
    });
  });

  it('rejects wrong check digit while accepting valid code in same input', () => {
    expect(parseEanInput('12345671,12345670')).toEqual({
      valid: ['12345670'],
      invalid: ['12345671'],
    });
  });
});

describe('mapProduct', () => {
  const fullResponse: OFFProductResponse = {
    status: 1,
    status_verbose: 'product found',
    product: {
      code: '123',
      product_name: 'Test Product',
      nutriments: {
        'energy-kcal_100g': 100,
        proteins_100g: 5,
        carbohydrates_100g: 20,
        sugars_100g: 10,
        fat_100g: 3,
        'saturated-fat_100g': 1,
        fiber_100g: 2,
        salt_100g: 0.5,
      },
    },
  };

  it('maps all 8 nutriment fields to correct renamed keys', () => {
    const result = mapProduct(fullResponse, '123');
    expect(result).toEqual({
      code: '123',
      product_name: 'Test Product',
      kcals: 100,
      protein: 5,
      carbohydrates: 20,
      sugar: 10,
      fat: 3,
      saturated_fat: 1,
      fiber: 2,
      salt: 0.5,
    });
  });

  it('returns undefined for missing nutriments', () => {
    const sparse: OFFProductResponse = {
      status: 1,
      status_verbose: 'product found',
      product: {
        code: '456',
        product_name: 'Sparse Product',
        nutriments: {},
      },
    };
    const result = mapProduct(sparse, '456');
    expect(result.kcals).toBeUndefined();
    expect(result.protein).toBeUndefined();
    expect(result.saturated_fat).toBeUndefined();
  });

  it('preserves code and product_name', () => {
    const result = mapProduct(fullResponse, '123');
    expect(result.code).toBe('123');
    expect(result.product_name).toBe('Test Product');
  });
});

describe('fetchProduct', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when status is 0', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 0, status_verbose: 'product not found' }),
    } as Response);

    const { fetchProduct: realFetchProduct } = await vi.importActual<
      typeof import('@/lib/openfoodfacts')
    >('@/lib/openfoodfacts');
    const result = await realFetchProduct('000');
    expect(result).toBeNull();
  });

  it('returns ProductNutrition on success', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 1,
        status_verbose: 'product found',
        product: {
          code: '123',
          product_name: 'Test',
          nutriments: { 'energy-kcal_100g': 50 },
        },
      }),
    } as Response);

    const { fetchProduct: realFetchProduct } = await vi.importActual<
      typeof import('@/lib/openfoodfacts')
    >('@/lib/openfoodfacts');
    const result = await realFetchProduct('123');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('123');
    expect(result?.kcals).toBe(50);
  });

  it('rejects on network error', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const { fetchProduct: realFetchProduct } = await vi.importActual<
      typeof import('@/lib/openfoodfacts')
    >('@/lib/openfoodfacts');
    await expect(realFetchProduct('123')).rejects.toThrow('Network error');
  });
});

describe('fetchProducts', () => {
  let realFetchProducts: typeof import('@/lib/openfoodfacts').fetchProducts;

  beforeAll(async () => {
    ({ fetchProducts: realFetchProducts } = await vi.importActual<
      typeof import('@/lib/openfoodfacts')
    >('@/lib/openfoodfacts'));
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns all products in fetched when all succeed', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 1,
        product: { code: '12345670', product_name: 'Test', nutriments: {} },
      }),
    } as Response);

    const result = await realFetchProducts(['12345670', '87654325']);
    expect(result.fetched).toHaveLength(2);
    expect(result.notFound).toHaveLength(0);
  });

  it('puts code in notFound when product is not found (status 0)', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 1,
          product: { code: '12345670', product_name: 'Test', nutriments: {} },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 0 }),
      } as Response);

    const result = await realFetchProducts(['12345670', '87654325']);
    expect(result.fetched).toHaveLength(1);
    expect(result.fetched[0].code).toBe('12345670');
    expect(result.notFound).toEqual(['87654325']);
  });

  it('puts code in notFound when fetch throws', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 1,
          product: { code: '12345670', product_name: 'Test', nutriments: {} },
        }),
      } as Response)
      .mockRejectedValueOnce(new Error('Network error'));

    const result = await realFetchProducts(['12345670', '87654325']);
    expect(result.fetched).toHaveLength(1);
    expect(result.notFound).toEqual(['87654325']);
  });

  it('processes codes across multiple batches', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 1,
        product: { code: '12345670', product_name: 'Test', nutriments: {} },
      }),
    } as Response);

    const codes = ['12345670', '87654325', '11223344', '44332211', '99887766'];
    const result = await realFetchProducts(codes, 2);
    expect(result.fetched).toHaveLength(5);
    expect(result.notFound).toHaveLength(0);
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(5);
  });
});

describe('ComparePage', () => {
  beforeEach(() => {
    mockFetchProduct.mockReset();
    mockFetchProducts.mockReset();
  });

  async function renderPage() {
    const { default: ComparePage } = await import('@/app/compare/page');
    render(<ComparePage />);
  }

  it('renders input with placeholder and submit button', async () => {
    await renderPage();
    expect(
      screen.getByRole('textbox', { name: /ean barcodes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /look up/i }),
    ).toBeInTheDocument();
  });

  it('does not call fetchProducts when input is empty', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));
    await waitFor(() => {
      expect(mockFetchProducts).not.toHaveBeenCalled();
    });
  });

  it('calls fetchProducts with parsed codes on submit', async () => {
    mockFetchProducts.mockResolvedValue({ fetched: [], notFound: [] });
    await renderPage();
    fireEvent.change(screen.getByRole('textbox', { name: /ean barcodes/i }), {
      target: { value: '12345670,87654325' },
    });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));
    await waitFor(() => {
      expect(mockFetchProducts).toHaveBeenCalledWith(['12345670', '87654325']);
    });
  });

  it('shows warning alert when product is not found', async () => {
    mockFetchProducts.mockResolvedValue({
      fetched: [],
      notFound: ['12345670'],
    });
    await renderPage();
    fireEvent.change(screen.getByRole('textbox', { name: /ean barcodes/i }), {
      target: { value: '12345670' },
    });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('12345670');
    });
  });

  it('shows warning alert when product is not found', async () => {
    mockFetchProducts.mockResolvedValue({
      fetched: [],
      notFound: ['87654325'],
    });
    await renderPage();
    fireEvent.change(screen.getByRole('textbox', { name: /ean barcodes/i }), {
      target: { value: '87654325' },
    });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('87654325');
    });
  });
});
