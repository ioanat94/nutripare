# Spec for nutrition-reorder

branch: claude/feature/nutrition-reorder

## Summary

Add drag-and-drop reordering to the Nutrition settings tab using dnd-kit. Visible nutrients switch from a 2-column grid to a single-column list, each row gaining a drag handle so users can reorder nutrients. The saved order is reflected in the nutrition table on the compare page. Rules also gain drag handles so users can reorder them for personal organisation; the rule order is saved to Firestore but has no functional effect on threshold evaluation.

## Functional Requirements

### 1. Visible Nutrients — Layout & Reordering

- Change the visible nutrients section from a 2-column grid to a single-column list.
- Each nutrient row displays: a drag handle icon on the left, the nutrient checkbox, and the nutrient label.
- Users can drag and drop any nutrient row to a new position within the list.
- The order of nutrients in the list determines the order of rows rendered in the nutrition table on the compare page.
- The current hardcoded order (Calories, Protein, Carbohydrates, Sugar, Fat, Saturated Fat, Fiber, Salt) is used as the default when no saved order exists.
- The saved `visibleNutrients` array in Firestore is extended to also encode order: the array is stored in display order, and its sequence is the source of truth for both visibility and ordering.

### 2. Rules — Reordering

- Each rule row gains a drag handle on the left side, consistent with the nutrient rows.
- Users can drag and drop rules to reorder them within the list.
- Rule order is saved to Firestore as the sequence of the `rules` array.
- Reordering rules has no effect on threshold evaluation logic — it is purely organisational.

### 3. Drag Handles

- Drag handles use a grip/dots icon (e.g. `GripVertical` from lucide-react).
- Handles are only active (draggable) when the user grabs them — the rest of the row remains interactive (checkboxes, dropdowns, inputs).
- On touch devices, drag handles enable touch-based reordering.
- The drag handle cursor changes to `grab` / `grabbing` on hover/active.

### 4. Drag Interaction Feedback

- While dragging, the dragged item is visually lifted (e.g. slight shadow or opacity change) to indicate it is being moved.
- A drop indicator shows where the item will land.
- No animation is required beyond the native dnd-kit defaults.

### 5. Save & Persistence

- Reordering counts as a change — it enables the Save button.
- On save, `visibleNutrients` is written in the new display order (existing behaviour already writes this array; order is now meaningful).
- On save, `rules` is written in the new display order.
- On load, the nutrients list and rules list are rendered in the order retrieved from Firestore.
- The `NutritionSettings` type in `types/firestore.ts` does not need structural changes — ordering is implicit in array sequence.

### 6. Nutrition Table Ordering

- The nutrition table on the compare page renders nutrient rows in the order defined by `visibleNutrients` (only showing those that are visible).
- If no settings document exists, the table falls back to the hardcoded default order.

## Possible Edge Cases

- User reorders nutrients then unchecks one — both changes (visibility and order) must be reflected in the saved state.
- Firestore document from before this feature has `visibleNutrients` in the old default order — this is valid; no migration needed, the stored order is used as-is.
- Single-item list (only one nutrient visible or only one rule) — drag handle renders but dragging has no effect.
- Rapid drags before save — only the final in-memory order at save time is written.
- Touch drag on mobile — dnd-kit's touch sensor handles this; no custom logic needed.

## Acceptance Criteria

- The visible nutrients section renders as a single-column list (not a 2-column grid) on all screen sizes.
- Each nutrient row and each rule row has a visible drag handle on the left.
- Dragging a nutrient to a new position reorders the list in the UI immediately.
- Dragging a rule to a new position reorders the rule list in the UI immediately.
- After reordering and saving, reloading the settings page shows the new order.
- After reordering nutrients and saving, the nutrition table on the compare page renders rows in the saved order.
- The Save button becomes enabled after any reorder (nutrients or rules).
- All existing nutrient checkbox and rule editing functionality continues to work unchanged.
- The drag handle uses `grab`/`grabbing` cursor styling.

## Open Questions

- None at this time.

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Visible nutrients section renders as a single-column list (not a grid).
- Each nutrient row renders a drag handle element.
- Each rule row renders a drag handle element.
- Nutrient order in the rendered list matches the order from saved settings.
- Rule order in the rendered list matches the order from saved settings.
- Reordering nutrients (simulated state change) enables the Save button.
- Reordering rules (simulated state change) enables the Save button.
- On save after reorder, Firestore is called with nutrients in the new order.
- On save after rule reorder, Firestore is called with rules in the new order.
- Nutrition table renders nutrient rows in the order specified by `visibleNutrients`.
