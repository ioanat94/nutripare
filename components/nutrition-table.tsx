'use client';

import {
  ArrowDown,
  ArrowUp,
  Loader2,
  MoreHorizontal,
  Save,
  SaveOff,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getDefaultRules, getExtremeEmoji, getThresholdColor } from '@/utils/thresholds';

import type { NutritionSettings } from '@/types/firestore';
import type { ProductNutrition } from '@/types/openfoodfacts';
import type { ThresholdColor } from '@/utils/thresholds';
import { toast } from 'sonner';
import { useState } from 'react';

type SortDir = 'desc' | 'asc';
type SortState = { key: string; dir: SortDir } | null;

interface NutritionTableProps {
  products: ProductNutrition[];
  onDismiss: (code: string) => void;
  onClearAll: () => void;
  onSaveProduct?: (code: string) => Promise<void>;
  onSaveComparison?: () => Promise<void>;
  savedProductCodes?: Set<string>;
  comparisonSaved?: boolean;
  onUnsaveProduct?: (code: string) => Promise<void>;
  onUnsaveComparison?: () => Promise<void>;
  settings?: NutritionSettings | null;
}

export const ROWS = [
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
  info: 'text-info',
  warning: 'text-warning',
  negative: 'text-destructive',
};

function renderCell(
  nutrient: string,
  value: number | undefined,
  rules: ReturnType<typeof getDefaultRules>,
) {
  if (value === undefined || isNaN(value))
    return { text: '—', className: 'text-muted-foreground' };
  const color = getThresholdColor(nutrient, value, rules);
  return {
    text: Number.isInteger(value) ? String(value) : value.toFixed(1),
    className: color ? COLOR_CLASS[color] : '',
  };
}

export function NutritionTable({
  products,
  onDismiss,
  onClearAll,
  onSaveProduct,
  onSaveComparison,
  savedProductCodes,
  comparisonSaved,
  onUnsaveProduct,
  onUnsaveComparison,
  settings,
}: NutritionTableProps) {
  const defaultRules = getDefaultRules();
  const visibleNutrients = settings?.visibleNutrients ?? ROWS.map((r) => r.key);
  const rules = settings?.rules ?? defaultRules;
  // undefined = not yet fetched, suppress emojis; null = fetched (no doc), use defaults
  const showCrown = settings !== undefined ? (settings?.showCrown ?? true) : false;
  const showFlag = settings !== undefined ? (settings?.showFlag ?? true) : false;

  const [sort, setSort] = useState<SortState>(null);
  const [savingProduct, setSavingProduct] = useState<string | null>(null);
  const [savingComparison, setSavingComparison] = useState(false);

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

  function handleShare() {
    const codes = products.map((p) => p.code).join(',');
    const url = `${window.location.origin}/compare?codes=${encodeURIComponent(codes)}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success('Link copied to clipboard'),
      () => toast.error('Failed to copy link'),
    );
  }

  return (
    <div className='overflow-x-auto'>
      {/* Toolbar */}
      <div className='mb-3 flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </p>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label='More options'
            className='flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          >
            <MoreHorizontal className='size-4' aria-hidden='true' />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {products.length >= 2 &&
              (comparisonSaved
                ? onUnsaveComparison && (
                    <DropdownMenuItem
                      onClick={async () => {
                        setSavingComparison(true);
                        await onUnsaveComparison();
                        setSavingComparison(false);
                      }}
                      disabled={savingComparison}
                    >
                      {savingComparison ? (
                        <Loader2
                          className='size-4 animate-spin'
                          aria-hidden='true'
                        />
                      ) : (
                        <SaveOff className='size-4' aria-hidden='true' />
                      )}
                      Unsave
                    </DropdownMenuItem>
                  )
                : onSaveComparison && (
                    <DropdownMenuItem
                      onClick={async () => {
                        setSavingComparison(true);
                        await onSaveComparison();
                        setSavingComparison(false);
                      }}
                      disabled={savingComparison}
                    >
                      {savingComparison ? (
                        <Loader2
                          className='size-4 animate-spin'
                          aria-hidden='true'
                        />
                      ) : (
                        <Save className='size-4' aria-hidden='true' />
                      )}
                      Save
                    </DropdownMenuItem>
                  ))}
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className='size-4' aria-hidden='true' />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onClearAll}
              className='text-destructive focus:text-destructive'
            >
              <Trash2 className='size-4' aria-hidden='true' />
              Clear all
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Table
        className='table-fixed'
        style={{ width: `calc(10rem + ${sortedProducts.length} * 14rem)` }}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Options for ${name}`}
                        className='flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                      >
                        <MoreHorizontal className='size-4' aria-hidden='true' />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        {savedProductCodes?.has(p.code)
                          ? onUnsaveProduct && (
                              <DropdownMenuItem
                                onClick={async () => {
                                  setSavingProduct(p.code);
                                  await onUnsaveProduct(p.code);
                                  setSavingProduct(null);
                                }}
                                disabled={savingProduct === p.code}
                              >
                                {savingProduct === p.code ? (
                                  <Loader2 className='size-4 animate-spin' aria-hidden='true' />
                                ) : (
                                  <SaveOff className='size-4' aria-hidden='true' />
                                )}
                                Unsave
                              </DropdownMenuItem>
                            )
                          : onSaveProduct && (
                              <DropdownMenuItem
                                onClick={async () => {
                                  setSavingProduct(p.code);
                                  await onSaveProduct(p.code);
                                  setSavingProduct(null);
                                }}
                                disabled={savingProduct === p.code}
                              >
                                {savingProduct === p.code ? (
                                  <Loader2 className='size-4 animate-spin' aria-hidden='true' />
                                ) : (
                                  <Save className='size-4' aria-hidden='true' />
                                )}
                                Save
                              </DropdownMenuItem>
                            )}
                        <DropdownMenuItem
                          onClick={() => {
                            const url = `${window.location.origin}/compare?codes=${encodeURIComponent(p.code)}`;
                            navigator.clipboard.writeText(url).then(
                              () => toast.success('Link copied to clipboard'),
                              () => toast.error('Failed to copy link'),
                            );
                          }}
                        >
                          <Share2 className='size-4' aria-hidden='true' />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDismiss(p.code)}
                          className='text-destructive focus:text-destructive'
                        >
                          <X className='size-4' aria-hidden='true' />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {visibleNutrients.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={sortedProducts.length + 1}
                className='py-6 text-center text-sm text-muted-foreground'
              >
                No nutrients visible. Enable some in Settings → Nutrition.
              </TableCell>
            </TableRow>
          ) : (
            ROWS.filter((row) => visibleNutrients.includes(row.key)).map((row, i) => {
              const isActive = sort?.key === row.key;
              const rowBg = isActive
                ? 'bg-primary/10'
                : i % 2 === 0
                  ? 'bg-muted/30'
                  : '';
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
                    const { text, className } = renderCell(row.key, p[row.key as keyof ProductNutrition] as number | undefined, rules);
                    const rawEmoji = getExtremeEmoji(
                      row.key,
                      sortedProducts.map((q) => q[row.key as keyof ProductNutrition] as number | undefined),
                      j,
                      rules,
                      visibleNutrients,
                    );
                    const emoji =
                      rawEmoji === '👑' && !showCrown
                        ? null
                        : rawEmoji === '🚩' && !showFlag
                          ? null
                          : rawEmoji;
                    return (
                      <TableCell
                        key={p.code}
                        className={`py-3 tabular-nums text-sm font-medium ${className}`}
                      >
                        <div className='flex items-center justify-end'>
                          <span className='w-5 shrink-0 text-center text-base leading-none'>
                            {emoji}
                          </span>
                          <span className='w-12 text-right'>{text}</span>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
