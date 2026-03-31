'use client';

import { DEFAULT_ROWS } from '@/utils/constants';
import { DemoTable } from '@/components/demo-table';
import { RowData } from '@/types/table';
import { cn } from '@/utils/tailwind';
import { useState } from 'react';

// Low Carb: only carbs and sugar
// carbs <20 → positive, <40 → info, >60 → warning, >75 → negative
// sugar <3 → positive, <10 → info, >10 → warning, >15 → negative
// Scores computed via computeScore(): CC=5, GF=55, MO=79
const LOW_CARB_ROWS: RowData[] = [
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
      { value: '84', className: 'text-destructive', emoji: '🚩' }, // >75 negative, only one
      { value: '68', className: 'text-warning', emoji: null }, // >60 warning
      { value: '66', className: 'text-warning', emoji: null }, // >60 warning
    ],
  },
  {
    label: 'Sugar (g)',
    cells: [
      { value: '36.0', className: 'text-destructive', emoji: '🚩' }, // >15 negative, only one
      { value: '4.4', className: 'text-info', emoji: null }, // <10 info
      { value: '1.1', className: 'text-positive', emoji: '👑' }, // <3 positive, only one
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
      { value: '0.5', className: '', emoji: null },
      { value: '0.4', className: '', emoji: null },
      { value: '1.3', className: '', emoji: null },
    ],
  },
  {
    label: 'Fiber (g)',
    cells: [
      { value: '2.9', className: '', emoji: null },
      { value: '10.0', className: '', emoji: null },
      { value: '8.0', className: '', emoji: null },
    ],
  },
  {
    label: 'Salt (g)',
    cells: [
      { value: '0.5', className: '', emoji: null },
      { value: '0.4', className: '', emoji: null },
      { value: '0.1', className: '', emoji: null },
    ],
  },
  {
    label: 'Computed Score',
    cells: [
      { value: '5', className: '', emoji: null },
      { value: '55', className: '', emoji: null },
      { value: '79', className: '', emoji: null },
    ],
  },
];

// High Protein: only protein
// protein >20 → positive, >10 → info, <10 → warning, <5 → negative
// Scores computed via computeScore(): CC=44, GF=52, MO=54
const HIGH_PROTEIN_ROWS: RowData[] = [
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
      { value: '5.8', className: 'text-warning', emoji: null }, // <10 warning
      { value: '11.0', className: 'text-info', emoji: null }, // >10 info
      { value: '13.0', className: 'text-info', emoji: null }, // >10 info
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
      { value: '36.0', className: '', emoji: null },
      { value: '4.4', className: '', emoji: null },
      { value: '1.1', className: '', emoji: null },
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
      { value: '0.5', className: '', emoji: null },
      { value: '0.4', className: '', emoji: null },
      { value: '1.3', className: '', emoji: null },
    ],
  },
  {
    label: 'Fiber (g)',
    cells: [
      { value: '2.9', className: '', emoji: null },
      { value: '10.0', className: '', emoji: null },
      { value: '8.0', className: '', emoji: null },
    ],
  },
  {
    label: 'Salt (g)',
    cells: [
      { value: '0.5', className: '', emoji: null },
      { value: '0.4', className: '', emoji: null },
      { value: '0.1', className: '', emoji: null },
    ],
  },
  {
    label: 'Computed Score',
    cells: [
      { value: '44', className: '', emoji: null },
      { value: '52', className: '', emoji: null },
      { value: '54', className: '', emoji: null },
    ],
  },
];

// High Fiber: only fiber
// fiber >6 → positive, >3 → info, <3 → warning, <1.5 → negative
// Scores computed via computeScore(): CC=49, GF=86, MO=77
const HIGH_FIBER_ROWS: RowData[] = [
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
      { value: '36.0', className: '', emoji: null },
      { value: '4.4', className: '', emoji: null },
      { value: '1.1', className: '', emoji: null },
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
      { value: '0.5', className: '', emoji: null },
      { value: '0.4', className: '', emoji: null },
      { value: '1.3', className: '', emoji: null },
    ],
  },
  {
    label: 'Fiber (g)',
    cells: [
      { value: '2.9', className: 'text-warning', emoji: null }, // <3 warning
      { value: '10.0', className: 'text-positive', emoji: '👑' }, // >6 positive, highest
      { value: '8.0', className: 'text-positive', emoji: null }, // >6 positive
    ],
  },
  {
    label: 'Salt (g)',
    cells: [
      { value: '0.5', className: '', emoji: null },
      { value: '0.4', className: '', emoji: null },
      { value: '0.1', className: '', emoji: null },
    ],
  },
  {
    label: 'Computed Score',
    cells: [
      { value: '49', className: '', emoji: null },
      { value: '86', className: '', emoji: null },
      { value: '77', className: '', emoji: null },
    ],
  },
];

// Low Fat: fat and saturated fat
// fat <3 → positive, <10 → info, >10 → warning, >17.5 → negative
// sat_fat <1.5 → positive, <3 → info, >3 → warning, >5 → negative
// Scores computed via computeScore(): CC=90, GF=91, MO=67
const LOW_FAT_ROWS: RowData[] = [
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
      { value: '36.0', className: '', emoji: null },
      { value: '4.4', className: '', emoji: null },
      { value: '1.1', className: '', emoji: null },
    ],
  },
  {
    label: 'Fat (g)',
    cells: [
      { value: '2.4', className: 'text-positive', emoji: null }, // <3 positive
      { value: '2.2', className: 'text-positive', emoji: '👑' }, // <3 positive, lowest
      { value: '7.0', className: 'text-info', emoji: null }, // <10 info
    ],
  },
  {
    label: 'Saturated Fat (g)',
    cells: [
      { value: '0.5', className: 'text-positive', emoji: null }, // <1.5 positive
      { value: '0.4', className: 'text-positive', emoji: '👑' }, // <1.5 positive, lowest
      { value: '1.3', className: 'text-positive', emoji: null }, // <1.5 positive
    ],
  },
  {
    label: 'Fiber (g)',
    cells: [
      { value: '2.9', className: '', emoji: null },
      { value: '10.0', className: '', emoji: null },
      { value: '8.0', className: '', emoji: null },
    ],
  },
  {
    label: 'Salt (g)',
    cells: [
      { value: '0.5', className: '', emoji: null },
      { value: '0.4', className: '', emoji: null },
      { value: '0.1', className: '', emoji: null },
    ],
  },
  {
    label: 'Computed Score',
    cells: [
      { value: '90', className: '', emoji: null },
      { value: '91', className: '', emoji: null },
      { value: '67', className: '', emoji: null },
    ],
  },
];

// Low Salt: only salt
// salt <0.3 → positive, <0.75 → info, >0.75 → warning, >1.5 → negative
// Scores computed via computeScore(): CC=55, GF=56, MO=81
const LOW_SALT_ROWS: RowData[] = [
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
      { value: '36.0', className: '', emoji: null },
      { value: '4.4', className: '', emoji: null },
      { value: '1.1', className: '', emoji: null },
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
      { value: '0.5', className: '', emoji: null },
      { value: '0.4', className: '', emoji: null },
      { value: '1.3', className: '', emoji: null },
    ],
  },
  {
    label: 'Fiber (g)',
    cells: [
      { value: '2.9', className: '', emoji: null },
      { value: '10.0', className: '', emoji: null },
      { value: '8.0', className: '', emoji: null },
    ],
  },
  {
    label: 'Salt (g)',
    cells: [
      { value: '0.5', className: 'text-info', emoji: null }, // <0.75 info
      { value: '0.4', className: 'text-info', emoji: null }, // <0.75 info
      { value: '0.1', className: 'text-positive', emoji: '👑' }, // <0.3 positive, lowest
    ],
  },
  {
    label: 'Computed Score',
    cells: [
      { value: '55', className: '', emoji: null },
      { value: '56', className: '', emoji: null },
      { value: '81', className: '', emoji: null },
    ],
  },
];

const RULESETS = [
  { id: 'default', name: 'Default', rows: DEFAULT_ROWS },
  { id: 'low-carb', name: 'Low Carb', rows: LOW_CARB_ROWS },
  { id: 'high-protein', name: 'High Protein', rows: HIGH_PROTEIN_ROWS },
  { id: 'high-fiber', name: 'High Fiber', rows: HIGH_FIBER_ROWS },
  { id: 'low-fat', name: 'Low Fat', rows: LOW_FAT_ROWS },
  { id: 'low-salt', name: 'Low Salt', rows: LOW_SALT_ROWS },
];

export function RulesetDemo() {
  const [activeId, setActiveId] = useState('default');
  const active = RULESETS.find((r) => r.id === activeId)!;

  return (
    <DemoTable
      rows={active.rows}
      tableTopPadding
      toolbar={
        <div className='flex items-center gap-2 border-b border-border bg-background px-4 py-3'>
          <span className='text-xs text-muted-foreground'>Ruleset:</span>
          <div className='flex gap-1.5'>
            {RULESETS.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveId(r.id)}
                className={cn(
                  'cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  r.id === activeId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}
