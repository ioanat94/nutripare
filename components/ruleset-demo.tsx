'use client';

import { useState } from 'react';

const PRODUCTS = [
  { name: 'Choco Crunch', code: '5000112637922' },
  { name: 'Grain Flakes', code: '5000159461122' },
  { name: 'Morning Oats', code: '5010029211258' },
];

type CellData = { value: string; className: string; emoji: '👑' | '🚩' | null };
type RowData = { label: string; cells: CellData[] };

// Default: standard traffic-light thresholds
// protein >20 → positive (none qualify); sugar <5 → positive, >22.5 → negative
// sat_fat <1.5 → positive, >5 → negative; fiber >6 → positive; salt <0.3 → positive
// Scores computed via computeScore(): CC=52, GF=91, MO=95
const DEFAULT_ROWS: RowData[] = [
  {
    label: 'Calories (kcal)',
    cells: [
      { value: '383', className: '', emoji: null },
      { value: '362', className: '', emoji: null },
      { value: '389', className: '', emoji: null },
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
      { value: '36.0', className: 'text-destructive', emoji: '🚩' },
      { value: '4.4', className: 'text-positive', emoji: null },
      { value: '1.1', className: 'text-positive', emoji: '👑' },
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
      { value: '0.5', className: 'text-positive', emoji: null },
      { value: '0.4', className: 'text-positive', emoji: '👑' },
      { value: '1.3', className: 'text-positive', emoji: null },
    ],
  },
  {
    label: 'Fiber (g)',
    cells: [
      { value: '2.9', className: '', emoji: null },
      { value: '10.0', className: 'text-positive', emoji: '👑' },
      { value: '8.0', className: 'text-positive', emoji: null },
    ],
  },
  {
    label: 'Salt (g)',
    cells: [
      { value: '0.5', className: '', emoji: null },
      { value: '0.4', className: '', emoji: null },
      { value: '0.1', className: 'text-positive', emoji: '👑' },
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

// Low Carb: penalises high carbs and sugar; protein is neutral
// carbs >60 → warning, >75 → negative; sugar <3 → positive, >3 → warning, >15 → negative
// sat_fat <1.5 → positive; fiber >6 → positive; salt <0.3 → positive
// Scores computed via computeScore(): CC=6, GF=86, MO=94
const LOW_CARB_ROWS: RowData[] = [
  {
    label: 'Calories (kcal)',
    cells: [
      { value: '383', className: '', emoji: null },
      { value: '362', className: '', emoji: null },
      { value: '389', className: '', emoji: null },
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
      { value: '84', className: 'text-destructive', emoji: '🚩' }, // >75
      { value: '68', className: 'text-warning', emoji: null }, // 60–75
      { value: '66', className: 'text-warning', emoji: null }, // 60–75
    ],
  },
  {
    label: 'Sugar (g)',
    cells: [
      { value: '36.0', className: 'text-destructive', emoji: '🚩' }, // >15
      { value: '4.4', className: 'text-warning', emoji: null }, // 3–15
      { value: '1.1', className: 'text-positive', emoji: '👑' }, // <3
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
      { value: '0.5', className: 'text-positive', emoji: null },
      { value: '0.4', className: 'text-positive', emoji: '👑' },
      { value: '1.3', className: 'text-positive', emoji: null },
    ],
  },
  {
    label: 'Fiber (g)',
    cells: [
      { value: '2.9', className: '', emoji: null }, // <6
      { value: '10.0', className: 'text-positive', emoji: '👑' }, // >6, highest
      { value: '8.0', className: 'text-positive', emoji: null }, // >6
    ],
  },
  {
    label: 'Salt (g)',
    cells: [
      { value: '0.5', className: '', emoji: null },
      { value: '0.4', className: '', emoji: null },
      { value: '0.1', className: 'text-positive', emoji: '👑' },
    ],
  },
  {
    label: 'Computed Score',
    cells: [
      { value: '6', className: '', emoji: null },
      { value: '86', className: '', emoji: null },
      { value: '94', className: '', emoji: null },
    ],
  },
];

// High Protein: penalises low protein, rewards high protein; everything else secondary
// protein <10 → negative, >10 → positive; sugar same as default; sat_fat/fiber/salt same
// Scores computed via computeScore(): CC=35, GF=93, MO=97
const HIGH_PROTEIN_ROWS: RowData[] = [
  {
    label: 'Calories (kcal)',
    cells: [
      { value: '383', className: '', emoji: null },
      { value: '362', className: '', emoji: null },
      { value: '389', className: '', emoji: null },
    ],
  },
  {
    label: 'Protein (g)',
    cells: [
      { value: '5.8', className: 'text-destructive', emoji: '🚩' }, // <10
      { value: '11.0', className: 'text-positive', emoji: null }, // >10
      { value: '13.0', className: 'text-positive', emoji: '👑' }, // >10, highest
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
      { value: '36.0', className: 'text-destructive', emoji: '🚩' },
      { value: '4.4', className: 'text-positive', emoji: null },
      { value: '1.1', className: 'text-positive', emoji: '👑' },
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
      { value: '0.5', className: 'text-positive', emoji: null },
      { value: '0.4', className: 'text-positive', emoji: '👑' },
      { value: '1.3', className: 'text-positive', emoji: null },
    ],
  },
  {
    label: 'Fiber (g)',
    cells: [
      { value: '2.9', className: '', emoji: null },
      { value: '10.0', className: 'text-positive', emoji: '👑' },
      { value: '8.0', className: 'text-positive', emoji: null },
    ],
  },
  {
    label: 'Salt (g)',
    cells: [
      { value: '0.5', className: '', emoji: null },
      { value: '0.4', className: '', emoji: null },
      { value: '0.1', className: 'text-positive', emoji: '👑' },
    ],
  },
  {
    label: 'Computed Score',
    cells: [
      { value: '35', className: '', emoji: null },
      { value: '93', className: '', emoji: null },
      { value: '97', className: '', emoji: null },
    ],
  },
];

const RULESETS = [
  { id: 'default', name: 'Default', rows: DEFAULT_ROWS },
  { id: 'low-carb', name: 'Low Carb', rows: LOW_CARB_ROWS },
  { id: 'high-protein', name: 'High Protein', rows: HIGH_PROTEIN_ROWS },
];

export function RulesetDemo() {
  const [activeId, setActiveId] = useState('default');
  const active = RULESETS.find((r) => r.id === activeId)!;

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
          nutripare.app/compare
        </span>
      </div>

      {/* Ruleset selector */}
      <div className='flex items-center gap-2 border-b border-border bg-background px-4 py-3'>
        <span className='text-xs text-muted-foreground'>Ruleset:</span>
        <div className='flex gap-1.5'>
          {RULESETS.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveId(r.id)}
              className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                r.id === activeId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className='overflow-x-auto bg-background pt-3'>
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
                  <span className='block truncate text-sm font-semibold text-foreground'>
                    {p.name}
                  </span>
                  <span className='font-mono text-xs text-muted-foreground'>
                    {p.code}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {active.rows.map((row, i) => (
              <tr
                key={row.label}
                className={`${i < active.rows.length - 1 ? 'border-b border-border' : ''} ${i % 2 === 0 ? 'bg-muted/30' : ''}`}
                style={{ height: '45px' }}
              >
                <td
                  className={`sticky left-0 z-10 w-32 bg-background py-0 pl-4 text-left ${i < active.rows.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <span className='text-sm font-medium text-muted-foreground'>
                    {row.label}
                  </span>
                </td>
                {row.cells.map((cell, j) => (
                  <td
                    key={j}
                    className={`py-0 pr-4 text-sm font-medium tabular-nums ${cell.className}`}
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
