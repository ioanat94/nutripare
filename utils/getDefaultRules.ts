import { NutrientThresholds } from '@/types/thresholds';
import { NutritionRule } from '@/types/firestore';

const THRESHOLDS: NutrientThresholds = {
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
