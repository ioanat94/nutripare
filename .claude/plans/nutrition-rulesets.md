# Plan: Nutrition Rulesets

## Context
Users currently have one global set of nutrition rules, used for cell coloring and score computation. This feature replaces that single ruleset with named, reorderable rulesets (e.g. "Dairy", "Bread"). Each ruleset has its own rules. Users manage rulesets in Settings → Nutrition. On the compare page, a ruleset selector in the `...` menu controls which ruleset drives the live computation.

---

## Step 1 — Add AlertDialog UI component

Run `npx shadcn@latest add alert-dialog` to add `components/ui/alert-dialog.tsx`. This is needed for delete confirmations in the settings tab.

---

## Step 2 — Update types (`types/firestore.ts`)

1. Add `NutritionRuleset` interface:
   ```
   { id: string; name: string; rules: NutritionRule[] }
   ```
2. Replace `rules: NutritionRule[]` in `NutritionSettings` with `rulesets: NutritionRuleset[]`. Remove the old `rules` field.
3. Add `rulesetId?: string` to `SavedComparison`.

---

## Step 3 — Update Firestore helpers (`lib/firestore.ts`)

### `getNutritionSettings`
- After reading the doc, if `rulesets` is absent (old format), synthesize it:
  - If `rules` field exists → create one `NutritionRuleset` with `id: 'default'`, `name: 'Default'`, using those rules.
  - If no doc / no rules → create one `NutritionRuleset` with `id: 'default'`, `name: 'Default'`, `rules: getDefaultRules()`.
- Return `rulesets` in the result (always a non-empty array unless user deleted all rulesets).
- Remove the old `rules` field from the returned `NutritionSettings`.

### `saveNutritionSettings`
- No signature change needed — it uses `setDoc`, so it will persist `rulesets` automatically once the type is updated.
- Drop writing the old `rules` field (it will be absent from the object).

### `isComparisonSaved` → replace with `findSavedComparison`
- New function: `findSavedComparison(uid, eans): Promise<{ id: string; rulesetId?: string } | null>`
- Scans comparisons collection, matches by sorted EANs (same logic as current `isComparisonSaved`).
- Returns `null` if not found, or `{ id, rulesetId }` if found.
- Keep `isComparisonSaved` as a thin wrapper for now (to avoid touching other callers), or update all callers.

### `saveComparison`
- Change return type from `Promise<void>` to `Promise<string>` (return the new doc's `id`).

### New: `updateComparisonRuleset(uid, comparisonId, rulesetId)`
- `updateDoc(ref, { rulesetId })` on `users/{uid}/comparisons/{comparisonId}`.

---

## Step 4 — Refactor `components/settings/nutrition-tab.tsx`

### View state
Add `view: 'list' | 'detail'` state.

### List view (default)
Keeps the existing **Visible rows** and **Highlights** sections unchanged.

Replaces the **Rules** section with a **Rulesets** section:
- DnD-sortable list (reuse `@dnd-kit`) — each row: drag handle, truncated name, View button (Eye icon), Delete button.
- Delete button opens an `AlertDialog` asking for confirmation before removing the ruleset from state.
- "Add ruleset" button at the bottom: creates `{ id: crypto.randomUUID(), name: 'New Ruleset', rules: [] }`, appends to `rulesets` state, marks it as `isNewRuleset`, and switches to detail view.
- The existing **Save** button at the bottom saves the outer settings (visibleRows, showCrown, showFlag, rowOrder, rulesets array with order/names but each ruleset's rules are whatever was last saved in detail view).

### Detail view
Replaces the entire tab pane content.
- Editable name field at the top (inline `<input>` styled like a heading).
- The existing rules editor (reuse `SortableRuleRow`, `addRule`, `removeRule`, `updateRule`, `handleRuleDragEnd` logic), driven by `editingRules: DraftRule[]` state.
- "Reset to defaults" button (same as current).
- Bottom action row: **Save**, **Cancel**, **Delete** buttons.
  - **Save**: validate rules → merge edited name/rules into the `rulesets` array → call `saveNutritionSettings` → return to list view.
  - **Cancel**: if `isNewRuleset`, remove the temp ruleset from state. Return to list view.
  - **Delete**: open `AlertDialog` for confirmation → remove ruleset from state → call `saveNutritionSettings` → return to list view.

### State additions
```
view: 'list' | 'detail'
rulesets: NutritionRuleset[]           // replaces flat rules[]
editingId: string | null
editingName: string
editingRules: DraftRule[]
isNewRuleset: boolean
```
Remove the top-level `rules: DraftRule[]` state (now lives only inside detail editing state).

### `buildDefault` and `settingsEqual`
- `buildDefault` now returns `rulesets: [{ id: 'default', name: 'Default', rules: getDefaultRules() }]` instead of `rules`.
- `settingsEqual` compares `rulesets` instead of `rules`.

---

## Step 5 — Update `components/nutrition-table.tsx`

### New props
```ts
rulesets?: NutritionRuleset[]
selectedRulesetId?: string | null
onRulesetChange?: (id: string) => void
```

### Active rules resolution
```ts
const activeRuleset = rulesets?.find(rs => rs.id === selectedRulesetId) ?? null;
const rules = activeRuleset?.rules ?? settings?.rules ?? defaultRules;
```
(The `settings?.rules` fallback handles the transition period; once all users have rulesets, it's always `activeRuleset?.rules`.)

### Ruleset selector in `...` menu
Add a `DropdownMenuSub` before the separator:
```
Ruleset ▶
  ├── [ruleset name, checkmark if active]
  ├── ...
  └── (No rulesets — disabled) if empty
```
Use `DropdownMenuSub` / `DropdownMenuSubTrigger` / `DropdownMenuSubContent` from the existing `dropdown-menu` component. Show the active ruleset name in the sub-trigger label. Selecting a different item calls `onRulesetChange(id)`.

### Score row fallback
When `rules` is empty and `activeRuleset` exists (user selected a ruleset with no rules), `computeScore` returns `null` → score cell already renders `—`. No extra handling needed.

---

## Step 6 — Update `app/compare/page.tsx`

### State changes
Replace `comparisonSaved: boolean` with `savedComparisonId: string | null`.
Add `selectedRulesetId: string | null` (default: first ruleset ID from settings, or null).

### On settings load
After `getNutritionSettings` resolves, seed `selectedRulesetId` with `settings.rulesets[0]?.id ?? null`.

### On products change
Replace `isComparisonSaved(uid, codes)` call with `findSavedComparison(uid, codes)`:
- If result is non-null: set `savedComparisonId = result.id` and, if `result.rulesetId` is set, `selectedRulesetId = result.rulesetId`.
- If null: `savedComparisonId = null`.

### `handleSaveComparison`
- `saveComparison` now returns a `string` (doc ID). Store it: `setSavedComparisonId(id)`.
- Also call `updateComparisonRuleset(uid, id, selectedRulesetId)` if `selectedRulesetId` is set.

### `handleRulesetChange(id: string)`
- `setSelectedRulesetId(id)`
- If `savedComparisonId` is set: call `updateComparisonRuleset(user.id, savedComparisonId, id)` (fire-and-forget, no toast needed).

### Pass new props to `NutritionTable`
```tsx
rulesets={nutritionSettings?.rulesets}
selectedRulesetId={selectedRulesetId}
onRulesetChange={user ? handleRulesetChange : undefined}
```

---

## Step 7 — Tests (`tests/nutrition-rulesets.test.tsx`)

- Rendering the rulesets list shows name, view, and delete buttons for each ruleset.
- Clicking Delete opens the confirmation dialog without removing the ruleset.
- Confirming deletion removes the ruleset from the list.
- Clicking View switches to detail view with the correct ruleset name and rules pre-filled.
- Saving in detail view calls `saveNutritionSettings` with the updated ruleset.
- Cancelling in detail view returns to list view without changes.
- "Add ruleset" creates a new entry named "New Ruleset" and opens detail view.
- NutritionTable: switching ruleset triggers `onRulesetChange` callback.
- NutritionTable: score row shows `—` when active ruleset has no rules.

---

## Verification

1. Run `npm test -- --run` to confirm all tests pass.
2. Run `npm run lint` to confirm no lint errors.
3. Manual: Settings → Nutrition — verify rulesets list, add/rename/delete flow, drag-to-reorder.
4. Manual: Compare page — verify ruleset selector in `...` menu updates score row instantly; reload page and confirm the selected ruleset is restored for a saved comparison.
