# Spec for nutrition-settings

branch: claude/feature/nutrition-settings

## Summary

Flesh out the Nutrition settings tab with three sections: visible nutrients, emoji indicators toggle, and customisable threshold rules. All changes are persisted to Firestore for the authenticated user and reflected live in the nutrition table on the compare page.

## Functional Requirements

### 1. Visible Nutrients

- Display a checkbox for each of the 8 nutrients shown in the nutrition table: Calories, Protein, Carbohydrates, Sugar, Fat, Saturated Fat, Fiber, Salt.
- Checkboxes are arranged in a 2-column grid, responsive (stacks to 1 column on small screens).
- All nutrients are checked (visible) by default.
- Unchecking a nutrient hides that row from the nutrition table.

### 2. Emoji Indicators Toggles

- Two separate toggles (switches) in this section:
  - **"Show crown (👑)"** — with description: "Highlights the best value for each nutrient when comparing products." Enabled by default.
  - **"Show flag (🚩)"** — with description: "Highlights the worst value for each nutrient when comparing products." Enabled by default.
- When a toggle is disabled, its respective emoji is hidden from the nutrition table regardless of threshold rules.

### 3. Threshold Rules

- Display all currently active rules in a list. On first load for a user, pre-populate with the existing hardcoded defaults from `utils/thresholds.ts`.
- Each rule has the form:
  `[Nutrient dropdown] [Direction dropdown] or equal to [Value input] is [Rating dropdown]`
- **Nutrient dropdown**: all 8 nutrients from the nutrition table.
- **Direction dropdown**: "above" or "below".
- **Value input**: number, 0–99.9, 1 decimal place allowed, step 0.1.
- **Rating dropdown**: 4 colour-coded options:
  - "Great" — green (maps to `positive`)
  - "Good" — blue (maps to `info`)
  - "Concerning" — amber/warning (maps to `warning`)
  - "Bad" — red/destructive (maps to `negative`)
  - Each option is rendered with a coloured dot or badge to make the colour immediately clear.
- A "Reset to defaults" button restores the hardcoded thresholds from `utils/thresholds.ts`, replacing all current rules. It only appears enabled when the current rules differ from the defaults.
- Users can add a new blank rule via an "Add rule" button.
- Users can remove any rule via a remove/trash icon on each row.
- Users can edit any field of an existing rule inline.
- No limit on the number of rules, but each nutrient+rating combination must be unique. If a user creates a rule that duplicates an existing nutrient+rating pair, show an inline error below that rule row (e.g. "A rule for protein / Great already exists"). The Save button remains disabled while any validation error is present.

### 4. Save Button

- A single "Save" button at the bottom of the Nutrition tab covers all three sections.
- The button is disabled when no changes have been made relative to the last saved state.
- On save, the settings are written to a Firestore document at `users/{uid}/settings/nutrition`.
- A success toast is shown on save; an error toast if the write fails.

### 5. Data Persistence & Consumption

- On mount, the Nutrition tab reads the user's saved settings from Firestore. While loading, show a skeleton or spinner.
- If no document exists yet, fall back to defaults (all nutrients visible, emoji on, hardcoded thresholds).
- Crown and flag emojis are only shown for visible nutrients; hidden nutrients are excluded from the best/worst value calculation.
- The nutrition table on the compare page reads from the same Firestore document (or falls back to defaults) so the table reflects the user's preferences in real time after save.
- A new `NutritionSettings` type is added to `types/firestore.ts` capturing: `visibleNutrients`, `showCrown`, `showFlag`, and `rules`.
- The `ThresholdColor` type is extended to include a `'good'` level, styled with `--info` / `--info-foreground`, alongside the existing `positive`, `warning`, `negative`.

## Possible Edge Cases

- User removes all rules — the nutrition table shows no colour coding, which is valid.
- User hides all nutrients — the table renders with no rows; show an empty state message.
- User has an old Firestore document missing the `good` colour level — treat unknown levels as `null` (no colour).
- Multiple tabs open: settings saved in one tab should be reflected after next page load in another (no real-time sync needed).
- Value input: prevent values outside 0–99.9; clamp or show validation error inline.
- Two rules for the same nutrient+rating combination show an inline validation error and block saving until resolved.

## Acceptance Criteria

- The Nutrition settings tab renders three distinct sections: "Visible nutrients", "Highlights", and "Rules", each with a clear heading.
- Toggling a nutrient checkbox and saving causes that row to disappear/reappear in the nutrition table on the compare page.
- Toggling the crown switch off and saving removes 👑 from the table without affecting 🚩, and vice versa.
- Adding, editing, and removing rules and saving updates threshold colour coding in the table.
- The "Save" button is disabled on initial load and after a successful save (no pending changes).
- The "Save" button becomes enabled as soon as any field differs from the saved state.
- Firestore is written once on save, not on every keystroke.
- Fallback to defaults works for a brand-new user with no settings document.
- The "Good" (blue) rating level is visually distinct from "Great" (green) in both the rule editor dropdown and the nutrition table cells.

## Open Questions

- ~~Should the `good` colour use the existing `--info` custom token (blue) already defined in `globals.css`?~~ Confirmed: use `--info` / `--info-foreground` for the "Good" level.
- ~~Is there a maximum number of rules we should enforce to avoid Firestore document size issues?~~ No — the nutrient+rating uniqueness constraint caps rules at 32 (8 nutrients × 4 ratings), which is negligible.

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Nutrition tab renders all three sections (visible nutrients, highlights toggle, rules).
- All 8 nutrient checkboxes render checked by default.
- Unchecking a nutrient enables the Save button.
- Both the crown and flag toggles render as enabled by default.
- Toggling either emoji switch enables the Save button.
- Save button is disabled when no changes have been made.
- Save button becomes enabled after any change.
- Adding a new rule appends a blank row.
- Removing a rule removes it from the list.
- The rating dropdown renders all 4 options (Great, Good, Concerning, Bad).
- Value input rejects values outside 0–99.9.
- Duplicate nutrient+rating combination shows an inline error and disables the Save button.
- Saving calls the Firestore write with the correct payload.
- On load, previously saved settings are restored (nutrients, toggle, rules).
