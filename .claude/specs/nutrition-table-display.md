# Spec for nutrition-table-display

branch: claude/feature/nutrition-table-display

## Summary

Display nutritional information for looked-up products on the compare page. All fields from `ProductNutrition` are shown as rows with nutrient labels in the first column and product values in subsequent columns. When one product is loaded the table has a single value column; when multiple products are loaded additional columns appear side by side. The table scrolls horizontally so any number of products can be compared. Cell values are color-coded using the thresholds defined in `utils/thresholds.ts`.

## Functional Requirements

- Store fetched `ProductNutrition` objects in component state (array) after each successful lookup, replacing any previous result for the same EAN code.
- Render a nutrition table below the search form once at least one product has been fetched.
- The table always has a fixed first column listing nutrient labels: Calories (kcal), Protein (g), Carbohydrates (g), Sugar (g), Fat (g), Saturated Fat (g), Fiber (g), Salt (g).
- Each subsequent column represents one product, headed by its `product_name` (falling back to the EAN code if the name is empty).
- When only one product is present the table shows one value column — the layout is identical to the multi-product layout so adding a second product causes no visual jump.
- The table container is horizontally scrollable so it works with any number of products on narrow viewports.
- Each numeric cell is color-coded by evaluating the value against the nutrient's `ThresholdCondition[]` list from `utils/thresholds.ts`. Each condition specifies a color (`positive`, `warning`, `negative`), a direction (`above` / `below`), and a numeric value. The first matching condition wins; if none match the cell is neutral.
  - Nutrients not present in `THRESHOLDS` (e.g. calories, carbohydrates, fat) are always neutral.
  - Missing / undefined values show a dash ("—") with no color.
- Color should be applied as **colored text** (not background) to keep the table readable in dark mode.
- The nutrient label column is sticky (does not scroll away horizontally).
- Product columns have equal minimum width so values don't become too narrow.
- Individual products can be removed from the table via a dismiss/close button in the column header.

## Possible Edge Cases

- A product lookup returns `null` (not found) — do not add a column; optionally surface an inline error near the input.
- The same EAN is submitted again — update the existing column in place rather than adding a duplicate.
- All products are dismissed — the table disappears and the page returns to the empty search state.
- A nutrient value is `undefined` or `NaN` — render "—" with no coloring.
- A very long `product_name` — truncate with ellipsis in the column header to prevent layout breakage.
- Fetching multiple codes simultaneously — columns should appear in the order the codes were entered, filling in as each request resolves.

## Acceptance Criteria

- Looking up one EAN renders a table with one value column and all eight nutrient rows.
- Looking up a second EAN appends a second value column without layout shift.
- Nutrient cells are colored according to the matching `ThresholdCondition` in `THRESHOLDS`: positive conditions render in positive-color text, negative conditions in negative-color text, warning conditions in warning-color text.
- If no condition matches, or the nutrient has no entry in `THRESHOLDS`, the cell is neutral-colored.
- The nutrient label column stays visible when scrolling horizontally with many products.
- Dismissing a product column removes it from the table; dismissing the last one hides the table.
- The table is accessible: column headers use `<th scope="col">`, row labels use `<th scope="row">`.

## Open Questions

- Should the product columns show the EAN code beneath the product name for reference, or only the name? There should be an EAN code row under the name.
- Should there be a "clear all" button in addition to per-column dismiss buttons? Yes.
- Should failed lookups surface a visible error message, or silently skip? There should be an alert above the table (warning colors) that says: could not find product(s) with code(s) XX.

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Renders nothing when no products have been fetched yet.
- Renders a table with one column when one `ProductNutrition` object is provided.
- Renders two columns when two `ProductNutrition` objects are provided.
- A nutrient value above its `high` threshold receives the red text class.
- A nutrient value at or below its `low` threshold receives the green text class.
- A nutrient with null thresholds on both sides receives no color class.
- A missing (undefined) nutrient value renders "—" with no color class.
- Dismissing a column removes it from the rendered table.
- Dismissing the last column hides the table entirely.
