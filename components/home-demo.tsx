import { MoreHorizontal } from 'lucide-react';

const PRODUCTS = [
  { name: 'Choco Crunch', code: '5000112637922' },
  { name: 'Grain Flakes', code: '5000159461122' },
  { name: 'Morning Oats', code: '5010029211258' },
];

type CellData = { value: string; className: string; emoji: '👑' | '🚩' | null };

// Default ruleset thresholds (per 100g) — same rules used for computed scores:
// protein >20 → positive (none qualify)
// sugar <5 → positive, >22.5 → negative
// sat_fat <1.5 → positive, >5 → negative
// fiber >6 → positive
// salt <0.3 → positive
// Calories computed as protein×4 + carbs×4 + fat×9: CC=381, GF=336, MO=379
// Scores computed via computeScore(): CC=52, GF=91, MO=95
const ROWS: Array<{ label: string; cells: CellData[] }> = [
  {
    label: 'Calories (kcal)',
    cells: [
      { value: '381', className: '', emoji: null },
      { value: '336', className: '', emoji: null },
      { value: '379', className: '', emoji: null },
    ],
  },
  {
    label: 'Protein (g)',
    cells: [
      { value: '5.8', className: '', emoji: null },
      { value: '11.0', className: '', emoji: null },
      { value: '13.0', className: '', emoji: null },
    ],
  },
  {
    label: 'Carbohydrates (g)',
    cells: [
      { value: '84', className: '', emoji: null },
      { value: '68', className: '', emoji: null },
      { value: '66', className: '', emoji: null },
    ],
  },
  {
    label: 'Sugar (g)',
    cells: [
      { value: '36.0', className: 'text-destructive', emoji: '🚩' }, // >22.5, highest
      { value: '4.4', className: 'text-positive', emoji: null }, // <5
      { value: '1.1', className: 'text-positive', emoji: '👑' }, // <5, lowest
    ],
  },
  {
    label: 'Fat (g)',
    cells: [
      { value: '2.4', className: '', emoji: null },
      { value: '2.2', className: '', emoji: null },
      { value: '7.0', className: '', emoji: null },
    ],
  },
  {
    label: 'Saturated Fat (g)',
    cells: [
      { value: '0.5', className: 'text-positive', emoji: null }, // <1.5
      { value: '0.4', className: 'text-positive', emoji: '👑' }, // <1.5, lowest
      { value: '1.3', className: 'text-positive', emoji: null }, // <1.5
    ],
  },
  {
    label: 'Fiber (g)',
    cells: [
      { value: '2.9', className: '', emoji: null }, // <6, neutral
      { value: '10.0', className: 'text-positive', emoji: '👑' }, // >6, highest
      { value: '8.0', className: 'text-positive', emoji: null }, // >6
    ],
  },
  {
    label: 'Salt (g)',
    cells: [
      { value: '0.5', className: '', emoji: null },
      { value: '0.4', className: '', emoji: null },
      { value: '0.1', className: 'text-positive', emoji: '👑' }, // <0.3, only one
    ],
  },
  {
    label: 'Computed Score',
    cells: [
      { value: '52', className: '', emoji: null },
      { value: '91', className: '', emoji: null },
      { value: '95', className: '', emoji: null },
    ],
  },
];

export function HomeDemo() {
  return (
    <div
      className='w-full overflow-hidden rounded-xl border border-border shadow-lg'
      style={{ maxWidth: 'calc(100vw - 3rem)' }}
      aria-hidden='true'
    >
      {/* Browser chrome */}
      <div className='flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2.5'>
        <div className='flex gap-1.5'>
          <span className='size-2.5 rounded-full bg-[#ff5f57]' />
          <span className='size-2.5 rounded-full bg-[#febc2e]' />
          <span className='size-2.5 rounded-full bg-[#28c840]' />
        </div>
        <span className='flex-1 pr-10 text-center text-xs text-muted-foreground/60'>
          nutripare.eu/compare
        </span>
      </div>

      {/* Toolbar */}
      <div className='flex items-center justify-between bg-background px-4 pb-3 pt-3'>
        <p className='text-sm text-muted-foreground'>3 products</p>
        <MoreHorizontal
          className='size-4 text-muted-foreground'
          aria-hidden='true'
        />
      </div>

      {/* Table area */}
      <div className='overflow-x-auto bg-background'>
        <table
          style={{
            width: '100%',
            minWidth: 'calc(8rem + 3 * 14rem)',
            tableLayout: 'fixed',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr className='border-b border-border'>
              <th className='sticky left-0 z-10 w-32 bg-background px-4 pb-1 text-right align-bottom text-xs font-normal text-muted-foreground'>
                per 100g
              </th>
              {PRODUCTS.map((p) => (
                <th key={p.code} className='w-48 px-4 pb-1 align-top text-left'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0 flex-1'>
                      <span className='block truncate text-sm font-semibold text-foreground'>
                        {p.name}
                      </span>
                      <span className='font-mono text-xs text-muted-foreground'>
                        {p.code}
                      </span>
                    </div>
                    <MoreHorizontal className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr
                key={row.label}
                className={`${i < ROWS.length - 1 ? 'border-b border-border' : ''} ${i % 2 === 0 ? 'bg-muted/30' : ''}`}
                style={{ height: '45px' }}
              >
                <td
                  className={`sticky left-0 z-10 w-32 bg-background py-0 pl-4 text-left ${i < ROWS.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <span className='text-sm font-medium text-muted-foreground'>
                    {row.label}
                  </span>
                </td>
                {row.cells.map((cell, j) => (
                  <td
                    key={j}
                    className={`py-0 text-sm font-medium tabular-nums pr-4 ${cell.className}`}
                  >
                    <div className='flex items-center justify-end'>
                      <span className='w-5 shrink-0 text-center text-base leading-none'>
                        {cell.emoji}
                      </span>
                      <span className='w-12 text-right'>{cell.value}</span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
