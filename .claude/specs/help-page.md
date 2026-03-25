# Spec for help-page

branch: claude/feature/help-page

## Summary

A documentation-style help page accessible from the navbar that explains every feature of the app to new and returning users. The page is structured as a series of clearly labelled sections that can be read top-to-bottom or jumped to via anchor links.

## Functional Requirements

- Add a `/help` route with a dedicated page component.
- The navbar already has a help icon linking to `/help`. The home page already has a "How it works" button linking to `/help`. No new navigation needs to be added.
- The page is structured into the following sections, in order:

### 1. Overview

- Briefly explain what Nutripare does: look up food products by EAN barcode, display their nutritional values side by side, and highlight differences based on configurable rules.
- Mention that data comes from Open Food Facts, a free collaborative database, and that values may be incomplete or inaccurate.

### 2. Searching for Products

- Explain that EAN barcodes are entered into the search field on the Compare page.
- A single EAN can be entered to look up one product.
- Multiple EANs can be entered at once by separating them with commas (e.g. `5000112637922, 8076809513388`).
- After the first product loads, additional products can be added one at a time or in bulk using the same input field — they are appended as new columns.
- Explain the barcode scanner button: it opens the device camera to scan a physical barcode. Note that low-resolution webcams can produce inconsistent results, so manual entry is recommended as a fallback.
- Explain the error states: invalid EAN format (shown in amber) and product not found (shown in amber). Codes that are not valid 8, 12, or 13-digit EANs are rejected.

### 3. The Nutrition Table

- Each product appears as a column. All values are per 100g.
- Explain the colour coding applied to cell values:
  - Green (great): the value meets a "great" threshold rule.
  - Blue (good): the value meets a "good" threshold rule.
  - Amber (concerning): the value meets a "concerning" threshold rule.
  - Red (bad): the value meets a "bad" threshold rule.
  - No colour: the value does not match any rule, or no rules are defined for that nutrient.
- Explain the emoji flags:
  - Crown (👑): shown on the best value across products for a nutrient that has a "great" rule.
  - Red flag (🚩): shown on the worst value across products for a nutrient that has a "bad" rule.
  - Emojis only appear when comparing two or more products, and can be hidden in Settings.
- Explain where default highlight values come from: the app ships with a built-in default ruleset based on the UK Food Standards Agency (FSA) per-100g traffic light thresholds, which are also widely used across the EU for front-of-pack nutrition labelling. These defaults apply to signed-out users and to signed-in users who have not yet customised their settings.
- Display the default thresholds in a table so users can see exactly which values trigger each colour. The table should have columns for Nutrient, Threshold, Value (per 100g), and Rating. Example rows:

  | Nutrient      | Threshold | Value (per 100g) | Rating |
  | ------------- | --------- | ---------------- | ------ |
  | Protein       | above     | 20g              | Great  |
  | Sugar         | below     | 5g               | Great  |
  | Sugar         | above     | 22.5g            | Bad    |
  | Saturated Fat | below     | 1.5g             | Great  |
  | Saturated Fat | above     | 5g               | Bad    |
  | Fiber         | above     | 6g               | Great  |
  | Salt          | below     | 0.3g             | Great  |
  | Salt          | above     | 1.5g             | Bad    |

- Explain sorting: clicking any row label sorts all product columns by that nutrient, highest to lowest. Clicking again reverses the sort. The active sort column is highlighted and shows an arrow indicator.
- Explain the Computed Score row: a single 0–100 score calculated from the active ruleset. It reflects how well a product performs across all rules — positive rules raise the score, negative rules lower it. Hovering the help icon next to the label shows a brief tooltip.
- Include the formula used to compute the score, explained in plain language:
  1. For each rule that fires (i.e. the product's value meets the rule's condition), a weighted contribution is calculated. The weight depends on the rating: Great = +3, Good = +1, Concerning = −1, Bad = −3.
  2. The contribution is scaled by the magnitude of how far the value exceeds the threshold: `weight × log(1 + distance / max(threshold, 1))`, where distance is `|value − threshold|`.
  3. All contributions are summed into a raw score, then mapped to the 0–100 range using: `round(50 × (1 + tanh(rawScore / 3)))`, clamped to [0, 100].
  - A score of 50 is neutral (no rules fire). Scores above 50 indicate a generally healthy profile under the active ruleset; scores below 50 indicate the opposite.
  - Nutrients with missing values are skipped and do not affect the score.

### 4. Table Actions

- The "..." menu in the top-right of the table gives access to table-wide actions:
  - Switch ruleset (signed-in users): changes which ruleset is used for highlights and scoring. The submenu is visible even with only one ruleset so users are aware the feature exists.
  - Save comparison / Update comparison / Save as new comparison: see Saving below.
  - Share: copies a shareable URL for the current set of products to the clipboard.
  - Clear all: removes all products from the table.
- Each product column also has its own "..." menu with:
  - Save product / Unsave product (signed-in users only).
  - Share: copies a shareable URL for just that product.
  - Remove: removes the product column from the table.

### 5. Saving Products and Comparisons

- Signed-in users can save individual products via the per-column menu. Saved products are stored in the Products tab under Settings.
- Signed-in users can save the current set of two or more products as a named comparison. A dialog prompts for a name (pre-filled with a suggestion). Saved comparisons appear in the Comparisons tab under Settings.
- When a saved comparison is loaded (via the Comparisons tab or a shared URL), the table shows its name and tracks whether the products have been modified since loading. If modified, the "..." menu offers "Update [name]" (overwrite) or "Save as new comparison".
- To delete a saved comparison from the table view, use "Delete [name]" in the "..." menu.
- To unsave an individual product, use "Unsave product" in the per-column menu.

### 6. Settings — Account Tab

- Manage the signed-in account: display name, email, password change, and sign-out.

### 7. Settings — Nutrition Tab

- **Visible rows**: checkboxes control which nutrient rows appear in the table. The drag handle to the left of each row allows reordering — the order is reflected in the table.
- **Highlights**: two toggles — "Show crown (👑)" and "Show flag (🚩)" — enable or disable the emoji indicators globally.
- **Rulesets**: a list of saved rulesets. Each ruleset defines which nutrients are highlighted and how. The search box filters by name. Drag handles allow reordering the list.
  - Clicking the eye icon opens the ruleset editor.
  - Clicking the trash icon (with confirmation) deletes the ruleset and saves immediately — no separate Save step is needed.
  - "Add ruleset" creates a new empty ruleset and opens the editor immediately.
- In the **ruleset editor**:
  - The ruleset name is editable inline at the top.
  - Each rule defines: nutrient, direction (above/below), threshold value, and rating (great/good/concerning/bad).
  - Rules can be reordered by dragging.
  - "Add rule" appends a new blank rule row.
  - "Reset to defaults" restores the built-in default rules (disabled when already at defaults).
  - "Save" persists the ruleset immediately.
  - "Delete ruleset" removes it (with confirmation); disabled for newly created (unsaved) rulesets.
  - "Cancel" discards unsaved changes; cancelling a new ruleset also removes it from the list.
- Changes to visible rows, row order, and highlight toggles require clicking the main "Save" button at the bottom of the tab.

### 8. Settings — Products Tab

- Lists all saved products in a searchable table (search by name or EAN).
- Each row has a view button (opens the product in the Compare page in a new tab) and an unsave button.
- Checking two or more products enables a "Compare" button at the bottom that opens those products in the Compare page in a new tab.

### 9. Settings — Comparisons Tab

- Lists all saved comparisons in a searchable table (search by name or EAN).
- Each row shows the comparison name and the EAN codes it contains.
- The pencil icon inline with the name puts the row into rename mode; confirm with the checkmark or cancel with the X.
- Each row has a view button (opens the comparison in the Compare page in a new tab) and an unsave button.

### 10. Account Features: Signed-in vs. Signed-out

- **Without an account (signed out)**:
  - Search and compare any products.
  - Highlights and scoring use the built-in default ruleset only.
  - Table sorting and per-column removal work normally.
  - Sharing via URL works.
  - Cannot save products or comparisons.
  - Cannot customise rulesets, visible rows, or row order.
- **With an account (signed in)**:
  - All of the above, plus:
  - Save and manage individual products.
  - Save, name, update, and manage comparisons.
  - Create and customise multiple rulesets.
  - Control which nutrient rows are visible and their order.
  - Toggle crown and flag emoji indicators.
  - Switch between rulesets directly on the Compare page.
  - Settings are synced to the account and persist across devices.

## Possible Edge Cases

- Sections on a long page should be navigable via anchor links from a table of contents at the top.
- The page should be readable on mobile — long code examples or table-of-contents links should stack properly.
- The help page should be accessible to signed-out users (no auth gate).
- The page should not display any interactive app components — it is read-only documentation.

## Acceptance Criteria

- A `/help` route exists and renders the help page without errors.
- The navbar icon and the home page "How it works" button both link to `/help`.
- All 10 sections listed above are present and accurately describe the current app behaviour.
- The page includes a table of contents with anchor links to each section.
- The page is readable and usable on both desktop and mobile viewports.
- No account is required to view the page.

## Open Questions

- Should the table of contents be a sticky sidebar on desktop or an inline list at the top? Sidebar on desktop
- ~~Should the Help link in the navbar be a text link or an icon?~~ Already implemented as an icon in the navbar and a "How it works" button on the home page.
- Should the page include any screenshots or is text-only sufficient for a first version? Text only for now

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- The `/help` route renders without errors (smoke test).
- All major section headings are present in the rendered output.
- The table of contents renders anchor links that correspond to section IDs.
- The page is accessible to unauthenticated users (no redirect to login).
- The navbar icon and home page "How it works" button point to `/help`.
