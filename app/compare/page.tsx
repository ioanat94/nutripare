'use client';

import { Loader2, ScanBarcode, TriangleAlert } from 'lucide-react';
import { fetchProduct, parseEanInput } from '@/lib/openfoodfacts';
import { getDefaultRules } from '@/utils/thresholds';
import {
  deleteComparisonById,
  deleteProduct,
  findSavedComparison,
  getNutritionSettings,
  getSavedProductEans,
  saveComparison,
  saveProduct,
  updateComparisonEans,
  updateComparisonRuleset,
} from '@/lib/firestore';
import type { NutritionSettings } from '@/types/firestore';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NutritionTable } from '@/components/nutrition-table';
import type { ProductNutrition } from '@/types/openfoodfacts';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

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

function ComparePageContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductNutrition[]>([]);
  const [notFoundCodes, setNotFoundCodes] = useState<string[]>([]);
  const [invalidCodes, setInvalidCodes] = useState<string[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [savedProductCodes, setSavedProductCodes] = useState<Set<string>>(
    new Set(),
  );
  const [savedComparisonId, setSavedComparisonId] = useState<string | null>(null);
  const [loadedComparison, setLoadedComparison] = useState<{ id: string; name: string } | null>(null);
  const [selectedRulesetId, setSelectedRulesetId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveDialogName, setSaveDialogName] = useState('');
  const [nutritionSettings, setNutritionSettings] = useState<NutritionSettings | null | undefined>(undefined);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setNutritionSettings(null);
      return;
    }
    getNutritionSettings(user.id).then((settings) => {
      setNutritionSettings(settings);
      setSelectedRulesetId(settings?.rulesets[0]?.id ?? 'default');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  const productCodesKey = products.map((p) => p.code).join(',');
  useEffect(() => {
    if (!user || products.length === 0) return;
    const codes = products.map((p) => p.code);
    Promise.all([
      getSavedProductEans(user.id, codes),
      findSavedComparison(user.id, codes),
    ]).then(([savedEans, savedComp]) => {
      setSavedProductCodes(savedEans);
      if (savedComp) {
        setSavedComparisonId(savedComp.id);
        if (savedComp.rulesetId) setSelectedRulesetId(savedComp.rulesetId);
        setLoadedComparison((prev) => prev ?? { id: savedComp.id, name: savedComp.name });
      } else {
        setSavedComparisonId(null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCodesKey, user?.id]);

  const settingsLoaded = nutritionSettings !== undefined;
  useEffect(() => {
    if (!settingsLoaded) return;
    const codes = searchParams?.get('codes');
    if (codes) runSearch(codes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoaded]);

  async function runSearch(rawInput: string) {
    const { valid, invalid } = parseEanInput(rawInput);
    if (valid.length === 0) {
      setInvalidCodes(invalid);
      return;
    }
    setLoading(true);
    setInvalidCodes([]);
    setNotFoundCodes([]);
    const notFound: string[] = [];
    const fetched: ProductNutrition[] = [];
    await Promise.all(
      valid.map(async (code) => {
        try {
          const product = await fetchProduct(code);
          if (product === null) notFound.push(code);
          else fetched.push(product);
        } catch {
          notFound.push(code);
        }
      }),
    );
    if (fetched.length > 0) {
      setProducts((prev) => {
        let next = [...prev];
        for (const p of fetched) next = replaceOrAppend(next, p);
        return next;
      });
      setSavedComparisonId(null);
    }
    setInvalidCodes(invalid);
    setNotFoundCodes(notFound);
    setInput('');
    setLoading(false);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    await runSearch(input);
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
    setSavedProductCodes((prev) => {
      const next = new Set(prev);
      next.delete(code);
      return next;
    });
    setSavedComparisonId(null);
  }

  function handleClearAll() {
    setProducts([]);
    setNotFoundCodes([]);
    setInvalidCodes([]);
    setSavedProductCodes(new Set());
    setSavedComparisonId(null);
    setLoadedComparison(null);
  }

  async function handleSaveProduct(code: string) {
    if (!user) return;
    const product = products.find((p) => p.code === code);
    if (!product) return;
    const name = product.product_name || code;
    try {
      await saveProduct(user.id, { name, ean: code });
      setSavedProductCodes((prev) => new Set(prev).add(code));
      toast.success('Product saved');
    } catch (e) {
      if (e instanceof Error && e.message === 'DUPLICATE') {
        setSavedProductCodes((prev) => new Set(prev).add(code));
        toast.info('Product already saved');
      } else {
        toast.error('Failed to save product');
      }
    }
  }

  async function handleUnsaveProduct(code: string) {
    if (!user) return;
    try {
      await deleteProduct(user.id, code);
      setSavedProductCodes((prev) => {
        const next = new Set(prev);
        next.delete(code);
        return next;
      });
      toast.success('Product removed');
    } catch {
      toast.error('Failed to remove product');
    }
  }

  function handleSaveComparison() {
    if (!user) return;
    const firstName = products[0]?.product_name || products[0]?.code || '';
    const defaultName = products.length > 1
      ? `${firstName} + ${products.length - 1} others`
      : firstName;
    setSaveDialogName(defaultName);
    setSaveDialogOpen(true);
  }

  async function handleConfirmSaveComparison() {
    if (!user) return;
    const eans = products.map((p) => p.code);
    try {
      const id = await saveComparison(user.id, { name: saveDialogName, eans });
      setSavedComparisonId(id);
      setLoadedComparison({ id, name: saveDialogName });
      setSaveDialogOpen(false);
      if (selectedRulesetId) {
        updateComparisonRuleset(user.id, id, selectedRulesetId).catch(() => {});
      }
      toast.success('Comparison saved');
    } catch (e) {
      if (e instanceof Error && e.message === 'DUPLICATE') {
        const existing = await findSavedComparison(user.id, eans);
        if (existing) {
          setSavedComparisonId(existing.id);
          setLoadedComparison({ id: existing.id, name: existing.name });
        }
        setSaveDialogOpen(false);
        toast.info('Comparison already saved');
      } else {
        toast.error('Failed to save comparison');
      }
    }
  }

  async function handleUpdateComparison() {
    if (!user || !loadedComparison) return;
    const eans = products.map((p) => p.code);
    try {
      await updateComparisonEans(user.id, loadedComparison.id, eans);
      setSavedComparisonId(loadedComparison.id);
      toast.success('Comparison updated');
    } catch {
      toast.error('Failed to update comparison');
    }
  }

  async function handleUnsaveComparison() {
    if (!user) return;
    const targetId = loadedComparison?.id ?? savedComparisonId;
    if (!targetId) return;
    try {
      await deleteComparisonById(user.id, targetId);
      setSavedComparisonId(null);
      setLoadedComparison(null);
      toast.success('Comparison removed');
    } catch {
      toast.error('Failed to remove comparison');
    }
  }

  async function handleRulesetChange(id: string) {
    setSelectedRulesetId(id);
    if (savedComparisonId) {
      updateComparisonRuleset(user!.id, savedComparisonId, id).catch(() => {});
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
        setSavedComparisonId(null);
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

      {/* Loading spinner */}
      {loading && (
        <div className='mt-10 flex justify-center'>
          <Loader2 className='size-6 animate-spin text-muted-foreground' />
        </div>
      )}

      {!loading && (
        <>
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
        </>
      )}

      {/* Results */}
      {!loading && products.length > 0 && (
        <div className='mt-10'>
          <NutritionTable
            products={products}
            onDismiss={handleDismiss}
            onClearAll={handleClearAll}
            onSaveProduct={user ? handleSaveProduct : undefined}
            onSaveComparison={user ? handleSaveComparison : undefined}
            onSaveAsNew={user ? handleSaveComparison : undefined}
            onUpdateComparison={user ? handleUpdateComparison : undefined}
            savedProductCodes={savedProductCodes}
            loadedComparisonName={loadedComparison?.name}
            isDirty={loadedComparison !== null && savedComparisonId !== loadedComparison.id}
            onUnsaveProduct={user ? handleUnsaveProduct : undefined}
            onUnsaveComparison={user ? handleUnsaveComparison : undefined}
            settings={nutritionSettings}
            rulesets={nutritionSettings !== undefined ? (nutritionSettings?.rulesets ?? [{ id: 'default', name: 'Default', rules: getDefaultRules() }]) : undefined}
            selectedRulesetId={selectedRulesetId}
            onRulesetChange={user ? handleRulesetChange : undefined}
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
      <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Name this comparison</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a name for your saved comparison.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            className='my-2'
            value={saveDialogName}
            onChange={(e) => setSaveDialogName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && saveDialogName.trim()) handleConfirmSaveComparison();
            }}
            autoFocus
          />
          <AlertDialogFooter>
            <Button variant='outline' onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSaveComparison} disabled={!saveDialogName.trim()}>
              Save
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

export default function ComparePage() {
  return (
    <Suspense>
      <ComparePageContent />
    </Suspense>
  );
}
