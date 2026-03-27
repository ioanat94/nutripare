'use client';

import { useState } from 'react';

import { DEFAULT_ROWS, DemoTable, RowData } from '@/components/demo-table';

// Low Carb: penalises high carbs and sugar; protein is neutral
// carbs >60 → warning, >75 → negative; sugar <3 → positive, >3 → warning, >15 → negative
// sat_fat <1.5 → positive; fiber >6 → positive; salt <0.3 → positive
// Scores computed via computeScore(): CC=6, GF=86, MO=94
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
      { value: '381', className: '', emoji: null },
      { value: '336', className: '', emoji: null },
      { value: '379', className: '', emoji: null },
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
      }
    />
  );
}
