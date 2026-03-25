'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Check, Eye, Loader2, Pencil, SaveOff, Search, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  deleteComparison,
  getSavedComparisons,
  renameComparison,
} from '@/lib/firestore';
import { useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import Link from 'next/link';
import type { SavedComparison } from '@/types/firestore';
import { toast } from 'sonner';

export function ComparisonsTab({ userId }: { userId: string }) {
  const [comparisons, setComparisons] = useState<SavedComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSavedComparisons(userId).then((data) => {
      setComparisons(data);
      setLoading(false);
    });
  }, [userId]);

  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  function startEditing(comparison: SavedComparison) {
    setEditingId(comparison.id);
    setEditingName(comparison.name);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName('');
  }

  async function handleRename(id: string) {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    try {
      await renameComparison(userId, id, trimmed);
      setComparisons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
      );
      cancelEditing();
      toast.success('Comparison renamed');
    } catch {
      toast.error('Failed to rename comparison');
    }
  }

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

  if (loading) {
    return <Loader2 className='size-5 animate-spin text-muted-foreground' />;
  }

  if (comparisons.length === 0) {
    return <p className='text-muted-foreground'>No saved comparisons yet.</p>;
  }

  const filtered = comparisons.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.eans.some((e) => e.includes(search)),
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
      {filtered.length === 0 && search ? (
        <p className='text-muted-foreground'>
          No comparisons match your search.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[45%]'>Name</TableHead>
              <TableHead className='w-[45%]'>EAN Codes</TableHead>
              <TableHead className='w-[10%]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((comparison) => (
              <TableRow key={comparison.id}>
                {editingId === comparison.id ? (
                  <TableCell colSpan={3}>
                    <form
                      className='flex items-center gap-1'
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRename(comparison.id);
                      }}
                    >
                      <Input
                        ref={inputRef}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className='h-7 text-sm'
                      />
                      <Button
                        type='submit'
                        variant='ghost'
                        size='icon'
                        aria-label='Save name'
                        className='size-7 shrink-0 hover:text-positive hover:bg-positive/10'
                      >
                        <Check className='size-3.5' />
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        aria-label='Cancel'
                        className='size-7 shrink-0 hover:text-destructive hover:bg-destructive/10'
                        onClick={cancelEditing}
                      >
                        <X className='size-3.5' />
                      </Button>
                    </form>
                  </TableCell>
                ) : (
                  <>
                    <TableCell className='max-w-48 whitespace-normal'>
                      <span className='flex items-center gap-1.5'>
                        {comparison.name}
                        <Button
                          variant='ghost'
                          size='icon'
                          aria-label={`Rename ${comparison.name}`}
                          className='size-6 shrink-0 text-muted-foreground hover:text-foreground'
                          onClick={() => startEditing(comparison)}
                        >
                          <Pencil className='size-3' />
                        </Button>
                      </span>
                    </TableCell>
                    <TableCell className='max-w-48 whitespace-normal font-mono'>
                      {comparison.eans.join(', ')}
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-1'>
                        <Link
                          href={`/compare?codes=${comparison.eans.join(',')}`}
                          target='_blank'
                          aria-label={`View ${comparison.name}`}
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
                          aria-label={`Unsave ${comparison.name}`}
                          className='hover:text-destructive hover:bg-destructive/10'
                          onClick={() => handleUnsave(comparison.eans)}
                        >
                          <SaveOff className='size-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
