import type { NutritionRule, ThresholdColor } from '@/types/firestore';

export type { ThresholdColor };
export type ThresholdDirection = 'above' | 'below';

export interface ThresholdCondition {
  color: ThresholdColor;
  when: ThresholdDirection;
  value: number;
}

export type NutrientThresholds = Record<string, ThresholdCondition[]>;

export const THRESHOLDS: NutrientThresholds = {
  protein: [{ color: 'positive', when: 'above', value: 20 }],
  sugar: [
    { color: 'positive', when: 'below', value: 5 },
    { color: 'negative', when: 'above', value: 22.5 },
  ],
  saturated_fat: [
    { color: 'positive', when: 'below', value: 1.5 },
    { color: 'negative', when: 'above', value: 5 },
  ],
  fiber: [{ color: 'positive', when: 'above', value: 6 }],
  salt: [
    { color: 'positive', when: 'below', value: 0.3 },
    { color: 'negative', when: 'above', value: 1.5 },
  ],
};

export function getDefaultRules(): NutritionRule[] {
  const rules: NutritionRule[] = [];
  for (const [nutrient, conditions] of Object.entries(THRESHOLDS)) {
    for (const cond of conditions) {
      rules.push({
        nutrient,
        direction: cond.when,
        value: cond.value,
        rating: cond.color,
      });
    }
  }
  return rules;
}

export function getThresholdColor(
  nutrient: string,
  value: number | undefined,
  rules: NutritionRule[],
): ThresholdColor | null {
  if (value === undefined || isNaN(value)) return null;
  const sorted = rules
    .filter((r) => r.nutrient === nutrient)
    .sort((a, b) => {
      if (a.direction !== b.direction) return 0;
      return a.direction === 'above' ? b.value - a.value : a.value - b.value;
    });
  for (const rule of sorted) {
    if (rule.direction === 'above' && value > rule.value) return rule.rating;
    if (rule.direction === 'below' && value < rule.value) return rule.rating;
  }
  return null;
}

const round1 = (v: number) => parseFloat(v.toFixed(1));

export function getExtremeEmoji(
  nutrient: string,
  values: (number | undefined)[],
  index: number,
  rules: NutritionRule[],
  visibleRows: string[],
): '👑' | '🚩' | null {
  if (values.length < 2) return null;
  if (!visibleRows.includes(nutrient)) return null;
  const value = values[index];
  if (value === undefined || isNaN(value)) return null;

  const sorted = rules
    .filter((r) => r.nutrient === nutrient && (r.rating === 'positive' || r.rating === 'negative'))
    .sort((a, b) => {
      if (a.direction !== b.direction) return 0;
      return a.direction === 'above' ? b.value - a.value : a.value - b.value;
    });
  for (const rule of sorted) {
    const passes = (v: number) =>
      rule.direction === 'above' ? v > rule.value : v < rule.value;
    if (!passes(value)) continue;
    const passing = values
      .filter((v): v is number => v !== undefined && !isNaN(v) && passes(v))
      .map(round1);
    if (passing.length === 0) continue;
    const extreme =
      rule.direction === 'above' ? Math.max(...passing) : Math.min(...passing);
    if (round1(value) === extreme) {
      return rule.rating === 'positive' ? '👑' : '🚩';
    }
  }

  return null;
}
