'use client';

import { useEffect, useState } from 'react';
import { Eye, SaveOff } from 'lucide-react';
import { toast } from 'sonner';

import { deleteComparison, getSavedComparisons } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SavedComparison } from '@/types/firestore';

export function ComparisonsTab({ userId }: { userId: string }) {
  const [comparisons, setComparisons] = useState<SavedComparison[]>([]);

  useEffect(() => {
    getSavedComparisons(userId).then(setComparisons);
  }, [userId]);

  async function handleUnsave(eans: string[]) {
    try {
      await deleteComparison(userId, eans);
      setComparisons((prev) =>
        prev.filter(
          (c) => [...c.eans].sort().join(',') !== [...eans].sort().join(','),
        ),
      );
      toast.success('Comparison removed');
    } catch {
      toast.error('Failed to remove comparison');
    }
  }

  if (comparisons.length === 0) {
    return <p className='text-muted-foreground'>No saved comparisons yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className='w-[45%]'>Name</TableHead>
          <TableHead className='w-[45%]'>EAN Codes</TableHead>
          <TableHead className='w-[10%]'>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {comparisons.map((comparison) => (
          <TableRow key={comparison.id}>
            <TableCell>{comparison.name}</TableCell>
            <TableCell className='max-w-48 whitespace-normal font-mono'>
              {comparison.eans.join(', ')}
            </TableCell>
            <TableCell>
              <div className='flex gap-1'>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label={`View ${comparison.name}`}
                  className='text-info hover:text-info hover:bg-info/10'
                  onClick={() =>
                    window.open(
                      `/compare?codes=${comparison.eans.join(',')}`,
                      '_blank',
                    )
                  }
                >
                  <Eye className='size-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label={`Unsave ${comparison.name}`}
                  className='text-destructive hover:text-destructive hover:bg-destructive/10'
                  onClick={() => handleUnsave(comparison.eans)}
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
