# Plan: Computed Score

## Context

Users want a per-product score (0–100) derived from their nutrition rules, displayed as a row in the nutrition table. The score rewards nutrients that hit good/positive thresholds and penalises ones that hit bad/negative ones, weighted by how far the value is from the threshold. It should behave exactly like a nutrient row: reorderable, togglable in settings, and supports user-defined rules for color-highlighting score values.

---

## Files to modify

| File                                    | Change                                                                  |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `types/firestore.ts`                    | Rename `visibleNutrients` → `visibleRows`, `nutrientOrder` → `rowOrder` |
| `utils/thresholds.ts`                   | Rename `visibleNutrients` param in `getExtremeEmoji`                    |
| `lib/firestore.ts`                      | Migration logic when reading old documents                              |
| `components/nutrition-table.tsx`        | Add `SCORE_ROW`, score rendering, tooltip, sorting fix                  |
| `components/settings/nutrition-tab.tsx` | Add score to defaults, rule builder, section label rename               |

## New file

| File             | Purpose                                                                        |
| ---------------- | ------------------------------------------------------------------------------ |
| `utils/score.ts` | `computeScore(product, rules): number \| null` + `COMPUTED_SCORE_KEY` constant |

---

## Step-by-step

### 1. `utils/score.ts` (new)

Export `COMPUTED_SCORE_KEY = 'computed_score'`.

Export `computeScore(product: ProductNutrition, rules: NutritionRule[]): number | null`:

- Filter out `computed_score` rules (they apply _to_ the score, not used to compute it).
- If the filtered rules array is empty → return `null` (renders as "—").
- For each remaining rule, check if it fires against `product[rule.nutrient]`:
  - `above`: fires if `value > rule.value`
  - `below`: fires if `value < rule.value`
- For each fired rule:
  ```
  distance    = |value − rule.value|
  normalized  = distance / Math.max(rule.value, 1)
  magnitude   = Math.log(1 + normalized)
  contribution = weight × magnitude
  ```
  Weights: `positive` = +3, `info` = +1, `warning` = −1, `negative` = −3.
- `rawScore = sum of contributions`
- `finalScore = Math.round(50 × (1 + Math.tanh(rawScore / 3)))`
- Clamp to [0, 100] and return.

### 2. `types/firestore.ts`

- Rename `visibleNutrients: string[]` → `visibleRows: string[]`
- Rename `nutrientOrder?: string[]` → `rowOrder?: string[]`

### 3. `utils/thresholds.ts`

- Rename the `visibleNutrients` parameter in `getExtremeEmoji` to `visibleRows` (cosmetic only — no logic change).

### 4. `lib/firestore.ts`

In `getNutritionSettings`, after reading the Firestore doc, apply migration before returning:

```
const raw = snap.data();
const visibleRows = raw.visibleRows ?? raw.visibleNutrients ?? <all ROWS keys>;
const rowOrder   = raw.rowOrder   ?? raw.nutrientOrder  ?? <all ROWS keys>;
// append computed_score if missing
if (!visibleRows.includes('computed_score')) visibleRows.push('computed_score');
if (!rowOrder.includes('computed_score'))    rowOrder.push('computed_score');
```

Return the migrated `NutritionSettings` shape. The old field names don't need to be deleted from Firestore — they're simply ignored on next read once the user saves.

Note: `lib/firestore.ts` cannot import from `components/`, so hard-code the default ROWS keys (`['kcals', 'protein', 'carbohydrates', 'sugar', 'fat', 'saturated_fat', 'fiber', 'salt']`) directly in the fallback, or import from a shared constant.

### 5. `components/nutrition-table.tsx`

**Constants:**

- Export `SCORE_ROW = { label: 'Computed Score', key: 'computed_score' as const }`.

**Score pre-computation:**

- Compute scores once per render with `useMemo`:
  ```ts
  const scores = new Map(products.map((p) => [p.code, computeScore(p, rules)]));
  ```

**`visibleNutrients` → `visibleRows` / `nutrientOrder` → `rowOrder` rename** throughout.

**`displayRows` construction** — extend the existing logic to resolve `'computed_score'` to `SCORE_ROW`:

```ts
const allKeysOrdered = settings?.rowOrder ?? [
  ...ROWS.map((r) => r.key),
  'computed_score',
];
const displayRows = allKeysOrdered
  .filter((key) => visibleRows.includes(key))
  .map((key) =>
    key === 'computed_score' ? SCORE_ROW : ROWS.find((r) => r.key === key),
  )
  .filter(Boolean);
```

**Sorting fix** — when `sort.key === 'computed_score'`, use `scores.get(code)` instead of `p[key]`.

**Row rendering** — for each row, when `row.key === 'computed_score'`:

- Get value from `scores.get(p.code)` (may be `null`).
- Apply `getThresholdColor('computed_score', value ?? undefined, rules)` for color.
- Apply `getExtremeEmoji('computed_score', allScoreValues, j, rules, visibleRows)` for emoji — compute `allScoreValues` from the scores map.
- Render `null` score as `'—'` with muted color.

**Row label** — when `row.key === 'computed_score'`, append a `<HelpCircle>` icon (size-3, inline) after the label text. Wrap it in a shadcn `<Tooltip>` with content: `"Score from 0–100 based on your nutrition rules."`. The click-to-sort button wraps the label text only; the tooltip icon sits outside it (so clicking the icon doesn't trigger sort).

Import `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` from `@/components/ui/tooltip` and `HelpCircle` from `lucide-react`.

### 6. `components/settings/nutrition-tab.tsx`

**`buildDefault()`** — append `'computed_score'` to both `visibleRows` and `rowOrder`.

**State variable renames:** `visibleNutrients` → `visibleRows`, `nutrientOrder` → `rowOrder`.

**Draggable list** — the existing `SortableNutrientRow` and the list already maps over `rowOrder`. Import `SCORE_ROW` from `@/components/nutrition-table` and resolve the `computed_score` key to its label (`SCORE_ROW.label`) when rendering the row label in the list. No other special casing needed — it participates in drag-and-drop exactly like nutrients.

**Section heading** — rename `"Visible nutrients"` → `"Visible rows"`.

**Rule builder nutrient dropdown** — the `<SelectItem>` list currently maps over `ROWS`. Add `SCORE_ROW` as an additional option so users can author rules like "computed_score above 70 → positive".

---

## Backward compatibility

Old Firestore documents with `visibleNutrients`/`nutrientOrder` are migrated on read in `getNutritionSettings`. No data is deleted — migration completes silently on next save.

---

## Verification

1. Run `npm test -- --run` — all existing tests must pass (field renames propagated).
2. New `tests/score.test.ts` tests cover the formula cases from the spec.
3. Manually: open the compare page with products → Computed Score row appears last, shows 0–100 values, sorts correctly on click, tooltip shows on hover of `?` icon.
4. Settings → Nutrition: "Computed Score" checkbox visible in "Visible rows" section, draggable, rules can reference `computed_score` as a nutrient.
5. Uncheck Computed Score → row disappears from table. Re-check → returns.
6. Add a rule "computed_score above 70 → positive" → high-scoring products highlight green.
