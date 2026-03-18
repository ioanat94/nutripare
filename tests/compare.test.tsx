import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { mapProduct, parseEanInput } from '@/lib/openfoodfacts';
import type { OFFProductResponse } from '@/types/openfoodfacts';

vi.mock('@/lib/openfoodfacts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/openfoodfacts')>();
  return {
    ...actual,
    fetchProduct: vi.fn(),
  };
});

const { fetchProduct } = await import('@/lib/openfoodfacts');
const mockFetchProduct = vi.mocked(fetchProduct);

describe('parseEanInput', () => {
  it('returns [] for empty string', () => {
    expect(parseEanInput('')).toEqual([]);
  });

  it('returns [] for only commas and spaces', () => {
    expect(parseEanInput(' , , ')).toEqual([]);
  });

  it('trims whitespace from codes', () => {
    expect(parseEanInput(' 123 , 456 ')).toEqual(['123', '456']);
  });

  it('deduplicates repeated codes', () => {
    expect(parseEanInput('123,123,456')).toEqual(['123', '456']);
  });

  it('handles a single code without comma', () => {
    expect(parseEanInput('1234567890123')).toEqual(['1234567890123']);
  });

  it('handles multiple codes with irregular spacing', () => {
    expect(parseEanInput('111 ,222,  333  ')).toEqual(['111', '222', '333']);
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
      json: async () => ({ status: 0, status_verbose: 'product not found' }),
    } as Response);

    const { fetchProduct: realFetchProduct } = await vi.importActual<typeof import('@/lib/openfoodfacts')>('@/lib/openfoodfacts');
    const result = await realFetchProduct('000');
    expect(result).toBeNull();
  });

  it('returns ProductNutrition on success', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
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

    const { fetchProduct: realFetchProduct } = await vi.importActual<typeof import('@/lib/openfoodfacts')>('@/lib/openfoodfacts');
    const result = await realFetchProduct('123');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('123');
    expect(result?.kcals).toBe(50);
  });

  it('rejects on network error', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    const { fetchProduct: realFetchProduct } = await vi.importActual<typeof import('@/lib/openfoodfacts')>('@/lib/openfoodfacts');
    await expect(realFetchProduct('123')).rejects.toThrow('Network error');
  });
});

describe('ComparePage', () => {
  beforeEach(() => {
    mockFetchProduct.mockReset();
  });

  async function renderPage() {
    const { default: ComparePage } = await import('@/app/compare/page');
    render(<ComparePage />);
  }

  it('renders input with placeholder and submit button', async () => {
    await renderPage();
    expect(screen.getByRole('textbox', { name: /ean barcodes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /look up/i })).toBeInTheDocument();
  });

  it('does not call fetchProduct when input is empty', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));
    await waitFor(() => {
      expect(mockFetchProduct).not.toHaveBeenCalled();
    });
  });

  it('calls fetchProduct with parsed codes on submit', async () => {
    mockFetchProduct.mockResolvedValue(null);
    await renderPage();
    fireEvent.change(screen.getByRole('textbox', { name: /ean barcodes/i }), {
      target: { value: '111,222' },
    });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));
    await waitFor(() => {
      expect(mockFetchProduct).toHaveBeenCalledWith('111');
      expect(mockFetchProduct).toHaveBeenCalledWith('222');
    });
  });

  it('logs "not found" when fetchProduct returns null', async () => {
    mockFetchProduct.mockResolvedValue(null);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await renderPage();
    fireEvent.change(screen.getByRole('textbox', { name: /ean barcodes/i }), {
      target: { value: '000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Product not found: 000');
    });
    consoleSpy.mockRestore();
  });

  it('calls console.error when fetchProduct throws', async () => {
    mockFetchProduct.mockRejectedValue(new Error('Network error'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await renderPage();
    fireEvent.change(screen.getByRole('textbox', { name: /ean barcodes/i }), {
      target: { value: '999' },
    });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        'Error fetching 999:',
        expect.any(Error)
      );
    });
    errorSpy.mockRestore();
  });
});
