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
  if (value === undefined || isNaN(value)) return { text: '—', className: '' };
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
      <button
        onClick={onClearAll}
        className='mb-2 text-sm text-muted-foreground hover:text-foreground'
      >
        Clear all
      </button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='sticky left-0 bg-card' />
            {products.map((p) => (
              <TableHead key={p.code} scope='col'>
                <div className='flex flex-col gap-1'>
                  <span className='truncate max-w-40 block'>
                    {p.product_name || 'Unknown product'}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {p.code}
                  </span>
                  <button
                    onClick={() => onDismiss(p.code)}
                    aria-label={`Dismiss ${p.product_name}`}
                    className='text-muted-foreground hover:text-foreground w-fit'
                  >
                    ×
                  </button>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((row) => (
            <TableRow key={row.key}>
              <TableCell
                scope='row'
                className='sticky left-0 bg-card font-medium'
              >
                {row.label}
              </TableCell>
              {products.map((p) => {
                const { text, className } = renderCell(row.key, p[row.key]);
                return (
                  <TableCell key={p.code} className={className}>
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
