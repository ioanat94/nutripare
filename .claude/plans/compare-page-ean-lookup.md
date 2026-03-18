# Plan: Compare Page EAN Lookup

## Context

The Compare page (`/compare`) is currently an empty placeholder. This feature builds its foundation: a text input where users type one or more EAN barcodes (comma-separated), which are then looked up against the Open Food Facts staging API. The fetched nutritional data is logged to the console for now — UI display comes later.

## Files to Create / Modify

| File                     | Action  |
| ------------------------ | ------- |
| `types/openfoodfacts.ts` | Create  |
| `lib/openfoodfacts.ts`   | Create  |
| `app/compare/page.tsx`   | Rewrite |
| `tests/compare.test.tsx` | Create  |

---

## Step 1 — `types/openfoodfacts.ts`

Define three interfaces:

**`OFFNutriments`** — raw API fields, all `number | undefined`:

- `'energy-kcal_100g'`, `proteins_100g`, `carbohydrates_100g`, `sugars_100g`, `fat_100g`, `'saturated-fat_100g'`, `fiber_100g`, `salt_100g`
- Hyphenated keys need to be quoted string literals.

**`OFFProductResponse`** — API wrapper:

```ts
{ status: number; status_verbose: string; product?: { code: string; product_name: string; nutriments: OFFNutriments } }
```

**`ProductNutrition`** — mapped domain object that gets logged:

```ts
{
  (code,
    product_name,
    kcals,
    protein,
    carbohydrates,
    sugar,
    fat,
    saturated_fat,
    fiber,
    salt);
}
```

All nutritional values are `number | undefined`.

---

## Step 2 — `lib/openfoodfacts.ts`

Named exports only (no default export), following `lib/utils.ts` convention.

**`parseEanInput(raw: string): string[]`**

- Split by `,`, trim each, filter empties, deduplicate with `[...new Set(...)]`

**`mapProduct(raw: OFFProductResponse, code: string): ProductNutrition`**

- Map hyphenated nutriment keys → friendly names using bracket notation
- Missing fields → `undefined`

**`fetchProduct(code: string): Promise<ProductNutrition | null>`**

- Base URL: `https://world.openfoodfacts.net`
- Endpoint: `GET /api/v2/product/${code}?fields=code,product_name,nutriments`
- Headers: `Authorization: "Basic " + btoa("off:off")`,
- Returns `null` if `json.status === 0` (product not found) — not found is a normal outcome, not an error
- Returns `mapProduct(json, code)` on success
- Lets network errors throw — the page's per-code try/catch handles them

---

## Step 3 — `app/compare/page.tsx`

Must be `'use client'` (form state + fetch in browser).

**State:** `input: string`, `loading: boolean` (plain `useState`, no react-hook-form needed for a single field).

**Submit handler:**

```ts
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  const codes = parseEanInput(input);
  if (codes.length === 0) return;
  setLoading(true);
  for (const code of codes) {
    // sequential — respects 100 req/min rate limit
    try {
      const product = await fetchProduct(code);
      if (product === null) console.log(`Product not found: ${code}`);
      else console.log(product);
    } catch (err) {
      console.error(`Error fetching ${code}:`, err);
    }
  }
  setLoading(false);
}
```

**JSX structure:**

- `<Input>` from `components/ui/input.tsx` — pass `value`, `onChange`, `disabled={loading}`, `placeholder`, `aria-label`
- `<Button type="submit" disabled={loading}>` from `components/ui/button.tsx` — do NOT use `nativeButton={false}` (that's only for Link-rendered buttons)
- Spinner: `<Loader2 className="animate-spin" />` from `lucide-react` while loading
- Pressing Enter in the input submits the form naturally (no extra `onKeyDown` needed)

---

## Step 4 — `tests/compare.test.tsx`

Follow patterns from `tests/navbar.test.tsx`.

**Group 1: `parseEanInput` unit tests**

- Empty string → `[]`
- Only commas/spaces → `[]`
- Trims whitespace from codes
- Deduplicates repeated codes
- Single code, no comma
- Multiple codes with irregular spacing

**Group 2: `mapProduct` unit tests**

- Maps all 8 nutriment fields to correct renamed keys
- Missing nutriment → `undefined`
- Preserves `code` and `product_name`

**Group 3: `fetchProduct` with mocked `global.fetch`**

- Returns `null` when `status: 0`
- Returns `ProductNutrition` on success
- Rejects on network error

**Group 4: `ComparePage` component tests**

- Mock `@/lib/openfoodfacts` with `vi.mock`
- Renders input with placeholder and submit button
- Empty codes → `fetchProduct` never called
- Submitting calls `parseEanInput` with typed value
- `console.log` called with "not found" string when `fetchProduct` returns `null`
- `console.error` called when `fetchProduct` throws

---

## Verification

```bash
npm test -- --run tests/compare.test.tsx   # run new tests
npm run lint                               # confirm no TS/lint errors
npm run dev                                # manual smoke test at /compare
```

Manual test: open `/compare`, enter `3017624010701` (Nutella), click submit, check console for the 10 nutritional fields.
