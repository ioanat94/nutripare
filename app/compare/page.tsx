'use client';

import { Loader2, ScanBarcode, TriangleAlert } from 'lucide-react';
import { fetchProduct, parseEanInput } from '@/lib/openfoodfacts';
import { saveComparison, saveProduct } from '@/lib/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NutritionTable } from '@/components/nutrition-table';
import type { ProductNutrition } from '@/types/openfoodfacts';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';

const BarcodeScanner = dynamic(() => import('@/components/barcode-scanner'), {
  ssr: false,
});

function replaceOrAppend(
  prev: ProductNutrition[],
  next: ProductNutrition,
): ProductNutrition[] {
  const idx = prev.findIndex((p) => p.code === next.code);
  if (idx !== -1) {
    const updated = [...prev];
    updated[idx] = next;
    return updated;
  }
  return [...prev, next];
}

export default function ComparePage() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductNutrition[]>([]);
  const [notFoundCodes, setNotFoundCodes] = useState<string[]>([]);
  const [invalidCodes, setInvalidCodes] = useState<string[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const { valid, invalid } = parseEanInput(input);
    setInvalidCodes(invalid);
    if (valid.length === 0) return;
    setLoading(true);
    const notFound: string[] = [];
    for (const code of valid) {
      try {
        const product = await fetchProduct(code);
        if (product === null) {
          notFound.push(code);
        } else {
          setProducts((prev) => replaceOrAppend(prev, product));
        }
      } catch {
        notFound.push(code);
      }
    }
    setNotFoundCodes(notFound);
    setInput('');
    setLoading(false);
  }

  function handleDismiss(code: string) {
    setProducts((prev) => {
      const next = prev.filter((p) => p.code !== code);
      if (next.length === 0) {
        setNotFoundCodes([]);
        setInvalidCodes([]);
      }
      return next;
    });
  }

  function handleClearAll() {
    setProducts([]);
    setNotFoundCodes([]);
    setInvalidCodes([]);
  }

  async function handleSaveProduct(code: string) {
    if (!user) return;
    const product = products.find((p) => p.code === code);
    if (!product) return;
    const name = product.product_name || code;
    try {
      await saveProduct(user.id, { name, ean: code });
      toast.success('Product saved');
    } catch (e) {
      if (e instanceof Error && e.message === 'DUPLICATE') {
        toast.info('Product already saved');
      } else {
        toast.error('Failed to save product');
      }
    }
  }

  async function handleSaveComparison() {
    if (!user) return;
    const firstName = products[0]?.product_name || products[0]?.code || '';
    const name = `${firstName} + ${products.length - 1} others`;
    const eans = products.map((p) => p.code);
    try {
      await saveComparison(user.id, { name, eans });
      toast.success('Comparison saved');
    } catch (e) {
      if (e instanceof Error && e.message === 'DUPLICATE') {
        toast.info('Comparison already saved');
      } else {
        toast.error('Failed to save comparison');
      }
    }
  }

  async function handleScan(code: string) {
    setScannerOpen(false);
    setLoading(true);
    try {
      const product = await fetchProduct(code);
      if (product === null) {
        setNotFoundCodes([code]);
      } else {
        setProducts((prev) => replaceOrAppend(prev, product));
        setNotFoundCodes([]);
      }
    } catch {
      setNotFoundCodes([code]);
    }
    setLoading(false);
  }

  return (
    <main className='mx-auto w-full max-w-5xl px-6 py-12'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>Compare products</h1>
        <p className='mt-1.5 max-w-xl text-muted-foreground'>
          Enter EAN barcodes to see nutritional values side by side. Add
          multiple codes at once by separating them with commas.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className='flex gap-2'>
        <div className='relative flex-1'>
          <ScanBarcode className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder='e.g. 5000112637922, 8076809513388'
            aria-label='EAN barcodes'
            className='pl-9'
          />
        </div>
        <Button type='submit' disabled={loading} className='shrink-0'>
          {loading ? (
            <Loader2 className='size-4 animate-spin' />
          ) : products.length > 0 ? (
            'Add products'
          ) : (
            'Look up'
          )}
        </Button>
        <Button
          type='button'
          variant='outline'
          size='icon'
          disabled={loading}
          onClick={() => setScannerOpen(true)}
          aria-label='Scan barcode'
          className='shrink-0 px-5'
        >
          <ScanBarcode className='size-4' />
        </Button>
      </form>
      {scannerOpen && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {/* Invalid format notice */}
      {invalidCodes.length > 0 && (
        <p
          role='alert'
          className='mt-3 flex items-center gap-1.5 text-sm text-warning'
        >
          <TriangleAlert className='size-4 shrink-0' aria-hidden='true' />
          Invalid EAN format:{' '}
          <span className='font-mono'>{invalidCodes.join(', ')}</span>
        </p>
      )}

      {/* Not-found notice */}
      {notFoundCodes.length > 0 && (
        <p
          role='alert'
          className='mt-3 flex items-center gap-1.5 text-sm text-warning'
        >
          <TriangleAlert className='size-4 shrink-0' aria-hidden='true' />
          No product found for:{' '}
          <span className='font-mono'>{notFoundCodes.join(', ')}</span>
        </p>
      )}

      {/* One-time hint to keep adding */}
      {products.length > 0 && (
        <p className='mt-3 text-sm text-muted-foreground'>
          Enter another barcode above to add a column.
        </p>
      )}

      {/* Results */}
      {products.length > 0 && (
        <div className='mt-10'>
          <NutritionTable
            products={products}
            onDismiss={handleDismiss}
            onClearAll={handleClearAll}
            onSaveProduct={user ? handleSaveProduct : undefined}
            onSaveComparison={user ? handleSaveComparison : undefined}
          />
          <p className='mt-4 text-xs text-muted-foreground'>
            Data sourced from{' '}
            <a
              href='https://world.openfoodfacts.org'
              target='_blank'
              rel='noopener noreferrer'
              className='underline underline-offset-2 hover:text-foreground transition-colors'
            >
              Open Food Facts
            </a>
            , a free, collaborative database. Nutritional values may be
            incomplete or inaccurate.
          </p>
        </div>
      )}
    </main>
  );
}
