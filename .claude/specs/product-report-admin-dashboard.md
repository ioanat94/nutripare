# Spec for product-report-admin-dashboard

branch: claude/feature/product-report-admin-dashboard

## Summary

Allow users to report missing or incorrect product data anonymously. Reports are stored in Firestore and surfaced in a restricted admin dashboard. Two report triggers exist: a manual "Report" option in product dropdowns, and an automatic trigger when a product is not found on OpenFoodFacts. The admin dashboard supports filtering by status and dismissing reports as solved or false.

## Functional Requirements

- Add a "Report" option to the product dropdown menus on the compare page, styled in warning colors (amber/yellow), placed as the last option.
- Clicking "Report" opens a shadcn `Dialog` modal with the message "Report missing or incorrect product data? Your report is anonymous." and two buttons: "Confirm" and "Cancel".
- Confirming the report calls a Next.js API route (`POST /api/report`) which handles saving to Firestore. The API route enforces IP-based rate limiting (e.g. max 25 requests per hour per IP) and returns a silent success to the client even when rate-limited, to avoid leaking limit details.
- When a product barcode is searched and not found on OpenFoodFacts, the same `POST /api/report` endpoint is called silently in the background — no modal or additional UI is shown, as the existing not-found warning already informs the user.
- The API route saves a document to the Firestore `reports` collection with fields: `code` (product barcode), `date` (server timestamp), `reason` (`"incorrect data"` or `"missing product"`), `status: "open"`. The product code is used as the document ID to prevent duplicates.
- Create a new route `app/admin/page.tsx` for the admin dashboard.
- The admin dashboard access is enforced entirely by Firestore security rules — no admin UID is stored in any env var or client bundle. The page attempts to load reports from Firestore; a permission error (returned for any non-admin or unauthenticated user) triggers a redirect to `/`.
- The admin dashboard lists all reports from Firestore, showing: product code, date, reason, and status.
- Each report has a "Dismiss" button with two sub-options: "Solved" and "False Report", which update the report's `status` field to `"solved"` or `"dismissed"` respectively.
- Reports are never deleted — only their status is updated.
- The admin dashboard includes a filter UI (e.g. tabs or a select) to filter reports by status: All, Open, Solved, Dismissed.

## Possible Edge Cases

- A user could report the same product multiple times — use the product code as the Firestore document ID. If no document exists, create it. If a document exists with status `"open"`, silently do nothing. If a document exists with status `"solved"` or `"dismissed"`, overwrite it (reset to `status: "open"` with a fresh `date`), effectively reopening the report.
- The "missing product" report should only be saved once per search attempt, not on every keystroke or re-render.
- Reports are always anonymous — no user identifier is stored, regardless of whether the user is logged in.
- No admin UID is stored in any env var or client code. The admin UID lives only in Firestore security rules, which are enforced server-side by Google and cannot be bypassed from the client.
- Firestore security rules must allow any user (including unauthenticated) to create reports, but only the admin can read or update them.
- The admin page must not flash content before auth state resolves — show a loading state while auth is pending.

## Acceptance Criteria

- The product dropdown on the compare page shows a "Report" option in warning/amber color and has an appropriate icon.
- Clicking "Report" opens the confirmation modal; clicking "Cancel" closes it without saving; clicking "Confirm" saves a report to Firestore and closes the modal.
- Searching a barcode that returns no result on OpenFoodFacts silently saves a report in the background (the existing not-found UI is unchanged).
- Navigating to `/admin` as the admin user shows the dashboard with all reports.
- Navigating to `/admin` as any other user (or unauthenticated) redirects to `/`.
- The admin can filter reports by status (All / Open / Solved / Dismissed).
- Clicking "Dismiss > Solved" on a report updates its status to `"solved"` in Firestore and reflects the change in the UI without a page reload.
- Clicking "Dismiss > False Report" updates status to `"dismissed"` similarly.
- No reports are ever deleted from Firestore.

## Open Questions

- Rate limiting is enforced server-side via the `POST /api/report` API route using IP address (max 25 requests per hour per IP). The client always receives a silent success response to avoid exposing limit details or encouraging workarounds.
- The admin UID is never in source code or env vars.
- Should reports include any optional metadata (user agent, locale)? Not required.
- The admin dashboard is paginated at 25 reports per page, with next/previous navigation.

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Renders the "Report" option in the product dropdown and it is styled distinctly (warning color class present).
- Opening the report modal shows the correct message text and both action buttons.
- Clicking "Cancel" closes the modal without calling the Firestore save function.
- Clicking "Confirm" calls the Firestore save function with the correct `code`, `reason: "incorrect data"`, and `status: "open"` fields.
- When a product search returns not found, the Firestore save is called with `reason: "missing product"` and `status: "open"`.
- Non-admin users visiting `/admin` are redirected to `/`.
- Admin user visiting `/admin` sees a list of reports.
- Clicking "Solved" on a report calls the Firestore update with `status: "solved"`.
- Clicking "False Report" on a report calls the Firestore update with `status: "dismissed"`.
- The status filter correctly filters the displayed report list.
