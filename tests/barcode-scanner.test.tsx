import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Hoisted so these values are accessible inside vi.mock factory (which is hoisted)
const { capturedCallbacks, mockScannerInstance } = vi.hoisted(() => {
  const capturedCallbacks = { successCallback: null as ((code: string) => void) | null };
  const mockScannerInstance = {
    start: vi.fn().mockImplementation(
      (_camera: unknown, _config: unknown, successCb: (code: string) => void) => {
        capturedCallbacks.successCallback = successCb;
        return Promise.resolve();
      },
    ),
    stop: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  };
  return { capturedCallbacks, mockScannerInstance };
});

vi.mock('html5-qrcode', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Html5Qrcode: vi.fn().mockImplementation(function (this: any) {
    Object.assign(this, mockScannerInstance);
    return this;
  }),
  Html5QrcodeSupportedFormats: { EAN_13: 0, EAN_8: 1 },
}));

vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>) => React.lazy(loader),
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
  return { ...actual, fetchProduct: vi.fn() };
});

const { fetchProduct } = await import('@/lib/openfoodfacts');
const mockFetchProduct = vi.mocked(fetchProduct);

async function renderPage() {
  const { default: ComparePage } = await import('@/app/compare/page');
  render(
    <React.Suspense fallback={null}>
      <ComparePage />
    </React.Suspense>,
  );
}

describe('Barcode scanning', () => {
  beforeEach(() => {
    mockFetchProduct.mockReset();
    capturedCallbacks.successCallback = null;
    mockScannerInstance.start.mockClear();
    mockScannerInstance.stop.mockClear();
    mockScannerInstance.clear.mockClear();
  });

  it('renders scan button next to Look Up button', async () => {
    await renderPage();
    expect(screen.getByRole('button', { name: /look up/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scan barcode/i })).toBeInTheDocument();
  });

  it('shows scanner UI when scan button is clicked', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /scan barcode/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /barcode scanner/i })).toBeInTheDocument();
    });
  });

  it('calls fetchProduct with scanned code on successful scan', async () => {
    mockFetchProduct.mockResolvedValue(null);
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /scan barcode/i }));
    await waitFor(() => expect(capturedCallbacks.successCallback).not.toBeNull());
    await act(async () => {
      capturedCallbacks.successCallback!('1234567890123');
    });
    await waitFor(() => {
      expect(mockFetchProduct).toHaveBeenCalledWith('1234567890123');
    });
  });

  it('closes scanner after successful scan', async () => {
    mockFetchProduct.mockResolvedValue(null);
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /scan barcode/i }));
    await waitFor(() => expect(capturedCallbacks.successCallback).not.toBeNull());
    await act(async () => {
      capturedCallbacks.successCallback!('1234567890123');
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /barcode scanner/i })).not.toBeInTheDocument();
    });
  });

  it('closes scanner without calling fetchProduct when close button clicked', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /scan barcode/i }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /barcode scanner/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /close scanner/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /barcode scanner/i })).not.toBeInTheDocument();
    });
    expect(mockFetchProduct).not.toHaveBeenCalled();
  });

  it('updates existing product instead of adding a duplicate on rescan', async () => {
    const product = {
      code: '1234567890123',
      product_name: 'Test Product',
      kcals: 100,
      protein: 5,
      carbohydrates: 20,
      sugar: 10,
      fat: 3,
      saturated_fat: 1,
      fiber: 2,
      salt: 0.5,
    };
    mockFetchProduct.mockResolvedValue(product);
    await renderPage();

    // First scan
    fireEvent.click(screen.getByRole('button', { name: /scan barcode/i }));
    await waitFor(() => expect(capturedCallbacks.successCallback).not.toBeNull());
    await act(async () => { capturedCallbacks.successCallback!('1234567890123'); });
    await waitFor(() => expect(screen.getByText('Test Product')).toBeInTheDocument());

    // Second scan of same product
    capturedCallbacks.successCallback = null;
    fireEvent.click(screen.getByRole('button', { name: /scan barcode/i }));
    await waitFor(() => expect(capturedCallbacks.successCallback).not.toBeNull());
    await act(async () => { capturedCallbacks.successCallback!('1234567890123'); });

    await waitFor(() => {
      expect(screen.getAllByText('Test Product')).toHaveLength(1);
    });
  });
});
