import { NutritionRuleset } from '@/types/firestore';
import { RowData } from '@/types/table';
import { getDefaultRules } from './getDefaultRules';

export const COMPUTED_SCORE_KEY = 'computed_score';

export const PRODUCTS = [
  { name: 'Choco Crunch', code: '5000112637922' },
  { name: 'Grain Flakes', code: '5000159461122' },
  { name: 'Morning Oats', code: '5010029211258' },
];

// Default ruleset thresholds (per 100g) — same rules used for computed scores:
// protein >20 → positive (none qualify)
// sugar <5 → positive, >22.5 → negative
// sat_fat <1.5 → positive, >5 → negative
// fiber >6 → positive
// salt <0.3 → positive
// Calories computed as protein×4 + carbs×4 + fat×9: CC=381, GF=336, MO=379
// Scores computed via computeScore(): CC=52, GF=91, MO=95
export const DEFAULT_ROWS: RowData[] = [
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

export const SCORE_ROW = {
  label: 'Computed Score',
  key: COMPUTED_SCORE_KEY,
} as const;

export const DEFAULT_NUTRITION_ROWS = [
  'kcals',
  'protein',
  'carbohydrates',
  'sugar',
  'fat',
  'saturated_fat',
  'fiber',
  'salt',
  'computed_score',
] as const;

export const BUILTIN_RULESETS: NutritionRuleset[] = [
  {
    id: 'default',
    name: 'Default',
    rules: getDefaultRules(),
  },
  {
    id: 'low-carb',
    name: 'Low Carb',
    rules: [
      {
        nutrient: 'carbohydrates',
        direction: 'above',
        value: 75,
        rating: 'negative',
      },
      {
        nutrient: 'carbohydrates',
        direction: 'above',
        value: 60,
        rating: 'warning',
      },
      { nutrient: 'sugar', direction: 'below', value: 3, rating: 'positive' },
      { nutrient: 'sugar', direction: 'above', value: 3, rating: 'warning' },
      { nutrient: 'sugar', direction: 'above', value: 15, rating: 'negative' },
      {
        nutrient: 'saturated_fat',
        direction: 'below',
        value: 1.5,
        rating: 'positive',
      },
      { nutrient: 'fiber', direction: 'above', value: 6, rating: 'positive' },
      { nutrient: 'salt', direction: 'below', value: 0.3, rating: 'positive' },
    ],
  },
  {
    id: 'high-protein',
    name: 'High Protein',
    rules: [
      {
        nutrient: 'protein',
        direction: 'below',
        value: 10,
        rating: 'negative',
      },
      {
        nutrient: 'protein',
        direction: 'above',
        value: 10,
        rating: 'positive',
      },
      { nutrient: 'sugar', direction: 'below', value: 5, rating: 'positive' },
      {
        nutrient: 'sugar',
        direction: 'above',
        value: 22.5,
        rating: 'negative',
      },
      {
        nutrient: 'saturated_fat',
        direction: 'below',
        value: 1.5,
        rating: 'positive',
      },
      {
        nutrient: 'saturated_fat',
        direction: 'above',
        value: 5,
        rating: 'negative',
      },
      { nutrient: 'fiber', direction: 'above', value: 6, rating: 'positive' },
      { nutrient: 'salt', direction: 'below', value: 0.3, rating: 'positive' },
      { nutrient: 'salt', direction: 'above', value: 1.5, rating: 'negative' },
    ],
  },
];
