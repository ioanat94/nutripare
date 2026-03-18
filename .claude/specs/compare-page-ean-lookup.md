# Spec for Compare Page EAN Lookup

branch: claude/feature/compare-page-ean-lookup

## Summary

Build the foundation of the Compare page, where users can enter one or more EAN product barcodes (comma-separated) and retrieve nutritional information from the Open Food Facts API. For now, the fetched data is logged to the console. Camera/barcode scanning is out of scope for this phase.

## Functional Requirements

- The Compare page (`/compare`) has an input field where users can type one or more EAN codes, separated by commas.
- A submit button (or pressing Enter) triggers the lookup.
- For each EAN code entered, the app calls the Open Food Facts staging API to fetch product data.
- After fetching, the app logs the following fields to the console for each product:
  - `code` (the EAN)
  - `product_name`
  - `kcals` (energy in kcal per 100g)
  - `protein` (per 100g)
  - `carbohydrates` (per 100g)
  - `sugar` (per 100g)
  - `fat` (per 100g)
  - `saturated_fat` (per 100g)
  - `fiber` (per 100g)
  - `salt` (per 100g)
- Use the Open Food Facts **staging** API base URL.
- Multiple EAN codes result in multiple API calls (one per code), all logged individually.
- The input should be trimmed and split correctly, ignoring extra spaces around commas.

## Possible Edge Cases

- User enters an EAN code that does not exist in Open Food Facts — the product is not found; log a clear message indicating the code was not found.
- User submits an empty input — no API call is made; optionally show a validation message.
- User enters only commas or whitespace — treated as empty input.
- A nutritional field is missing or null for a product — log it as `null` or `N/A` rather than crashing.
- User enters duplicate EAN codes — deduplicate before fetching.
- API request fails (network error, rate limit, etc.) — log an error message for that code without breaking the others.
- EAN codes with leading zeros should be preserved as strings, not parsed as numbers.

## Acceptance Criteria

- Navigating to `/compare` shows a text input and a submit button.
- Entering a single valid EAN and submitting causes the console to log the ten specified nutritional fields for that product.
- Entering a comma-separated list of valid EANs causes the console to log the fields for each product, one after another.
- Entering an invalid or unknown EAN logs a "not found" message for that code.
- Submitting an empty input does not trigger any API call.
- The staging API URL is used (not the production URL).

## Open Questions

- Should duplicate EAN codes be deduplicated, or logged separately? Deduplicated
- Should there be any visible UI feedback (loading state, error messages) at this stage, or purely console output? Loading state only, for now.
- Are there any rate limits on the Open Food Facts staging API that we need to handle with throttling or delays? Yes, there is a rate limit of 100 req/min for all read product queries.

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Parsing of comma-separated EAN input (trimming, splitting, deduplication of whitespace).
- Correct extraction of nutritional fields from a mocked API response.
- Handling of a "product not found" API response without throwing.
- Handling of missing/null nutritional fields in the API response.
- Empty input does not trigger a fetch call.
