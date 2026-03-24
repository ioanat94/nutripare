# Spec for nutrition-rulesets

branch: claude/feature/nutrition-rulesets

## Summary

Replace the single nutrition rules set with named rulesets. Users can create multiple rulesets (e.g. one for dairy, one for bread), manage them in the settings page, and select which ruleset to apply when viewing a nutrition comparison table. The computed score updates instantly when switching rulesets.

## Functional Requirements

- **Settings — Rulesets list view:**
  - The Nutrition tab in settings shows a list of rulesets instead of a flat list of rules.
  - Each ruleset row displays its name plus View and Delete icon buttons.
  - Clicking Delete shows a confirmation dialog before removing the ruleset.
  - Clicking View navigates to the ruleset detail view (replacing the list in the same tab pane).
  - An "Add ruleset" button at the bottom of the list creates a new ruleset with the default name "New Ruleset" and no rules, then opens it in the detail view immediately.

- **Settings — Ruleset detail view:**
  - Displays the ruleset name as an editable field (inline rename).
  - Shows the existing per-nutrient rule editor (thresholds, positive/warning/info classification) — identical to the current rules UI.
  - Has Save, Cancel, and Delete buttons.
    - Save persists name and rule changes.
    - Cancel discards unsaved changes and returns to the list view.
    - Delete shows a confirmation dialog, then removes the ruleset and returns to the list view.

- **Comparison table — ruleset selector:**
  - The `...` overflow menu on the nutrition comparison table includes a ruleset selector (dropdown/select).
  - The selector lists all of the user's saved rulesets by name.
  - Switching the selection instantly recomputes and re-renders the score row using the chosen ruleset's rules.
  - The selected ruleset is persisted per comparison (stored alongside the comparison document in Firestore).

- **Data migration / defaults:**
  - Existing users who already have a single rules set should have it treated as a ruleset named "Default".
  - New users start with one ruleset named "Default", seeded from the default thresholds (same as the previous default rules).

## Possible Edge Cases

- A user deletes all rulesets — the score row should handle a "no ruleset" state gracefully (show a placeholder or hide the score).
- Selecting a ruleset that has since been deleted (stale reference in a saved comparison) — fall back gracefully.
- Very long ruleset names should be truncated in the list and detail header without breaking layout.
- Concurrent edits (same user, two browser tabs) — optimistic Firestore writes should not corrupt ruleset data.
- The "Add ruleset" flow should not accidentally save until Save is clicked (Cancel should discard a brand-new ruleset if it was never saved).

## Acceptance Criteria

- [ ] Nutrition settings tab shows a list of rulesets, each with a name, View button, and Delete button.
- [ ] Delete button triggers a confirmation dialog; ruleset is only removed upon confirmation.
- [ ] View button opens the detail view with the ruleset's name (editable) and its rules.
- [ ] Save in detail view persists changes; Cancel discards and returns to the list.
- [ ] Delete in detail view shows confirmation, removes ruleset, and returns to the list.
- [ ] "Add ruleset" button creates a new ruleset named "New Ruleset" with no rules and opens it in the detail view.
- [ ] The `...` menu on the comparison nutrition table contains a ruleset selector populated with all user rulesets.
- [ ] Selecting a different ruleset from the dropdown immediately updates the computed score row.
- [ ] Selected ruleset is saved to the comparison document and restored on page reload.
- [ ] A comparison with no ruleset selected (or a deleted ruleset) renders the score row in a graceful fallback state.

## Open Questions

- Should the selected ruleset be stored per comparison (so each saved comparison remembers its ruleset), or should it be a global/session preference? Per comparison
- Should new users be seeded with a "Default" ruleset on first login, or start with an empty list? "Default" ruleset
- Should rulesets be orderable (drag-to-reorder) or is alphabetical/creation-order sufficient for now? drag-to-reorder (order should also be reflected in the table select)

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Rendering the rulesets list with multiple rulesets shows name, view, and delete controls for each.
- Clicking Delete on a ruleset shows the confirmation dialog without immediately deleting.
- Confirming deletion removes the ruleset from the list.
- Clicking View opens the detail view with the correct ruleset name and rules pre-populated.
- Saving changes in the detail view persists the updated name and rules.
- Cancelling in the detail view reverts changes and returns to the list.
- "Add ruleset" appends a new ruleset and navigates to its detail view.
- Switching the ruleset selector in the comparison table triggers an immediate score recomputation.
- Score row renders a graceful fallback when no ruleset is selected or the selected ruleset no longer exists.
