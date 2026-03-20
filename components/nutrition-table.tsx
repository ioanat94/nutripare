'use client';

import { useState } from 'react';

import { ArrowDown, ArrowUp, X } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getExtremeEmoji, getThresholdColor } from '@/utils/thresholds';

import type { ProductNutrition } from '@/types/openfoodfacts';
import type { ThresholdColor } from '@/utils/thresholds';

type SortDir = 'desc' | 'asc';
type SortState = { key: string; dir: SortDir } | null;

interface NutritionTableProps {
  products: ProductNutrition[];
  onDismiss: (code: string) => void;
  onClearAll: () => void;
}

const ROWS = [
  { label: 'Calories (kcal)', key: 'kcals' },
  { label: 'Protein (g)', key: 'protein' },
  { label: 'Carbohydrates (g)', key: 'carbohydrates' },
  { label: 'Sugar (g)', key: 'sugar' },
  { label: 'Fat (g)', key: 'fat' },
  { label: 'Saturated Fat (g)', key: 'saturated_fat' },
  { label: 'Fiber (g)', key: 'fiber' },
  { label: 'Salt (g)', key: 'salt' },
] as const;

const COLOR_CLASS: Record<ThresholdColor, string> = {
  positive: 'text-positive',
  warning: 'text-warning',
  negative: 'text-destructive',
};

function renderCell(nutrient: string, value: number | undefined) {
  if (value === undefined || isNaN(value))
    return { text: '—', className: 'text-muted-foreground' };
  const color = getThresholdColor(nutrient, value);
  return {
    text: Number.isInteger(value) ? String(value) : value.toFixed(1),
    className: color ? COLOR_CLASS[color] : '',
  };
}

export function NutritionTable({
  products,
  onDismiss,
  onClearAll,
}: NutritionTableProps) {
  const [sort, setSort] = useState<SortState>(null);

  if (products.length === 0) return null;

  function handleRowClick(key: string) {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
        : { key, dir: 'desc' },
    );
  }

  const sortedProducts = sort
    ? [...products].sort((a, b) => {
        const av = a[sort.key as keyof ProductNutrition] as number | undefined;
        const bv = b[sort.key as keyof ProductNutrition] as number | undefined;
        if (av === undefined || isNaN(av)) return 1;
        if (bv === undefined || isNaN(bv)) return -1;
        return sort.dir === 'desc' ? bv - av : av - bv;
      })
    : products;

  return (
    <div>
      {/* Toolbar */}
      <div className='mb-3 flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </p>
        <button
          onClick={onClearAll}
          className='cursor-pointer text-sm text-muted-foreground transition-colors hover:text-destructive'
        >
          Clear all
        </button>
      </div>

      <Table
        className='table-fixed'
        style={{ width: `calc(10rem + ${sortedProducts.length} * 12rem)` }}
      >
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            {/* Corner cell — table-wide qualifier */}
            <TableHead className='sticky left-0 z-10 bg-background w-40 align-bottom pb-3 text-right text-xs font-normal text-muted-foreground'>
              per 100g
            </TableHead>
            {sortedProducts.map((p) => {
              const name = p.product_name || 'Unknown product';
              return (
                <TableHead
                  key={p.code}
                  scope='col'
                  className='w-48 align-top pb-3'
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0 flex-1'>
                      <span
                        title={name}
                        className='block truncate text-sm font-semibold text-foreground'
                      >
                        {name}
                      </span>
                      <span className='font-mono text-xs text-muted-foreground'>
                        {p.code}
                      </span>
                    </div>
                    {/* Dismiss button — generously sized for mobile taps */}
                    <button
                      onClick={() => onDismiss(p.code)}
                      aria-label={`Dismiss ${name}`}
                      className='flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                    >
                      <X className='size-3.5' aria-hidden='true' />
                    </button>
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {ROWS.map((row, i) => {
            const isActive = sort?.key === row.key;
            const rowBg = isActive ? 'bg-primary/10' : i % 2 === 0 ? 'bg-muted/30' : '';
            return (
              <TableRow key={row.key} className={rowBg}>
                {/* Nutrient label — sticky, clickable to sort */}
                <TableCell
                  scope='row'
                  className={`sticky left-0 z-10 w-40 py-3 ${isActive ? 'bg-primary/10' : 'bg-background'}`}
                >
                  <button
                    onClick={() => handleRowClick(row.key)}
                    className={`flex w-full cursor-pointer items-center gap-1 text-left text-sm transition-colors ${isActive ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground hover:text-foreground'}`}
                  >
                    {row.label}
                    {isActive &&
                      (sort!.dir === 'desc' ? (
                        <ArrowDown className='size-3 shrink-0' />
                      ) : (
                        <ArrowUp className='size-3 shrink-0' />
                      ))}
                  </button>
                </TableCell>

                {/* Value cells — right-aligned, tabular figures */}
                {sortedProducts.map((p, j) => {
                  const { text, className } = renderCell(row.key, p[row.key]);
                  const emoji = getExtremeEmoji(
                    row.key,
                    sortedProducts.map((q) => q[row.key]),
                    j,
                  );
                  return (
                    <TableCell
                      key={p.code}
                      className={`py-3 tabular-nums text-sm font-medium ${className}`}
                    >
                      <div className='flex items-center justify-end gap-1.5'>
                        <span className='w-5 shrink-0 text-center text-base leading-none'>
                          {emoji}
                        </span>
                        {text}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
