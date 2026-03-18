'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchProduct, parseEanInput } from '@/lib/openfoodfacts';

export default function ComparePage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const codes = parseEanInput(input);
    if (codes.length === 0) return;
    setLoading(true);
    for (const code of codes) {
      try {
        const product = await fetchProduct(code);
        if (product === null) console.log(`Product not found: ${code}`);
        else console.log(product);
      } catch (err) {
        console.error(`Error fetching ${code}:`, err);
      }
    }
    setLoading(false);
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
    </div>
  );
}
