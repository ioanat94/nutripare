import { getExtremeEmoji, getThresholdColor } from '@/utils/thresholds';

import { BUILTIN_RULESETS } from '@/utils/constants';
import type { NutritionRule } from '@/types/firestore';
import { getDefaultRules } from '@/utils/getDefaultRules';

const rule = (
  nutrient: string,
  direction: 'above' | 'below',
  value: number,
  rating: NutritionRule['rating'],
): NutritionRule => ({ nutrient, direction, value, rating });

// ---------------------------------------------------------------------------
// BUILTIN_RULESETS
// ---------------------------------------------------------------------------

describe('BUILTIN_RULESETS', () => {
  it('exports exactly 3 rulesets', () => {
    expect(BUILTIN_RULESETS).toHaveLength(3);
  });

  it('contains Default, Low Carb, and High Protein rulesets', () => {
    const ids = BUILTIN_RULESETS.map((r) => r.id);
    expect(ids).toContain('default');
    expect(ids).toContain('low-carb');
    expect(ids).toContain('high-protein');
  });

  it('Default ruleset rules match getDefaultRules()', () => {
    const defaultRuleset = BUILTIN_RULESETS.find((r) => r.id === 'default')!;
    expect(defaultRuleset.rules).toEqual(getDefaultRules());
  });

  it('each ruleset has at least one rule', () => {
    for (const rs of BUILTIN_RULESETS) {
      expect(rs.rules.length).toBeGreaterThan(0);
    }
  });

  it('Low Carb ruleset penalises high carbohydrates', () => {
    const lowCarb = BUILTIN_RULESETS.find((r) => r.id === 'low-carb')!;
    const carbRules = lowCarb.rules.filter(
      (r) => r.nutrient === 'carbohydrates',
    );
    expect(carbRules.length).toBeGreaterThan(0);
    expect(carbRules.some((r) => r.rating === 'negative')).toBe(true);
  });

  it('High Protein ruleset rewards high protein', () => {
    const highProtein = BUILTIN_RULESETS.find((r) => r.id === 'high-protein')!;
    const proteinRules = highProtein.rules.filter(
      (r) => r.nutrient === 'protein',
    );
    expect(
      proteinRules.some(
        (r) => r.direction === 'above' && r.rating === 'positive',
      ),
    ).toBe(true);
    expect(
      proteinRules.some(
        (r) => r.direction === 'below' && r.rating === 'negative',
      ),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getThresholdColor
// ---------------------------------------------------------------------------

describe('getThresholdColor', () => {
  describe('basic matching', () => {
    it('returns the rating when value is above threshold', () => {
      expect(
        getThresholdColor('protein', 25, [
          rule('protein', 'above', 20, 'positive'),
        ]),
      ).toBe('positive');
    });

    it('returns the rating when value is below threshold', () => {
      expect(
        getThresholdColor('salt', 0.2, [
          rule('salt', 'below', 0.3, 'positive'),
        ]),
      ).toBe('positive');
    });

    it('returns null when value equals the threshold (not strictly above)', () => {
      expect(
        getThresholdColor('protein', 20, [
          rule('protein', 'above', 20, 'positive'),
        ]),
      ).toBeNull();
    });

    it('returns null when value equals the threshold (not strictly below)', () => {
      expect(
        getThresholdColor('salt', 0.3, [
          rule('salt', 'below', 0.3, 'positive'),
        ]),
      ).toBeNull();
    });

    it('returns null when no rule matches', () => {
      expect(
        getThresholdColor('protein', 10, [
          rule('protein', 'above', 20, 'positive'),
        ]),
      ).toBeNull();
    });

    it('returns null when nutrient has no rules', () => {
      expect(
        getThresholdColor('kcals', 500, [
          rule('protein', 'above', 20, 'positive'),
        ]),
      ).toBeNull();
    });

    it('returns null for undefined value', () => {
      expect(
        getThresholdColor('protein', undefined, [
          rule('protein', 'above', 20, 'positive'),
        ]),
      ).toBeNull();
    });

    it('returns null for NaN value', () => {
      expect(
        getThresholdColor('protein', NaN, [
          rule('protein', 'above', 20, 'positive'),
        ]),
      ).toBeNull();
    });

    it('returns null for empty rules array', () => {
      expect(getThresholdColor('protein', 25, [])).toBeNull();
    });
  });

  describe('specificity — most restrictive rule wins', () => {
    it('returns the higher-threshold rating when value passes both above rules', () => {
      // protein above 10 is good, above 15 is great — value 20 should return great
      const rules = [
        rule('protein', 'above', 10, 'info'),
        rule('protein', 'above', 15, 'positive'),
      ];
      expect(getThresholdColor('protein', 20, rules)).toBe('positive');
    });

    it('returns the lower-threshold rating when value only passes the less restrictive above rule', () => {
      // protein above 10 is good, above 15 is great — value 12 should return good
      const rules = [
        rule('protein', 'above', 10, 'info'),
        rule('protein', 'above', 15, 'positive'),
      ];
      expect(getThresholdColor('protein', 12, rules)).toBe('info');
    });

    it('returns the lower-threshold rating when value passes both below rules', () => {
      // salt below 0.6 is good, below 0.3 is great — value 0.2 should return great
      const rules = [
        rule('salt', 'below', 0.6, 'info'),
        rule('salt', 'below', 0.3, 'positive'),
      ];
      expect(getThresholdColor('salt', 0.2, rules)).toBe('positive');
    });

    it('returns the higher-threshold rating when value only passes the less restrictive below rule', () => {
      // salt below 0.6 is good, below 0.3 is great — value 0.4 should return good
      const rules = [
        rule('salt', 'below', 0.6, 'info'),
        rule('salt', 'below', 0.3, 'positive'),
      ];
      expect(getThresholdColor('salt', 0.4, rules)).toBe('info');
    });

    it('is not affected by rule array order', () => {
      // same rules in reversed order should give same result
      const rules = [
        rule('protein', 'above', 15, 'positive'),
        rule('protein', 'above', 10, 'info'),
      ];
      expect(getThresholdColor('protein', 20, rules)).toBe('positive');
      expect(getThresholdColor('protein', 12, rules)).toBe('info');
    });

    it('handles above and below rules on the same nutrient independently', () => {
      const rules = [
        rule('sugar', 'below', 5, 'positive'),
        rule('sugar', 'above', 22.5, 'negative'),
      ];
      expect(getThresholdColor('sugar', 3, rules)).toBe('positive');
      expect(getThresholdColor('sugar', 25, rules)).toBe('negative');
      expect(getThresholdColor('sugar', 10, rules)).toBeNull();
    });
  });

  describe('real-world scenario: sugar above 5 good, above 10 bad', () => {
    const rules = [
      rule('sugar', 'above', 5, 'info'),
      rule('sugar', 'above', 10, 'negative'),
    ];

    it('returns null for value 3 (below both thresholds)', () => {
      expect(getThresholdColor('sugar', 3, rules)).toBeNull();
    });

    it('returns info (good) for value 7 (between thresholds)', () => {
      expect(getThresholdColor('sugar', 7, rules)).toBe('info');
    });

    it('returns negative (bad) for value 15 (above both thresholds)', () => {
      expect(getThresholdColor('sugar', 15, rules)).toBe('negative');
    });
  });
});

// ---------------------------------------------------------------------------
// getExtremeEmoji
// ---------------------------------------------------------------------------

describe('getExtremeEmoji', () => {
  const defaultRules = getDefaultRules();

  describe('basic behaviour', () => {
    it('returns null when only one product is present', () => {
      expect(getExtremeEmoji('protein', [25], 0, defaultRules)).toBeNull();
    });

    it('returns null when value is undefined', () => {
      expect(
        getExtremeEmoji('protein', [undefined, 30], 0, defaultRules),
      ).toBeNull();
    });

    it('returns null when no rule applies (value below threshold)', () => {
      expect(getExtremeEmoji('protein', [5, 10], 1, defaultRules)).toBeNull();
    });

    it('returns null when rules array is empty', () => {
      expect(getExtremeEmoji('protein', [25, 30], 1, [])).toBeNull();
    });
  });

  describe('crown (positive)', () => {
    it('returns crown for the highest protein value above the positive threshold', () => {
      // protein above 20 is positive; 30 > 25
      expect(getExtremeEmoji('protein', [25, 30], 1, defaultRules)).toBe('👑');
    });

    it('does not return crown for a lower value that also passes the threshold', () => {
      expect(getExtremeEmoji('protein', [25, 30], 0, defaultRules)).toBeNull();
    });

    it('returns crown for both products when tied', () => {
      expect(getExtremeEmoji('protein', [30, 30], 0, defaultRules)).toBe('👑');
      expect(getExtremeEmoji('protein', [30, 30], 1, defaultRules)).toBe('👑');
    });

    it('returns crown for the lowest salt value below the positive threshold', () => {
      // salt below 0.3 is positive; 0.1 < 0.2
      expect(getExtremeEmoji('salt', [0.1, 0.2], 0, defaultRules)).toBe('👑');
      expect(getExtremeEmoji('salt', [0.1, 0.2], 1, defaultRules)).toBeNull();
    });
  });

  describe('flag (negative)', () => {
    it('returns flag for the highest sugar value above the negative threshold', () => {
      // sugar above 22.5 is negative; 30 > 25
      expect(getExtremeEmoji('sugar', [25, 30], 1, defaultRules)).toBe('🚩');
    });

    it('does not return flag for a lower value that also passes the threshold', () => {
      expect(getExtremeEmoji('sugar', [25, 30], 0, defaultRules)).toBeNull();
    });

    it('returns flag for both products when tied', () => {
      expect(getExtremeEmoji('sugar', [30, 30], 0, defaultRules)).toBe('🚩');
      expect(getExtremeEmoji('sugar', [30, 30], 1, defaultRules)).toBe('🚩');
    });

    it('returns flag for the highest salt value above the negative threshold', () => {
      // salt above 1.5 is negative; 2 > 1.7
      expect(getExtremeEmoji('salt', [1.7, 2], 1, defaultRules)).toBe('🚩');
      expect(getExtremeEmoji('salt', [1.7, 2], 0, defaultRules)).toBeNull();
    });
  });

  describe('specificity — most restrictive rule determines the emoji', () => {
    it('uses the higher-threshold positive rule for crown assignment', () => {
      // protein above 10 is info (skipped), above 15 is positive — only above-15 values compete for crown
      const rules = [
        rule('protein', 'above', 10, 'info'),
        rule('protein', 'above', 15, 'positive'),
      ];
      // values: 12 passes above-10 only, 20 passes both
      // crown should go to 20 (the extreme for the positive rule)
      expect(getExtremeEmoji('protein', [12, 20], 1, rules)).toBe('👑');
      expect(getExtremeEmoji('protein', [12, 20], 0, rules)).toBeNull();
    });

    it('uses the lower-threshold negative rule for flag assignment', () => {
      // sugar above 10 is warning (skipped), above 20 is negative — only above-20 values compete for flag
      const rules = [
        rule('sugar', 'above', 10, 'warning'),
        rule('sugar', 'above', 20, 'negative'),
      ];
      // values: 15 passes above-10 only, 25 passes both
      expect(getExtremeEmoji('sugar', [15, 25], 1, rules)).toBe('🚩');
      expect(getExtremeEmoji('sugar', [15, 25], 0, rules)).toBeNull();
    });
  });

  describe('real-world scenario: sugar above 5 good, above 10 bad with products 3, 7, 15', () => {
    const rules = [
      rule('sugar', 'above', 5, 'info'),
      rule('sugar', 'above', 10, 'negative'),
    ];
    const values = [3, 7, 15];

    it('returns null for sugar=3 (below both thresholds)', () => {
      expect(getExtremeEmoji('sugar', values, 0, rules)).toBeNull();
    });

    it('returns null for sugar=7 (info rating, not eligible for emoji)', () => {
      expect(getExtremeEmoji('sugar', values, 1, rules)).toBeNull();
    });

    it('returns flag for sugar=15 (highest above negative threshold)', () => {
      expect(getExtremeEmoji('sugar', values, 2, rules)).toBe('🚩');
    });
  });

  describe('rounding', () => {
    it('considers values equal when they round to the same 1 decimal place', () => {
      // 30.01 and 30.04 both round to 30.0 — should both get crown
      expect(getExtremeEmoji('protein', [30.01, 30.04], 0, defaultRules)).toBe(
        '👑',
      );
      expect(getExtremeEmoji('protein', [30.01, 30.04], 1, defaultRules)).toBe(
        '👑',
      );
    });
  });
});
