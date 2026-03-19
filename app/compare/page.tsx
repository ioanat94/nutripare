'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { NutritionTable } from '@/components/nutrition-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchProduct, parseEanInput } from '@/lib/openfoodfacts';
import type { ProductNutrition } from '@/types/openfoodfacts';

function replaceOrAppend(prev: ProductNutrition[], next: ProductNutrition): ProductNutrition[] {
  const idx = prev.findIndex((p) => p.code === next.code);
  if (idx !== -1) {
    const updated = [...prev];
    updated[idx] = next;
    return updated;
  }
  return [...prev, next];
}

export default function ComparePage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductNutrition[]>([]);
  const [notFoundCodes, setNotFoundCodes] = useState<string[]>([]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const codes = parseEanInput(input);
    if (codes.length === 0) return;
    setLoading(true);
    const notFound: string[] = [];
    for (const code of codes) {
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
    setLoading(false);
  }

  function handleDismiss(code: string) {
    setProducts((prev) => prev.filter((p) => p.code !== code));
  }

  function handleClearAll() {
    setProducts([]);
  }

  return (
    <div>
      <h2>Compare products</h2>
      <form onSubmit={handleSubmit}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Enter EAN barcodes, comma-separated"
          aria-label="EAN barcodes"
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : 'Look up'}
        </Button>
      </form>
      {notFoundCodes.length > 0 && (
        <div role="alert" className="mt-4 rounded-md border border-warning bg-warning/10 p-3 text-sm text-warning-foreground">
          Could not find product(s) with code(s): {notFoundCodes.join(', ')}
        </div>
      )}
      {products.length > 0 && (
        <NutritionTable
          products={products}
          onDismiss={handleDismiss}
          onClearAll={handleClearAll}
        />
      )}
    </div>
  );
}
