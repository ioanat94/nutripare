import { computeScore } from '@/utils/score';
import type { NutritionRule } from '@/types/firestore';
import type { ProductNutrition } from '@/types/openfoodfacts';

function makeProduct(overrides: Partial<ProductNutrition> = {}): ProductNutrition {
  return {
    code: '111',
    product_name: 'Test',
    kcals: 100,
    protein: 5,
    carbohydrates: 20,
    sugar: 10,
    fat: 3,
    saturated_fat: 1,
    fiber: 2,
    salt: 0.5,
    ...overrides,
  };
}

describe('computeScore', () => {
  it('returns null when rules array is empty (no rules defined)', () => {
    expect(computeScore(makeProduct(), [])).toBeNull();
  });

  it('returns null when only computed_score rules exist', () => {
    const rules: NutritionRule[] = [
      { nutrient: 'computed_score', direction: 'above', value: 70, rating: 'positive' },
    ];
    expect(computeScore(makeProduct(), rules)).toBeNull();
  });

  it('returns 50 when no rules fire (value does not cross threshold)', () => {
    const rules: NutritionRule[] = [
      { nutrient: 'protein', direction: 'above', value: 20, rating: 'positive' },
    ];
    // protein = 5, threshold = 20 → rule does not fire
    expect(computeScore(makeProduct({ protein: 5 }), rules)).toBe(50);
  });

  it('returns a score above 50 when a positive rule fires', () => {
    const rules: NutritionRule[] = [
      { nutrient: 'protein', direction: 'above', value: 20, rating: 'positive' },
    ];
    const score = computeScore(makeProduct({ protein: 30 }), rules);
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThan(50);
  });

  it('returns a higher score when positive rule fires further from threshold', () => {
    const rules: NutritionRule[] = [
      { nutrient: 'protein', direction: 'above', value: 20, rating: 'positive' },
    ];
    const closeScore = computeScore(makeProduct({ protein: 22 }), rules)!;
    const farScore = computeScore(makeProduct({ protein: 50 }), rules)!;
    expect(farScore).toBeGreaterThan(closeScore);
  });

  it('returns a score below 50 when a negative rule fires', () => {
    const rules: NutritionRule[] = [
      { nutrient: 'sugar', direction: 'above', value: 22.5, rating: 'negative' },
    ];
    const score = computeScore(makeProduct({ sugar: 30 }), rules);
    expect(score).not.toBeNull();
    expect(score!).toBeLessThan(50);
  });

  it('returns a lower score when negative rule fires further from threshold', () => {
    const rules: NutritionRule[] = [
      { nutrient: 'sugar', direction: 'above', value: 22.5, rating: 'negative' },
    ];
    const closeScore = computeScore(makeProduct({ sugar: 25 }), rules)!;
    const farScore = computeScore(makeProduct({ sugar: 60 }), rules)!;
    expect(farScore).toBeLessThan(closeScore);
  });

  it('stacks tiered rules and score increases monotonically through both thresholds', () => {
    const rules: NutritionRule[] = [
      { nutrient: 'protein', direction: 'above', value: 10, rating: 'info' },
      { nutrient: 'protein', direction: 'above', value: 20, rating: 'positive' },
    ];
    const score5 = computeScore(makeProduct({ protein: 5 }), rules)!;   // no rules fire
    const score15 = computeScore(makeProduct({ protein: 15 }), rules)!; // first rule fires
    const score25 = computeScore(makeProduct({ protein: 25 }), rules)!; // both rules fire
    expect(score5).toBe(50);
    expect(score15).toBeGreaterThan(score5);
    expect(score25).toBeGreaterThan(score15);
  });

  it('opposing rules produce a peak and then decline', () => {
    const rules: NutritionRule[] = [
      { nutrient: 'fiber', direction: 'above', value: 10, rating: 'info' },
      { nutrient: 'fiber', direction: 'above', value: 30, rating: 'negative' },
    ];
    const score20 = computeScore(makeProduct({ fiber: 20 }), rules)!; // only info fires
    const score40 = computeScore(makeProduct({ fiber: 40 }), rules)!; // both fire; net may be lower
    // At value=20 only info fires (+1 weight); at value=40 info (+1) and negative (-3) both fire
    // Net at 40 should be lower than at 20
    expect(score40).toBeLessThan(score20);
  });

  it('score is clamped to [0, 100] and rounded to a whole number', () => {
    // Multiple strong negative rules to try to push below 0
    const rules: NutritionRule[] = Array.from({ length: 10 }, (_, i) => ({
      nutrient: 'sugar',
      direction: 'above' as const,
      value: i * 0.1,
      rating: 'negative' as const,
    }));
    // Deduplicate by value to avoid validation issues (fine here since we're testing score math)
    const score = computeScore(makeProduct({ sugar: 100 }), rules)!;
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(Number.isInteger(score)).toBe(true);
  });

  it('missing/NaN nutrient value: rule does not fire, does not throw', () => {
    const rules: NutritionRule[] = [
      { nutrient: 'protein', direction: 'above', value: 20, rating: 'positive' },
    ];
    expect(() => computeScore(makeProduct({ protein: undefined }), rules)).not.toThrow();
    expect(computeScore(makeProduct({ protein: undefined }), rules)).toBe(50);
  });

  it('NaN nutrient value does not cause an error', () => {
    const rules: NutritionRule[] = [
      { nutrient: 'protein', direction: 'above', value: 20, rating: 'positive' },
    ];
    expect(() => computeScore(makeProduct({ protein: NaN }), rules)).not.toThrow();
    expect(computeScore(makeProduct({ protein: NaN }), rules)).toBe(50);
  });
});
