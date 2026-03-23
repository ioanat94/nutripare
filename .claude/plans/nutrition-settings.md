# Plan: Nutrition Settings

## Context

The Nutrition tab in Settings is currently a stub (`"Nutrition preferences coming soon."`). This plan implements the full feature: show/hide nutrients, crown/flag toggles, and customisable threshold rules. User settings are persisted to Firestore and consumed by the nutrition table on the compare page.

---

## Step 1 — Install shadcn components

```bash
npx shadcn@latest add switch checkbox select
```

Creates `components/ui/switch.tsx`, `components/ui/checkbox.tsx`, `components/ui/select.tsx`. Must exist before Step 7.

---

## Step 2 — Extend `types/firestore.ts`

Add alongside existing interfaces (no existing types change):

```typescript
export type ThresholdColor = 'positive' | 'info' | 'warning' | 'negative';
// extends the existing type in utils/thresholds.ts — keep in sync

export interface NutritionRule {
  nutrient: string;            // e.g. 'protein'
  direction: 'above' | 'below';
  value: number;               // 0–99.9
  rating: ThresholdColor;      // 'positive'=Great, 'info'=Good, 'warning'=Concerning, 'negative'=Bad
}

export interface NutritionSettings {
  visibleNutrients: string[];  // subset of ROWS keys; all 8 = default
  showCrown: boolean;
  showFlag: boolean;
  rules: NutritionRule[];
}
```

Note: `ThresholdColor` is the canonical type for both coloring and rule ratings. It is currently defined in `utils/thresholds.ts` — that definition is also updated in Step 3 to add `'info'`.

---

## Step 3 — Update `utils/thresholds.ts`

Three changes:

**a) Extend `ThresholdColor`** — add `'info'`:
```typescript
export type ThresholdColor = 'positive' | 'info' | 'warning' | 'negative';
```

**b) Add `getDefaultRules(): NutritionRule[]`** — converts the static `THRESHOLDS` constant to the flat array format. Used by the nutrition tab (Reset button) and Firestore helpers (fallback defaults). `ThresholdCondition.color` maps directly to `NutritionRule.rating`; `ThresholdCondition.when` maps to `direction`.

**c) Refactor `getThresholdColor` and `getExtremeEmoji`** to accept rules as a parameter instead of reading `THRESHOLDS` from module scope:

```typescript
getThresholdColor(nutrient: string, value: number | undefined, rules: NutritionRule[]): ThresholdColor | null

getExtremeEmoji(
  nutrient: string,
  values: (number | undefined)[],
  index: number,
  rules: NutritionRule[],
  visibleNutrients: string[],    // hidden nutrients return null (excluded from pool)
): '👑' | '🚩' | null
```

Crown is only awarded for `rating === 'positive'` extremes; flag only for `rating === 'negative'` extremes. `'info'` and `'warning'` rules produce colour but never emoji.

---

## Step 4 — Add Firestore helpers to `lib/firestore.ts`

Following the existing pattern (single `getDoc`/`setDoc`, no real-time listeners):

```typescript
// Read: returns null if document does not exist
getNutritionSettings(uid: string): Promise<NutritionSettings | null>
  → getDoc(doc(db, 'users', uid, 'settings', 'nutrition'))

// Write: upsert
saveNutritionSettings(uid: string, settings: NutritionSettings): Promise<void>
  → setDoc(doc(db, 'users', uid, 'settings', 'nutrition'), settings)
```

When reading, defensively filter rules whose `rating` is not in `['positive', 'info', 'warning', 'negative']` (forward-compat guard).

---

## Step 5 — Update `components/nutrition-table.tsx`

Four targeted changes:

**a) Export `ROWS`** — add `export` keyword so `NutritionTab` can import the same ordered list for checkboxes and rule dropdowns.

**b) Add `settings?: NutritionSettings` prop.** When absent, all rows shown, both emojis on, default rules used.

**c) Extend `COLOR_CLASS`** — add `info: 'text-info'`.

**d) Update `renderCell`** — accept and forward `rules: NutritionRule[]` to `getThresholdColor`.

**e) Update `getExtremeEmoji` call sites** — pass `rules` and `visibleNutrients`. Suppress `'👑'` if `settings.showCrown === false`; suppress `'🚩'` if `settings.showFlag === false`. Filter rendered `ROWS` by `settings.visibleNutrients`.

Default effective values when `settings` is undefined:
```typescript
const visibleNutrients = settings?.visibleNutrients ?? ROWS.map(r => r.key);
const rules = settings?.rules ?? getDefaultRules();
const showCrown = settings?.showCrown ?? true;
const showFlag = settings?.showFlag ?? true;
```

---

## Step 6 — Update `app/compare/page.tsx`

Add nutrition settings loading on mount, keyed on `user?.id`:

```typescript
const [nutritionSettings, setNutritionSettings] = useState<NutritionSettings | null>(null);

useEffect(() => {
  if (!user) return;
  getNutritionSettings(user.id).then(setNutritionSettings);
}, [user?.id]);
```

Pass to `<NutritionTable settings={nutritionSettings ?? undefined} ... />`.

---

## Step 7 — Implement `components/settings/nutrition-tab.tsx`

Add `userId: string` prop. Replace stub with full implementation.

**State:**
- `loading`, `saving`
- `saved: NutritionSettings | null` (last persisted — used for dirty-check)
- `visibleNutrients`, `showCrown`, `showFlag`, `rules` (working copies)

**On mount:** call `getNutritionSettings(userId)`. If null, seed from `getDefaultRules()` + all nutrients visible + both toggles on.

**Derived (no `useState`):**
- `isDirty` — deep-compare working state vs `saved`
- `validationErrors: Record<number, string>` — duplicate `nutrient+rating` pairs get message `"A rule for <Nutrient> / <Rating> already exists"`
- `saveDisabled = !isDirty || hasErrors || saving || allNutrientsHidden`
- `resetDisabled` — working rules deep-equal `getDefaultRules()`

**Layout (three sections + save):**

```
## Visible nutrients
  2-col checkbox grid (sm: responsive to 1-col)
  One <Checkbox> per ROWS entry

## Highlights
  <Switch> "Show crown" + description
  <Switch> "Show flag" + description

## Rules
  [rule rows — each: Nutrient Select | Direction Select | Number Input | Rating Select | Trash btn]
  [inline error below duplicate rows]
  [Add rule btn]  [Reset to defaults btn]

[Save btn — full width or right-aligned]
```

Rating Select options: each rendered with a small coloured dot (inline `bg-positive`, `bg-info`, `bg-warning`, `bg-destructive` span) + label.

Loading state: skeleton placeholder (3–4 pulse lines) instead of form.

**Save handler:** calls `saveNutritionSettings`, updates `saved`, shows toast.

---

## Step 8 — Update `app/settings/page.tsx`

One-line change:
```tsx
// before
{activeTab === 'nutrition' && <NutritionTab />}
// after
{activeTab === 'nutrition' && <NutritionTab userId={user.id} />}
```

---

## Step 9 — Tests

**New: `tests/nutrition-tab.test.tsx`**

Mocks: `@/contexts/auth-context`, `@/lib/firestore` (extend existing mock factory), `sonner`, `@/lib/firebase`.

Cases from spec:
1. Renders three sections
2. All 8 checkboxes checked by default (when Firestore returns null)
3. Unchecking a nutrient enables Save
4. Both toggles enabled by default
5. Toggling either switch enables Save
6. Save disabled with no changes
7. Save enabled after any change
8. "Add rule" appends a blank row
9. Removing a rule removes it from the list
10. Rating dropdown renders all 4 options
11. Duplicate nutrient+rating shows inline error and disables Save
12. `saveNutritionSettings` called with correct payload on Save
13. Previously saved settings restored on load

**Updates: `tests/nutrition-table.test.tsx`**

Add three cases (all other tests pass `settings` as `undefined` and remain unchanged):
- Hidden nutrient row absent when not in `visibleNutrients`
- Crown suppressed when `showCrown: false`
- Flag suppressed when `showFlag: false`

**Updates: `tests/settings.test.tsx`**

Extend the `@/lib/firestore` mock to include `getNutritionSettings: vi.fn().mockResolvedValue(null)` so the Nutrition tab renders without errors.

---

## Verification

1. `npm test -- --run` — all tests pass
2. `npm run lint` — no errors
3. `npm run build` — clean build (TypeScript strict — `COLOR_CLASS` missing `'info'` key caught at compile time if Step 5c is missed)
4. Manual: open Settings → Nutrition tab, verify three sections load with defaults, edit and save, reload and confirm settings persisted
5. Manual: open Compare page with 2+ products, toggle a nutrient off in settings, save, reload compare — row hidden

---

## Files Changed

| File | Change |
|------|--------|
| `types/firestore.ts` | Add `NutritionRule`, `NutritionSettings` |
| `utils/thresholds.ts` | Add `'info'` to `ThresholdColor`, add `getDefaultRules()`, refactor `getThresholdColor` / `getExtremeEmoji` signatures |
| `lib/firestore.ts` | Add `getNutritionSettings`, `saveNutritionSettings` |
| `components/nutrition-table.tsx` | Export `ROWS`, add `settings` prop, update `COLOR_CLASS`, `renderCell`, `getExtremeEmoji` calls |
| `components/settings/nutrition-tab.tsx` | Full implementation (replaces stub) |
| `app/compare/page.tsx` | Load and pass `nutritionSettings` |
| `app/settings/page.tsx` | Pass `userId` to `NutritionTab` |
| `tests/nutrition-tab.test.tsx` | New test file |
| `tests/nutrition-table.test.tsx` | 3 new test cases |
| `tests/settings.test.tsx` | Extend Firestore mock |
| `components/ui/switch.tsx` | New (shadcn add) |
| `components/ui/checkbox.tsx` | New (shadcn add) |
| `components/ui/select.tsx` | New (shadcn add) |
