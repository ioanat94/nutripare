# Spec for Computed Score

branch: claude/feature/computed-score

## Summary

Add a "Computed Score" row to the nutrition table that grades each product on a 0–100 scale based on the user's active nutrition rules. Nutrients with no rules are ignored. The score reflects both the rating direction (good/bad) and how far the actual value is from the threshold. The row is shown by default and its visibility is controlled in settings.

## Scoring Formula

For each rule that fires (i.e. the nutrient value crosses the threshold in the configured direction):

```
distance    = |actual − threshold|
normalized  = distance / max(threshold, 1)
magnitude   = ln(1 + normalized)
contribution = ratingWeight × magnitude
```

Rating weights: `positive` = +3, `info` = +1, `warning` = −1, `negative` = −3.

Multiple rules for the same nutrient stack additively (handles tiered thresholds like "above 10 good, above 20 great" gracefully without discontinuities).

Final score mapped to 0–100:

```
rawScore   = sum of all contributions
finalScore = round(50 × (1 + tanh(rawScore / 3)))
```

A product with no fired rules scores 50. The sensitivity constant `k = 3` can be adjusted based on real-world data.

## Functional Requirements

- Compute a score (0–100) per product using the formula above and the user's active rules (falling back to default rules when no settings are saved).
- Display the score as a new row at the bottom of the nutrition table, after all nutrient rows, labelled "Computed Score".
- The row label cell includes a small question mark icon (inline, after the label text). Hovering the icon shows a tooltip with a brief plain-language explanation, e.g. "Score from 0–100 based on your nutrition rules."
- The score row supports click-to-sort just like nutrient rows (clicking the label sorts products by score descending/ascending).
- "Computed Score" is treated as a first-class row entry: it has a key (e.g. `computed_score`), lives in `visibleNutrients` (controlling visibility) and `nutrientOrder` (controlling position), and is draggable/reorderable in Settings like any nutrient row.
- It is included by default (visible, appended last in `nutrientOrder`).
- If no rules are defined (empty rules array), the score row displays "—" for all products.
- The score can itself have rules (using the key `computed_score`), allowing the user to color-highlight score values — e.g. "score above 70 → great", "score below 30 → bad". These are authored in the same rules list in Settings → Nutrition as nutrient rules.
- `computed_score` is available as a nutrient option in the rule builder's nutrient dropdown alongside real nutrients.
- The `visibleNutrients` and `nutrientOrder` fields in `NutritionSettings` are renamed to `visibleRows` and `rowOrder` respectively to reflect that they now govern rows of any type, not just nutrients.
- The settings section label is updated to match (e.g. "Visible rows").

## Possible Edge Cases

- No rules defined: score row shows "—" for all products.
- All nutrients for a product are missing/NaN: no rules fire, score = 50 (neutral), displayed as "50".
- Threshold value of 0: `max(threshold, 1)` prevents division by zero.
- Single product (no comparison): score row still renders; sorting has no visible effect but should not error.
- Score tied between products: both can show the same value; no crown/flag emoji logic applies to the score row.
- `visibleRows`/`rowOrder` absent from a saved Firestore document (older data): fall back to the previous `visibleNutrients`/`nutrientOrder` values and append `computed_score` as visible and last.

## Acceptance Criteria

- The score row renders at its position in `rowOrder` (default: last).
- Scores are calculated correctly per the formula for products with varying rule hits.
- The question mark tooltip is accessible on hover (and ideally on focus for keyboard users).
- Clicking the score row label sorts products by score; the sort arrow behaves identically to nutrient rows.
- The "Computed Score" row appears in the drag-reorder list in Settings → Nutrition alongside nutrients and can be repositioned.
- Unchecking "Computed Score" in settings hides the row; checking restores it.
- The settings section label reads "Visible rows".
- Saving settings persists the updated `visibleRows`/`rowOrder` to Firestore and reloads correctly.
- If no rules fire for any product, all score cells show "—".

## Open Questions

- Should crown/flag emojis apply to the score row (highest/lowest scorer)? Yes, when a rule exists for it (so same as other nutrients)

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Score is 50 when no rules fire (no rules defined, or no thresholds crossed).
- A single negative rule firing below threshold returns a score below 50; further from threshold = lower score.
- A single positive rule firing above threshold returns a score above 50; further = higher.
- Tiered rules (above 10 info, above 20 positive) stack correctly and score increases monotonically as value increases through both thresholds.
- Opposing rules (above 10 info, above 30 negative) produce a peak and then decline correctly.
- Score is clamped to [0, 100] and rounded to a whole number.
- Missing/NaN nutrient value for a rule's nutrient: rule does not fire, does not throw.
