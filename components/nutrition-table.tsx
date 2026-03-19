import { X } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { ProductNutrition } from '@/types/openfoodfacts';
import type { ThresholdColor } from '@/utils/thresholds';
import { getThresholdColor } from '@/utils/thresholds';

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
  if (value === undefined || isNaN(value)) return { text: '—', className: 'text-muted-foreground' };
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
  if (products.length === 0) return null;

  return (
    <div>
      {/* Toolbar */}
      <div className='mb-3 flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </p>
        <button
          onClick={onClearAll}
          className='text-sm text-muted-foreground transition-colors hover:text-destructive'
        >
          Clear all
        </button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            {/* Empty corner cell */}
            <TableHead className='sticky left-0 z-10 bg-background w-40' />
            {products.map((p) => {
              const name = p.product_name || 'Unknown product';
              return (
                <TableHead key={p.code} scope='col' className='min-w-[140px] align-top pb-3'>
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
                      className='flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
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
          {ROWS.map((row, i) => (
            <TableRow key={row.key} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
              {/* Nutrient label — sticky */}
              <TableCell
                scope='row'
                className='sticky left-0 z-10 w-40 bg-background py-3 text-sm font-medium text-muted-foreground'
              >
                {row.label}
              </TableCell>

              {/* Value cells — right-aligned, tabular figures */}
              {products.map((p) => {
                const { text, className } = renderCell(row.key, p[row.key]);
                return (
                  <TableCell
                    key={p.code}
                    className={`py-3 text-right tabular-nums text-sm font-medium ${className}`}
                  >
                    {text}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
