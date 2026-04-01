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
// protein >20 → positive, >10 → info (no penalty for low values)
// sugar <5 → positive, <12.5 → info, >12.5 → warning, >22.5 → negative
// sat_fat <1.5 → positive, <3 → info, >3 → warning, >5 → negative
// fiber >6 → positive, >3 → info (no penalty for low values)
// salt <0.3 → positive, <0.75 → info, >0.75 → warning, >1.5 → negative
// Calories computed as protein×4 + carbs×4 + fat×9: CC=381, GF=336, MO=379
// Scores computed via computeScore(): CC=48, GF=99, MO=99
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
      { value: '5.8', className: '', emoji: null }, // no rule matches
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
      { value: '36.0', className: 'text-destructive', emoji: '🚩' }, // >22.5 negative, highest
      { value: '4.4', className: 'text-positive', emoji: null }, // <5 positive
      { value: '1.1', className: 'text-positive', emoji: '👑' }, // <5 positive, lowest
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
      { value: '0.5', className: 'text-positive', emoji: null }, // <1.5 positive
      { value: '0.4', className: 'text-positive', emoji: '👑' }, // <1.5 positive, lowest
      { value: '1.3', className: 'text-positive', emoji: null }, // <1.5 positive
    ],
  },
  {
    label: 'Fiber (g)',
    cells: [
      { value: '2.9', className: '', emoji: null }, // no rule matches
      { value: '10.0', className: 'text-positive', emoji: '👑' }, // >6 positive, highest
      { value: '8.0', className: 'text-positive', emoji: null }, // >6 positive
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
      { value: '48', className: '', emoji: null },
      { value: '99', className: '', emoji: null },
      { value: '99', className: '', emoji: null },
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
      // carbohydrates: lower is better
      {
        nutrient: 'carbohydrates',
        direction: 'below',
        value: 20,
        rating: 'positive',
      },
      {
        nutrient: 'carbohydrates',
        direction: 'below',
        value: 40,
        rating: 'info',
      },
      {
        nutrient: 'carbohydrates',
        direction: 'above',
        value: 60,
        rating: 'warning',
      },
      {
        nutrient: 'carbohydrates',
        direction: 'above',
        value: 75,
        rating: 'negative',
      },
      // sugar: lower is better
      { nutrient: 'sugar', direction: 'below', value: 3, rating: 'positive' },
      { nutrient: 'sugar', direction: 'below', value: 10, rating: 'info' },
      { nutrient: 'sugar', direction: 'above', value: 10, rating: 'warning' },
      { nutrient: 'sugar', direction: 'above', value: 15, rating: 'negative' },
    ],
  },
  {
    id: 'high-protein',
    name: 'High Protein',
    rules: [
      // protein: higher is better
      {
        nutrient: 'protein',
        direction: 'above',
        value: 20,
        rating: 'positive',
      },
      { nutrient: 'protein', direction: 'above', value: 10, rating: 'info' },
      { nutrient: 'protein', direction: 'below', value: 10, rating: 'warning' },
      { nutrient: 'protein', direction: 'below', value: 5, rating: 'negative' },
    ],
  },
  {
    id: 'high-fiber',
    name: 'High Fiber',
    rules: [
      // fiber: higher is better
      { nutrient: 'fiber', direction: 'above', value: 6, rating: 'positive' },
      { nutrient: 'fiber', direction: 'above', value: 3, rating: 'info' },
      { nutrient: 'fiber', direction: 'below', value: 3, rating: 'warning' },
      { nutrient: 'fiber', direction: 'below', value: 1.5, rating: 'negative' },
    ],
  },
  {
    id: 'low-fat',
    name: 'Low Fat',
    rules: [
      // fat: lower is better
      { nutrient: 'fat', direction: 'below', value: 3, rating: 'positive' },
      { nutrient: 'fat', direction: 'below', value: 10, rating: 'info' },
      { nutrient: 'fat', direction: 'above', value: 10, rating: 'warning' },
      { nutrient: 'fat', direction: 'above', value: 17.5, rating: 'negative' },
      // saturated fat: lower is better
      {
        nutrient: 'saturated_fat',
        direction: 'below',
        value: 1.5,
        rating: 'positive',
      },
      {
        nutrient: 'saturated_fat',
        direction: 'below',
        value: 3,
        rating: 'info',
      },
      {
        nutrient: 'saturated_fat',
        direction: 'above',
        value: 3,
        rating: 'warning',
      },
      {
        nutrient: 'saturated_fat',
        direction: 'above',
        value: 5,
        rating: 'negative',
      },
    ],
  },
  {
    id: 'low-salt',
    name: 'Low Salt',
    rules: [
      // salt: lower is better
      { nutrient: 'salt', direction: 'below', value: 0.3, rating: 'positive' },
      { nutrient: 'salt', direction: 'below', value: 0.75, rating: 'info' },
      { nutrient: 'salt', direction: 'above', value: 0.75, rating: 'warning' },
      { nutrient: 'salt', direction: 'above', value: 1.5, rating: 'negative' },
    ],
  },
];

export const HELP_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'searching', label: 'Searching for Products' },
  { id: 'nutrition-table', label: 'The Nutrition Table' },
  { id: 'table-actions', label: 'Table Actions' },
  { id: 'saving', label: 'Saving Products and Comparisons' },
  { id: 'settings-account', label: 'Settings — Account' },
  { id: 'settings-nutrition', label: 'Settings — Nutrition' },
  { id: 'settings-products', label: 'Settings — Products' },
  { id: 'settings-comparisons', label: 'Settings — Comparisons' },
  { id: 'account-features', label: 'Signed-in vs. Signed-out' },
  { id: 'faq', label: 'FAQ' },
];

export const RATING_LABEL: Record<string, string> = {
  positive: 'Great',
  info: 'Good',
  warning: 'Concerning',
  negative: 'Bad',
};

export const NUTRIENT_LABEL: Record<string, string> = {
  protein: 'Protein',
  sugar: 'Sugar',
  saturated_fat: 'Saturated Fat',
  fiber: 'Fiber',
  salt: 'Salt',
  carbohydrates: 'Carbohydrates',
  fat: 'Fat',
};

export const RULESET_DESCRIPTION: Record<string, string> = {
  'low-carb': 'Focuses on carbohydrate and sugar content.',
  'high-protein': 'Focuses on protein content only.',
  'high-fiber': 'Focuses on fiber content only.',
  'low-fat': 'Focuses on fat and saturated fat content.',
  'low-salt': 'Focuses on salt content only.',
};
