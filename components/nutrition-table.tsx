'use client';

import {
  ArrowDown,
  ArrowUp,
  Flag,
  HelpCircle,
  Loader2,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Pin,
  PinOff,
  Save,
  SaveAll,
  SaveOff,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import {
  COMPUTED_SCORE_KEY,
  DEFAULT_NUTRITION_ROWS,
  ROWS,
  SCORE_ROW,
} from '@/utils/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
  NutritionRuleset,
  NutritionSettings,
  ThresholdColor,
} from '@/types/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getExtremeEmoji, getThresholdColor } from '@/utils/thresholds';
import { useMemo, useState } from 'react';

import type { ProductNutrition } from '@/types/openfoodfacts';
import { cn } from '@/utils/tailwind';
import { computeScore } from '@/utils/score';
import { getDefaultRules } from '@/utils/getDefaultRules';
import { toast } from 'sonner';
import { useExpandedTable } from '@/hooks/use-expanded-table';

type SortDir = 'desc' | 'asc';
type SortState = { key: string; dir: SortDir } | null;

interface NutritionTableProps {
  products: ProductNutrition[];
  onDismiss: (code: string) => void;
  onClearAll: () => void;
  onSaveProduct?: (code: string) => Promise<void>;
  onSaveComparison?: () => void;
  onSaveAsNew?: () => void;
  onUpdateComparison?: () => Promise<void>;
  savedProductCodes?: Set<string>;
  loadedComparisonName?: string;
  isDirty?: boolean;
  onUnsaveProduct?: (code: string) => Promise<void>;
  onUnsaveComparison?: () => Promise<void>;
  onReport?: (code: string) => void;
  settings?: NutritionSettings | null;
  rulesets?: NutritionRuleset[];
  selectedRulesetId?: string | null;
  onRulesetChange?: (id: string) => void;
}

const COLOR_CLASS: Record<ThresholdColor, string> = {
  positive: 'text-positive',
  info: 'text-info',
  warning: 'text-warning',
  negative: 'text-destructive',
};

function applyEmojiSettings(
  emoji: string | null,
  showCrown: boolean,
  showFlag: boolean,
): string | null {
  if (emoji === '👑' && !showCrown) return null;
  if (emoji === '🚩' && !showFlag) return null;
  return emoji;
}

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
  onSaveAsNew,
  onUpdateComparison,
  savedProductCodes,
  loadedComparisonName,
  isDirty,
  onUnsaveProduct,
  onUnsaveComparison,
  onReport,
  settings,
  rulesets,
  selectedRulesetId,
  onRulesetChange,
}: NutritionTableProps) {
  const visibleRows: string[] = settings?.visibleRows ?? [
    ...DEFAULT_NUTRITION_ROWS,
  ];
  const activeRuleset =
    rulesets?.find((rs) => rs.id === selectedRulesetId) ?? null;
  const rules = useMemo(
    () => activeRuleset?.rules ?? getDefaultRules(),
    [activeRuleset],
  );
  // undefined = not yet fetched, suppress emojis; null = fetched (no doc), use defaults
  const showCrown =
    settings !== undefined ? (settings?.showCrown ?? true) : false;
  const showFlag =
    settings !== undefined ? (settings?.showFlag ?? true) : false;

  const [sort, setSort] = useState<SortState>(null);
  const [pinnedCode, setPinnedCode] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState<string | null>(null);
  const [comparisonBusy, setComparisonBusy] = useState(false);
  const { expanded, toggleExpanded } = useExpandedTable();

  const scores = useMemo(
    () => new Map(products.map((p) => [p.code, computeScore(p, rules)])),
    [products, rules],
  );

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
        if (sort.key === COMPUTED_SCORE_KEY) {
          const av = scores.get(a.code) ?? undefined;
          const bv = scores.get(b.code) ?? undefined;
          if (av === undefined || isNaN(av)) return 1;
          if (bv === undefined || isNaN(bv)) return -1;
          return sort.dir === 'desc' ? bv - av : av - bv;
        }
        const av = a[sort.key as keyof ProductNutrition] as number | undefined;
        const bv = b[sort.key as keyof ProductNutrition] as number | undefined;
        if (av === undefined || isNaN(av)) return 1;
        if (bv === undefined || isNaN(bv)) return -1;
        return sort.dir === 'desc' ? bv - av : av - bv;
      })
    : products;

  const pinnedProduct = pinnedCode
    ? (sortedProducts.find((p) => p.code === pinnedCode) ?? null)
    : null;

  const displayProducts = pinnedProduct
    ? [pinnedProduct, ...sortedProducts.filter((p) => p.code !== pinnedCode)]
    : sortedProducts;

  const allKeysOrdered = settings?.rowOrder ?? [
    ...ROWS.map((r) => r.key),
    COMPUTED_SCORE_KEY,
  ];
  const displayRows = allKeysOrdered
    .filter((key) => visibleRows.includes(key))
    .map((key) =>
      key === COMPUTED_SCORE_KEY ? SCORE_ROW : ROWS.find((r) => r.key === key),
    )
    .filter(Boolean) as Array<{ label: string; key: string }>;

  function handleShare(code?: string) {
    const codes = code ?? products.map((p) => p.code).join(',');
    const url = `${window.location.origin}/compare?codes=${encodeURIComponent(codes)}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success('Link copied to clipboard'),
      () => toast.error('Failed to copy link'),
    );
  }

  const tableNaturalWidth = `calc(10.5rem + ${displayProducts.length} * 13rem)`;

  return (
    <div
      style={
        expanded
          ? {
              width: `max(min(${tableNaturalWidth}, calc(100vw - 3rem)), 100%)`,
              marginLeft: `min(calc(50% - min(${tableNaturalWidth}, calc(100vw - 3rem)) / 2), 0px)`,
            }
          : undefined
      }
    >
      {/* Toolbar */}
      <div className='mb-3 flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          {products.length} {products.length === 1 ? 'product' : 'products'}
        </p>

        <div className='flex items-center gap-1'>
          <button
            onClick={toggleExpanded}
            aria-label={expanded ? 'Collapse table' : 'Expand table'}
            className='hidden md:flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          >
            {expanded ? (
              <Minimize2 className='size-4' aria-hidden='true' />
            ) : (
              <Maximize2 className='size-4' aria-hidden='true' />
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label='More options'
              className='flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            >
              <MoreHorizontal className='size-4' aria-hidden='true' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-52'>
              {rulesets && rulesets.length > 0 && (
                <>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className='flex max-w-full gap-1'>
                      <span className='shrink-0'>Ruleset:</span>
                      <span className='truncate'>
                        {rulesets.find((rs) => rs.id === selectedRulesetId)
                          ?.name ?? 'None'}
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className='max-w-48'>
                      <DropdownMenuRadioGroup
                        value={selectedRulesetId ?? ''}
                        onValueChange={onRulesetChange}
                      >
                        {rulesets.map((rs) => (
                          <DropdownMenuRadioItem
                            key={rs.id}
                            value={rs.id}
                            disabled={!onRulesetChange}
                          >
                            <span className='truncate'>{rs.name}</span>
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                </>
              )}
              {products.length >= 2 && (
                <>
                  {isDirty && loadedComparisonName && onUpdateComparison && (
                    <DropdownMenuItem
                      onClick={async () => {
                        setComparisonBusy(true);
                        try {
                          await onUpdateComparison();
                        } finally {
                          setComparisonBusy(false);
                        }
                      }}
                      disabled={comparisonBusy}
                    >
                      {comparisonBusy ? (
                        <Loader2
                          className='size-4 animate-spin'
                          aria-hidden='true'
                        />
                      ) : (
                        <Save className='size-4' aria-hidden='true' />
                      )}
                      Update &ldquo;{loadedComparisonName}&rdquo;
                    </DropdownMenuItem>
                  )}
                  {isDirty && loadedComparisonName && onSaveAsNew && (
                    <DropdownMenuItem onClick={onSaveAsNew}>
                      <SaveAll className='size-4' aria-hidden='true' />
                      Save as new comparison
                    </DropdownMenuItem>
                  )}
                  {!loadedComparisonName && onSaveComparison && (
                    <DropdownMenuItem onClick={onSaveComparison}>
                      <Save className='size-4' aria-hidden='true' />
                      Save comparison
                    </DropdownMenuItem>
                  )}
                  {loadedComparisonName && onUnsaveComparison && (
                    <DropdownMenuItem
                      onClick={async () => {
                        setComparisonBusy(true);
                        try {
                          await onUnsaveComparison();
                        } finally {
                          setComparisonBusy(false);
                        }
                      }}
                      disabled={comparisonBusy}
                    >
                      {comparisonBusy ? (
                        <Loader2
                          className='size-4 animate-spin'
                          aria-hidden='true'
                        />
                      ) : (
                        <SaveOff className='size-4' aria-hidden='true' />
                      )}
                      Delete &ldquo;{loadedComparisonName}&rdquo;
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuItem onClick={() => handleShare()}>
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
      </div>

      <div className='overflow-x-auto'>
        <Table
          className='table-fixed border-separate border-spacing-0 [&_td]:border-b [&_th]:border-b [&_td]:border-border/40 [&_th]:border-border/40 [&_tbody_tr:last-child_td]:border-b-0'
          containerClassName='overflow-visible'
          style={{ width: `calc(10rem + ${displayProducts.length} * 13rem)` }}
        >
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              {/* Corner cell — table-wide qualifier */}
              <TableHead
                className={cn(
                  'sticky left-0 z-10 bg-background w-41 align-bottom pb-3 text-right text-xs font-normal text-muted-foreground',
                  pinnedCode === null && 'border-r',
                )}
              >
                per 100g
              </TableHead>
              {displayProducts.map((p, idx) => {
                const name = p.product_name || 'Unknown product';
                const isPinned = pinnedCode === p.code;
                return (
                  <TableHead
                    key={p.code}
                    scope='col'
                    className={cn(
                      'w-52 align-top pb-3',
                      isPinned
                        ? 'sticky left-40 z-10 bg-background border-r'
                        : (pinnedCode !== null ? idx > 1 : idx > 0) &&
                            'border-l border-border/40',
                    )}
                    style={
                      isPinned
                        ? {
                            boxShadow: 'var(--table-pin-shadow)',
                          }
                        : undefined
                    }
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
                      {isPinned && (
                        <button
                          onClick={() => setPinnedCode(null)}
                          aria-label='Unpin column'
                          className='hidden landscape:inline-flex md:inline-flex cursor-pointer text-primary hover:text-primary/70 transition-colors mt-0.75'
                        >
                          <Pin
                            className='size-3.5 shrink-0'
                            aria-hidden='true'
                          />
                        </button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Options for ${name}`}
                          className='flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                        >
                          <MoreHorizontal
                            className='size-4'
                            aria-hidden='true'
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-36'>
                          {savedProductCodes?.has(p.code)
                            ? onUnsaveProduct && (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    setSavingProduct(p.code);
                                    try {
                                      await onUnsaveProduct(p.code);
                                    } finally {
                                      setSavingProduct(null);
                                    }
                                  }}
                                  disabled={savingProduct === p.code}
                                >
                                  {savingProduct === p.code ? (
                                    <Loader2
                                      className='size-4 animate-spin'
                                      aria-hidden='true'
                                    />
                                  ) : (
                                    <SaveOff
                                      className='size-4'
                                      aria-hidden='true'
                                    />
                                  )}
                                  Unsave product
                                </DropdownMenuItem>
                              )
                            : onSaveProduct && (
                                <DropdownMenuItem
                                  onClick={async () => {
                                    setSavingProduct(p.code);
                                    try {
                                      await onSaveProduct(p.code);
                                    } finally {
                                      setSavingProduct(null);
                                    }
                                  }}
                                  disabled={savingProduct === p.code}
                                >
                                  {savingProduct === p.code ? (
                                    <Loader2
                                      className='size-4 animate-spin'
                                      aria-hidden='true'
                                    />
                                  ) : (
                                    <Save
                                      className='size-4'
                                      aria-hidden='true'
                                    />
                                  )}
                                  Save product
                                </DropdownMenuItem>
                              )}
                          <DropdownMenuItem onClick={() => handleShare(p.code)}>
                            <Share2 className='size-4' aria-hidden='true' />
                            Share
                          </DropdownMenuItem>
                          {products.length >= 2 && (
                            <DropdownMenuItem
                              className='hidden landscape:flex md:flex'
                              onClick={() =>
                                setPinnedCode(isPinned ? null : p.code)
                              }
                            >
                              {isPinned ? (
                                <>
                                  <PinOff
                                    className='size-4'
                                    aria-hidden='true'
                                  />
                                  Unpin column
                                </>
                              ) : (
                                <>
                                  <Pin className='size-4' aria-hidden='true' />
                                  Pin column
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => onReport?.(p.code)}
                            className='text-warning focus:text-warning'
                          >
                            <Flag className='size-4' aria-hidden='true' />
                            Report
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              if (pinnedCode === p.code) setPinnedCode(null);
                              onDismiss(p.code);
                            }}
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
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={displayProducts.length + 1}
                  className='py-6 text-center text-sm text-muted-foreground'
                >
                  No nutrients visible. Enable some in Settings → Nutrition.
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row, i) => {
                const isActive = sort?.key === row.key;
                const rowBg = isActive
                  ? 'bg-primary/10 hover:bg-primary/10'
                  : i % 2 === 0
                    ? 'bg-muted/30'
                    : '';
                const isScoreRow = row.key === COMPUTED_SCORE_KEY;
                const allRowValues = isScoreRow
                  ? displayProducts.map((p) => scores.get(p.code) ?? undefined)
                  : displayProducts.map(
                      (q) =>
                        q[row.key as keyof ProductNutrition] as
                          | number
                          | undefined,
                    );

                const cellBgBase = isActive
                  ? 'bg-table-active'
                  : i % 2 === 0
                    ? 'bg-table-stripe'
                    : 'bg-background';

                const stickyBg = cn(
                  'transition-colors',
                  !isActive && 'group-hover:bg-table-stripe-hover',
                  cellBgBase,
                );

                return (
                  <TableRow key={row.key} className={cn('group', rowBg)}>
                    {/* Row label — sticky, clickable to sort */}
                    <TableCell
                      scope='row'
                      className={cn(
                        'sticky left-0 z-10 w-40 py-3',
                        { 'border-r': pinnedCode === null },
                        stickyBg,
                      )}
                    >
                      <div className='flex items-center gap-1'>
                        <button
                          onClick={() => handleRowClick(row.key)}
                          className={cn(
                            'flex cursor-pointer items-center gap-1 text-left text-sm transition-colors',
                            isActive
                              ? 'font-semibold text-foreground'
                              : 'font-medium text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {row.label}
                          {isActive &&
                            (sort.dir === 'desc' ? (
                              <ArrowDown className='size-3 shrink-0' />
                            ) : (
                              <ArrowUp className='size-3 shrink-0' />
                            ))}
                        </button>
                        {isScoreRow && (
                          <Tooltip>
                            <TooltipTrigger className='inline-flex cursor-default'>
                              <HelpCircle className='size-4 shrink-0 text-muted-foreground' />
                            </TooltipTrigger>
                            <TooltipContent>
                              Score from 0–100 based on your nutrition rules.
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>

                    {/* Value cells — right-aligned, tabular figures */}
                    {displayProducts.map((p, j) => {
                      let text: string;
                      let className: string;
                      let rawEmoji: string | null;

                      if (isScoreRow) {
                        const scoreVal = scores.get(p.code) ?? null;
                        const color =
                          scoreVal !== null
                            ? getThresholdColor(
                                COMPUTED_SCORE_KEY,
                                scoreVal,
                                rules,
                              )
                            : null;
                        text = scoreVal === null ? '—' : String(scoreVal);
                        className =
                          scoreVal === null
                            ? 'text-muted-foreground'
                            : color
                              ? COLOR_CLASS[color]
                              : '';
                        rawEmoji = getExtremeEmoji(
                          COMPUTED_SCORE_KEY,
                          allRowValues,
                          j,
                          rules,
                        );
                      } else {
                        ({ text, className } = renderCell(
                          row.key,
                          p[row.key as keyof ProductNutrition] as
                            | number
                            | undefined,
                          rules,
                        ));
                        rawEmoji = getExtremeEmoji(
                          row.key,
                          allRowValues,
                          j,
                          rules,
                        );
                      }

                      const emoji = applyEmojiSettings(
                        rawEmoji,
                        showCrown,
                        showFlag,
                      );

                      const isCellPinned = pinnedCode === p.code;
                      const pinnedBase = isCellPinned
                        ? 'sticky left-40 z-10 border-r'
                        : (pinnedCode !== null ? j > 1 : j > 0)
                          ? 'border-l'
                          : '';

                      return (
                        <TableCell
                          key={p.code}
                          className={cn(
                            'py-3 tabular-nums text-sm font-medium border-border/40',
                            pinnedBase,
                            stickyBg,
                            className,
                          )}
                          style={
                            isCellPinned
                              ? {
                                  boxShadow: 'var(--table-pin-shadow)',
                                }
                              : undefined
                          }
                        >
                          <div className='grid grid-cols-[1.25rem_min-content_1.25rem] items-center justify-center gap-3'>
                            <span className='text-center text-base leading-none'>
                              {emoji}
                            </span>
                            <span className='text-center'>{text}</span>
                            <span />
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
    </div>
  );
}
