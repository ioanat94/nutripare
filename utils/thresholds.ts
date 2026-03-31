import type { NutritionRule, ThresholdColor } from '@/types/firestore';

export function getThresholdColor(
  nutrient: string,
  value: number | undefined,
  rules: NutritionRule[],
): ThresholdColor | null {
  if (value === undefined || isNaN(value)) return null;
  const sorted = rules
    .filter((r) => r.nutrient === nutrient)
    .sort((a, b) => {
      if (a.direction !== b.direction) return a.direction === 'above' ? -1 : 1;
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
): '👑' | '🚩' | null {
  if (values.length < 2) return null;
  const value = values[index];
  if (value === undefined || isNaN(value)) return null;

  const sorted = rules
    .filter(
      (r) =>
        r.nutrient === nutrient &&
        (r.rating === 'positive' || r.rating === 'negative'),
    )
    .sort((a, b) => {
      if (a.direction !== b.direction) return a.direction === 'above' ? -1 : 1;
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
