# Spec for save-products-and-comparisons

branch: claude/feature/save-products-and-comparisons

## Summary

Allow authenticated users to save individual products and full comparisons to Firestore. Save actions are accessible directly from the compare page UI via icon buttons. Feedback on save success or failure is shown via toast notifications. All save operations are auth-gated — unauthenticated users cannot trigger saves.

## Functional Requirements

- Only logged-in users can save products or comparisons. If a user is not authenticated, the save buttons are either hidden or disabled (hidden is preferred to keep the UI clean for guests).
- Each product column in the nutrition table has a save (floppy disk) icon button in the product header, next to the existing dismiss (X) button.
- A save comparison button (button with text "Save Comparison") appears in the toolbar next to the product count label (e.g., "2 products"), not next to "Clear all".
- The save comparison button is only shown when there are 2 or more products in the comparison.
- Saving a product stores `{ id: auto-generated, name: string (product_name from API), ean: string (product code) }` in Firestore under the user's saved products.
- Saving a comparison stores `{ id: auto-generated, name: string ("<first product name> + <N> others"), eans: string[] }` in Firestore under the user's saved comparisons. The name is derived from the first product's name and the total count minus one (e.g., "Nutella + 2 others").
- The Firestore schema must be updated: the existing `FirestoreUser` type uses flat arrays (`products: string[]`, `comparisons: string[][]`). This must be replaced with subcollections or a new document structure using the richer object shapes described above. Update `types/firestore.ts` accordingly and adjust any existing code that references the old shape.
- Save buttons show a loading spinner while the Firestore write is in progress.
- On success, a toast notification is shown: "Product saved" or "Comparison saved".
- On failure, a toast notification is shown: "Failed to save product" or "Failed to save comparison", with a brief error message if available.
- The shadcn `sonner` toast component should be installed and used (run `npx shadcn@latest add sonner`). The `<Toaster />` component must be added to the root layout.
- Auth state is read from the existing `AuthContext` (`useAuth` hook from `contexts/auth-context.tsx`). This is a UI-only guard — it controls visibility of buttons but is not a security boundary.
- Firestore Security Rules are the true enforcement layer. Rules must ensure that only authenticated users can write, and that a user can only write to their own subcollections (i.e. `users/{uid}/products` and `users/{uid}/comparisons` must require `request.auth.uid == uid`). The spec must include updated security rules as a deliverable.
- `NutritionTable` must accept new props for the save handlers so the compare page can own the Firestore logic and pass it down.

## Possible Edge Cases

- User logs out between loading the page and clicking save — the auth check must happen at call time, not just at render time.
- Product name is missing or empty — fall back to the EAN code as the name.
- Saving a product that has already been saved (same EAN) — before writing, query Firestore for an existing document with the same `ean`. If found, show a "Product already saved" toast and abort the write.
- Saving a comparison that already exists — before writing, query Firestore for an existing comparison whose `eans` array contains exactly the same set of EANs (order-insensitive). If found, show a "Comparison already saved" toast and abort the write.
- Comparison with only one product — the save comparison button should not appear for single-product views.
- Firestore write fails due to network error or permission denied — the toast must reflect the failure without crashing the page.
- Multiple saves triggered in rapid succession — each button tracks its own loading state independently.

## Acceptance Criteria

- Unauthenticated users do not see any save buttons on the compare page.
- Authenticated users see a floppy disk icon button in each product column header and a "Save Comparison" button next to the product count when 2+ products are loaded.
- Clicking a product save button shows a spinner, then a "Product saved" toast on success, "Product already saved" toast if a duplicate is detected, or "Failed to save product" toast on error.
- Clicking the comparison save button shows a spinner, then a "Comparison saved" toast on success, "Comparison already saved" toast if a duplicate is detected, or "Failed to save comparison" toast on error.
- Saved product documents in Firestore match the shape `{ id, name, ean }`.
- Saved comparison documents in Firestore match the shape `{ id, name, eans }` where `name` is formatted as `"<first product name> + <N> others"`.
- `types/firestore.ts` is updated to reflect the new schema and no TypeScript errors are introduced.
- Firestore Security Rules are updated so that writes to `users/{uid}/products` and `users/{uid}/comparisons` require `request.auth != null && request.auth.uid == uid`. Unauthenticated or cross-user writes are rejected at the database level.
- The `<Toaster />` is mounted in the root layout and toasts are visible on the compare page.

## Open Questions

- Should saved products/comparisons be surfaced anywhere in the UI yet (e.g., a saved items page), or is this feature purely write-only for now? Write only for now, ui later.

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Save product button is not rendered when user is unauthenticated.
- Save product button is rendered when user is authenticated and a product is loaded.
- Save comparison button is not rendered for fewer than 2 products.
- Save comparison button is rendered when 2 or more products are loaded and user is authenticated.
- Clicking save product calls the save handler with the correct `{ name, ean }` arguments.
- Clicking save comparison calls the save handler with the correct `{ name, eans }` arguments, including the correct derived name format.
- Save button shows a spinner while the save is in progress.
- Saving a product with an EAN that already exists shows an "already saved" toast and does not call the Firestore write.
- Saving a comparison with the same set of EANs (order-insensitive) as an existing one shows an "already saved" toast and does not call the Firestore write.
