# Plan: Nutrition Reorder

## Context

Users want to control the order in which nutrients appear in the nutrition table, and to organise their threshold rules. This builds on the existing nutrition settings feature (PR #11). dnd-kit is not yet installed; shadcn has no built-in drag-and-drop primitive.

## Architecture Decisions

**Nutrient order storage:** Add a new optional `nutrientOrder?: string[]` field to `NutritionSettings` (all 8 nutrient keys in display order). This keeps `visibleNutrients` semantics unchanged (which keys are checked) and avoids having to encode hidden nutrients into an ordered array. Backwards-compatible: old Firestore documents without `nutrientOrder` fall back to the hardcoded `ROWS` order.

**Rule IDs for dnd-kit:** dnd-kit sortable items require stable string IDs. Add an in-memory-only `id` field to `DraftRule` (not persisted to Firestore). Generated on load and on `addRule`.

## Steps

### 1. Install dnd-kit

```
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Packages needed: `@dnd-kit/core` (DndContext, sensors, collision detection), `@dnd-kit/sortable` (SortableContext, useSortable, arrayMove), `@dnd-kit/utilities` (CSS.Transform.toString).

---

### 2. Update `types/firestore.ts`

Add `nutrientOrder` to `NutritionSettings`:

```typescript
export interface NutritionSettings {
  visibleNutrients: string[];
  showCrown: boolean;
  showFlag: boolean;
  rules: NutritionRule[];
  nutrientOrder?: string[]; // all 8 keys in display order; optional for backwards compat
}
```

---

### 3. Update `components/nutrition-table.tsx`

**Current (line 324):**
```tsx
ROWS.filter((row) => visibleNutrients.includes(row.key)).map((row, i) => { ... })
```

**New:** Derive `displayRows` before the JSX return:
```tsx
const allKeysOrdered = settings?.nutrientOrder ?? ROWS.map((r) => r.key);
const displayRows = allKeysOrdered
  .filter((key) => visibleNutrients.includes(key))
  .map((key) => ROWS.find((r) => r.key === key)!)
  .filter(Boolean);
```

Then use `displayRows.map((row, i) => { ... })` instead of the current filtered `ROWS.map`. The `i` index for alternating row backgrounds still works correctly.

---

### 4. Update `components/settings/nutrition-tab.tsx`

**A. Update `DraftRule` type to include in-memory `id`:**
```typescript
type DraftRule = Omit<NutritionRule, 'value'> & { value: number | undefined; id: string };
```

**B. Add `nutrientOrder` state:**
```typescript
const [nutrientOrder, setNutrientOrder] = useState<string[]>(ROWS.map((r) => r.key));
```

**C. Update `buildDefault()` to include `nutrientOrder`:**
```typescript
function buildDefault(): NutritionSettings {
  return {
    visibleNutrients: ROWS.map((r) => r.key),
    showCrown: true,
    showFlag: true,
    rules: getDefaultRules(),
    nutrientOrder: ROWS.map((r) => r.key),
  };
}
```

**D. Update `useEffect` load handler:**
- Set `nutrientOrder` from `s.nutrientOrder ?? ROWS.map(r => r.key)`
- Map loaded rules to include generated `id`: `s.rules.map((r, i) => ({ ...r, id: \`rule-${i}\` }))`

**E. Update `current` object:**
```typescript
const current: NutritionSettings = {
  visibleNutrients,
  showCrown,
  showFlag,
  rules: rules.map(({ id: _, ...r }) => ({ ...r, value: r.value! })),
  nutrientOrder,
};
```

**F. Update `addRule` to assign an `id`:**
```typescript
{ nutrient: ROWS[0].key, direction: 'above', value: undefined, rating: 'positive', id: crypto.randomUUID() }
```

**G. Replace the visible nutrients section (currently lines 192–210):**

- Remove the `grid-cols-2` grid, use a single-column `space-y-1` list
- Wrap with `DndContext` (PointerSensor + KeyboardSensor) and `SortableContext` (items=`nutrientOrder`, strategy=`verticalListSortingStrategy`)
- Each row is a sortable item keyed by nutrient key using `useSortable({ id: row.key })`
- Layout per row: `[drag handle] [checkbox] [label]`
- Drag handle: `<GripVertical>` icon, cursor `grab`/`grabbing`, bound to `{...attributes} {...listeners}` from `useSortable`
- `onDragEnd`: use `arrayMove` to update `nutrientOrder`

**H. Replace the rules list (currently lines 248–384):**

- Wrap with `DndContext` and `SortableContext` (items=`rules.map(r => r.id)`)
- Each rule row uses `useSortable({ id: rule.id })`
- Add a `<GripVertical>` drag handle to the left of each rule row (before the nutrient Select)
- `onDragEnd`: use `arrayMove` to update `rules`
- All existing rule fields (Select, input, trash button) and validation errors remain unchanged

**I. Import additions:**
```typescript
import { GripVertical } from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
```

---

### 5. Write tests: `tests/nutrition-reorder.test.tsx`

Mock `@dnd-kit/core` and `@dnd-kit/sortable` (render children without DnD behaviour). Follow the same pattern as `tests/nutrition-tab.test.tsx` (mock Firestore, async `renderTab`, `waitFor`).

Tests to cover (per spec):
- Visible nutrients renders as a single-column list (no `grid-cols-2` class)
- Each nutrient row has a drag handle element (GripVertical or `data-testid`)
- Each rule row has a drag handle element
- Nutrient list renders in the order from saved settings (not hardcoded ROWS order)
- Rule list renders in the order from saved settings
- After simulated reorder (mutating state), Save button becomes enabled
- On save after nutrient reorder, Firestore receives `nutrientOrder` in new order
- On save after rule reorder, Firestore receives `rules` in new order
- Nutrition table renders rows in the order specified by `nutrientOrder` (with fallback to ROWS order for null settings)

## Files to Modify

| File | Change |
|------|--------|
| `types/firestore.ts` | Add `nutrientOrder?: string[]` to `NutritionSettings` |
| `components/nutrition-table.tsx` | Use `nutrientOrder` to derive display row order |
| `components/settings/nutrition-tab.tsx` | Full DnD integration for nutrients and rules |

## New Files

| File | Purpose |
|------|---------|
| `tests/nutrition-reorder.test.tsx` | Tests for reorder functionality |

## Verification

1. `npm install` completes cleanly with dnd-kit packages
2. `npm run build` passes with no TypeScript errors
3. `npm test -- --run tests/nutrition-reorder.test.tsx` all tests pass
4. `npm test -- --run` full test suite still passes (no regressions)
5. Manual: open Settings → Nutrition, drag nutrients to reorder, save, check compare page table reflects new order
6. Manual: drag rules to reorder, save, reload settings — order persists
7. Manual: old Firestore documents (no `nutrientOrder`) render in default ROWS order without errors
