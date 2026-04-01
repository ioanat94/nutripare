import { NutrientThresholds } from '@/types/thresholds';
import { NutritionRule } from '@/types/firestore';

const THRESHOLDS: NutrientThresholds = {
  // protein: higher is better (no penalty for low values)
  protein: [
    { color: 'positive', when: 'above', value: 20 },
    { color: 'info', when: 'above', value: 10 },
  ],
  // sugar: lower is better
  sugar: [
    { color: 'positive', when: 'below', value: 5 },
    { color: 'info', when: 'below', value: 12.5 },
    { color: 'warning', when: 'above', value: 12.5 },
    { color: 'negative', when: 'above', value: 22.5 },
  ],
  // saturated fat: lower is better
  saturated_fat: [
    { color: 'positive', when: 'below', value: 1.5 },
    { color: 'info', when: 'below', value: 3 },
    { color: 'warning', when: 'above', value: 3 },
    { color: 'negative', when: 'above', value: 5 },
  ],
  // fiber: higher is better (no penalty for low values)
  fiber: [
    { color: 'positive', when: 'above', value: 6 },
    { color: 'info', when: 'above', value: 3 },
  ],
  // salt: lower is better
  salt: [
    { color: 'positive', when: 'below', value: 0.3 },
    { color: 'info', when: 'below', value: 0.75 },
    { color: 'warning', when: 'above', value: 0.75 },
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
