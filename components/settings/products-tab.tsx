'use client';

import { useEffect, useState } from 'react';
import { Eye, SaveOff } from 'lucide-react';
import { toast } from 'sonner';

import { deleteProduct, getSavedProducts } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SavedProduct } from '@/types/firestore';

export function ProductsTab({ userId }: { userId: string }) {
  const [products, setProducts] = useState<SavedProduct[]>([]);

  useEffect(() => {
    getSavedProducts(userId).then(setProducts);
  }, [userId]);

  async function handleUnsave(ean: string) {
    try {
      await deleteProduct(userId, ean);
      setProducts((prev) => prev.filter((p) => p.ean !== ean));
      toast.success('Product removed');
    } catch {
      toast.error('Failed to remove product');
    }
  }

  if (products.length === 0) {
    return <p className='text-muted-foreground'>No saved products yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className='w-[45%]'>Name</TableHead>
          <TableHead className='w-[45%]'>EAN Code</TableHead>
          <TableHead className='w-[10%]'>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>{product.name}</TableCell>
            <TableCell className='font-mono'>{product.ean}</TableCell>
            <TableCell>
              <div className='flex gap-1'>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label={`View ${product.name}`}
                  className='text-info hover:text-info hover:bg-info/10'
                  onClick={() =>
                    window.open(`/compare?codes=${product.ean}`, '_blank')
                  }
                >
                  <Eye className='size-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label={`Unsave ${product.name}`}
                  className='text-destructive hover:text-destructive hover:bg-destructive/10'
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
  );
}
