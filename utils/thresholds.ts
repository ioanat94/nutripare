export type ThresholdColor = 'positive' | 'warning' | 'negative';
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

export function getThresholdColor(
  nutrient: string,
  value: number | undefined,
): ThresholdColor | null {
  if (value === undefined || isNaN(value)) return null;
  const conditions = THRESHOLDS[nutrient];
  if (!conditions) return null;
  for (const cond of conditions) {
    if (cond.when === 'above' && value > cond.value) return cond.color;
    if (cond.when === 'below' && value < cond.value) return cond.color;
  }
  return null;
}
