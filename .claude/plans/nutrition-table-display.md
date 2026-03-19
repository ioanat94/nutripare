# Plan: nutrition-table-display

## Context

The compare page currently fetches product data and discards it (logs to console). This feature wires the fetched `ProductNutrition` objects into component state and renders them as a comparison table with threshold-based color coding.

---

## Files to Modify

- `app/compare/page.tsx` — add state, update fetch logic, render table + error alert
- `utils/thresholds.ts` — add `getThresholdColor` helper
- `tests/compare.test.tsx` — update 2 tests whose behavior changes (console.log → UI state)

## Files to Create

- `components/nutrition-table.tsx` — new table component
- `tests/nutrition-table.test.tsx` — tests for the table component

---

## Implementation Steps

### 1. Add `getThresholdColor` to `utils/thresholds.ts`

```ts
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
```

### 2. Update `app/compare/page.tsx`

Add state:

```ts
const [products, setProducts] = useState<ProductNutrition[]>([]);
const [notFoundCodes, setNotFoundCodes] = useState<string[]>([]);
```

Update `handleSubmit`:

- Replace `console.log`/`console.error` with state updates
- On `null` result: collect code into `notFoundCodes` (replace previous not-found list per submit)
- On success: `setProducts(prev => replaceOrAppend(prev, product))` — replace if same `code`, otherwise append
- On thrown error: collect code into `notFoundCodes` (treat as not found for user-facing message)

Add handlers:

```ts
function handleDismiss(code: string) {
  setProducts((prev) => prev.filter((p) => p.code !== code));
}
function handleClearAll() {
  setProducts([]);
}
```

Render below the form:

```tsx
{
  notFoundCodes.length > 0 && (
    <div role='alert' className='...warning styles...'>
      Could not find product(s) with code(s): {notFoundCodes.join(', ')}
    </div>
  );
}
{
  products.length > 0 && (
    <NutritionTable
      products={products}
      onDismiss={handleDismiss}
      onClearAll={handleClearAll}
    />
  );
}
```

### 3. Create `components/nutrition-table.tsx`

**Props:**

```ts
interface NutritionTableProps {
  products: ProductNutrition[];
  onDismiss: (code: string) => void;
  onClearAll: () => void;
}
```

**Nutrient row definitions** (fixed order):

```ts
const ROWS = [
  { label: 'Calories (kcal)', key: 'kcals' },
  { label: 'Protein (g)', key: 'protein' },
  { label: 'Carbohydrates (g)', key: 'carbohydrates' },
  { label: 'Sugar (g)', key: 'sugar' },
  { label: 'Fat (g)', key: 'fat' },
  { label: 'Saturated Fat (g)', key: 'saturated_fat' },
  { label: 'Fiber (g)', key: 'fiber' },
  { label: 'Salt (g)', key: 'salt' },
] as const;
```

**Color class mapping:**

```ts
const COLOR_CLASS: Record<ThresholdColor, string> = {
  positive: 'text-positive',
  warning: 'text-warning',
  negative: 'text-destructive',
};
```

**Component installation:** run `npx shadcn@latest add table` before implementing. shadcn Table provides `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` — all thin wrappers around semantic HTML with an `overflow-x-auto` wrapper div built in.

**Table layout:**

- Use shadcn `Table` (includes `overflow-x-auto` wrapper)
- First column `TableHead` / `TableCell` (`scope="row"`): add `sticky left-0 bg-card` so it doesn't bleed when scrolling
- Product column `TableHead` (`scope="col"`): product name (truncated with `truncate max-w-[160px]`), EAN code in a smaller line below, dismiss `×` button
- "Clear all" button rendered above the table
- Each `TableCell`: value formatted to 1 decimal, or "—" if undefined/NaN; text colored via `getThresholdColor`

**Cell rendering:**

```ts
function renderCell(nutrient: string, value: number | undefined) {
  if (value === undefined || isNaN(value)) return { text: '—', className: '' };
  const color = getThresholdColor(nutrient, value);
  return {
    text: value.toFixed(1),
    className: color ? COLOR_CLASS[color] : '',
  };
}
```

### 4. Update `tests/compare.test.tsx`

- Remove/replace the test `'logs "not found" when fetchProduct returns null'`
  → New assertion: warning alert appears with the not-found code
- The test `'calls console.error when fetchProduct throws'` can remain or be rephrased if errors are now shown in the alert too (per spec: "treat as not found")

### 5. Create `tests/nutrition-table.test.tsx`

Test cases per spec:

1. Renders nothing when `products` is empty (renders null / no table)
2. Renders table with one value column when one `ProductNutrition` provided
3. Renders two columns when two products provided
4. A nutrient value above its `negative` threshold gets `text-destructive`
5. A nutrient value below its `positive` threshold gets `text-positive`
6. A nutrient with no threshold entry (e.g. `kcals`) gets no color class
7. An undefined nutrient value renders "—" with no color class
8. Clicking dismiss on a column removes it
9. Dismissing the last column fires `onDismiss`; when `products` prop becomes empty the table is gone

> Tests will render `NutritionTable` in isolation with mock `onDismiss`/`onClearAll` props (no page-level state needed).

---

## Key Reuse

- `getThresholdColor` from `utils/thresholds.ts` (new, but kept in existing file)
- `ProductNutrition` type from `types/openfoodfacts.ts`
- `ThresholdColor` type from `utils/thresholds.ts`
- shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` from `components/ui/table.tsx` (install first: `npx shadcn@latest add table`)
- Existing `vi.mock` + `@testing-library/react` patterns from `tests/compare.test.tsx`

---

## Verification

1. `npm run dev` → navigate to `/compare`, enter a valid EAN, submit → table appears with 8 rows and 1 column
2. Enter a second EAN → second column appended, no layout shift
3. Enter an invalid EAN → warning alert appears above table
4. Dismiss a column → column removed; dismiss last → table hidden
5. "Clear all" → table hidden
6. Color spot-check: a high-sugar product → sugar row should show red text
7. `npm test -- --run tests/nutrition-table.test.tsx` → all 9 tests pass
8. `npm test -- --run tests/compare.test.tsx` → all tests pass
9. `npm run lint` → no errors
