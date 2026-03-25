'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Eye, GitCompareArrows, Loader2, SaveOff, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deleteProduct, getSavedProducts } from '@/lib/firestore';
import { useEffect, useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import type { SavedProduct } from '@/types/firestore';
import { toast } from 'sonner';

export function ProductsTab({ userId }: { userId: string }) {
  const [products, setProducts] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    getSavedProducts(userId).then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, [userId]);

  function toggleSelected(ean: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(ean);
      } else {
        next.delete(ean);
      }
      return next;
    });
  }

  async function handleUnsave(ean: string) {
    try {
      await deleteProduct(userId, ean);
      setProducts((prev) => prev.filter((p) => p.ean !== ean));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(ean);
        return next;
      });
      toast.success('Product removed');
    } catch {
      toast.error('Failed to remove product');
    }
  }

  const compareUrl = `/compare?codes=${[...selected].join(',')}`;

  if (loading) {
    return <Loader2 className='size-5 animate-spin text-muted-foreground' />;
  }

  if (products.length === 0) {
    return <p className='text-muted-foreground'>No saved products yet.</p>;
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.ean.includes(search),
  );

  return (
    <div className='space-y-3'>
      <div className='relative'>
        <Search className='absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          placeholder='Search by name or EAN…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-8'
        />
      </div>
      {selected.size >= 2 && (
        <Link
          href={compareUrl}
          target='_blank'
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <GitCompareArrows className='size-4' />
          Compare {selected.size} products
        </Link>
      )}
      {filtered.length === 0 && search ? (
        <p className='text-muted-foreground'>No products match your search.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-8' />
              <TableHead className='w-[42%]'>Name</TableHead>
              <TableHead className='w-[42%]'>EAN Code</TableHead>
              <TableHead className='w-[10%]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(product.ean)}
                    onCheckedChange={(c) => toggleSelected(product.ean, !!c)}
                    aria-label={`Select ${product.name}`}
                  />
                </TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell className='font-mono'>{product.ean}</TableCell>
                <TableCell>
                  <div className='flex gap-1'>
                    <Link
                      href={`/compare?codes=${product.ean}`}
                      target='_blank'
                      aria-label={`View ${product.name}`}
                      className={
                        buttonVariants({ variant: 'ghost', size: 'icon' }) +
                        ' hover:text-info hover:bg-info/10'
                      }
                    >
                      <Eye className='size-4' />
                    </Link>
                    <Button
                      variant='ghost'
                      size='icon'
                      aria-label={`Unsave ${product.name}`}
                      className='hover:text-destructive hover:bg-destructive/10'
                      onClick={() => handleUnsave(product.ean)}
                    >
                      <SaveOff className='size-4' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
