import type { NutritionRule } from '@/types/firestore';
import type { ProductNutrition } from '@/types/openfoodfacts';

export const COMPUTED_SCORE_KEY = 'computed_score';

const RATING_WEIGHT: Record<string, number> = {
  positive: 3,
  info: 1,
  warning: -1,
  negative: -3,
};

export function computeScore(
  product: ProductNutrition,
  rules: NutritionRule[],
): number | null {
  const scoringRules = rules.filter((r) => r.nutrient !== COMPUTED_SCORE_KEY);
  if (scoringRules.length === 0) return null;

  let rawScore = 0;
  for (const rule of scoringRules) {
    const value = product[rule.nutrient as keyof ProductNutrition] as number | undefined;
    if (value === undefined || isNaN(value)) continue;

    const fires =
      rule.direction === 'above' ? value > rule.value : value < rule.value;
    if (!fires) continue;

    const distance = Math.abs(value - rule.value);
    const normalized = distance / Math.max(rule.value, 1);
    const magnitude = Math.log(1 + normalized);
    const weight = RATING_WEIGHT[rule.rating] ?? 0;
    rawScore += weight * magnitude;
  }

  const finalScore = Math.round(50 * (1 + Math.tanh(rawScore / 3)));
  return Math.max(0, Math.min(100, finalScore));
}
