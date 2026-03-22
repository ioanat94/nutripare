# Spec for Settings Page Full

branch: claude/feature/settings-page-full

## Summary

Flesh out the settings page with auth protection, a sidebar layout, and four tabs: Account, Nutrients, Products, and Comparisons. The Account tab handles profile and credential management. Products and Comparisons tabs display the user's saved data with view/unsave actions. A logout button is accessible from the page.

## Functional Requirements

- The settings page is only accessible to authenticated users; unauthenticated users are redirected to the login page.
- The page has a prominent "Settings" header.
- The page layout includes a sidebar with four tabs: Account, Nutrients, Products, Comparisons.
- Each tab has its own subheader displaying the section name.
- A logout button is present on the page (e.g., in the sidebar or header area).

### Account tab

- User can update their display name.
- User can change their password by providing current password, new password, and confirm new password fields.
- User can delete their account (with appropriate confirmation).

### Nutrients tab

- Empty for now (placeholder content or empty state).

### Products tab

- Displays a table of all saved products with columns: Name, EAN Code, Actions.
- Each row has a View action (eye icon) that navigates to the compare page and pre-loads/searches that product.
- Each row has an Unsave action (unsave icon) that removes the product from saved products.

### Comparisons tab

- Displays a table of all saved comparisons with columns: Name, EAN Codes, Actions.
- Comparison name is shown as "X + Y others" where X is the first product name and Y is the count of remaining products.
- EAN Codes column lists the codes for all products in the comparison.
- Each row has a View action (eye icon) that navigates to the compare page and pre-loads all products in the comparison.
- Each row has an Unsave action that removes the comparison from saved comparisons.

## Possible Edge Cases

- User has no saved products or comparisons — empty state message should be shown in the respective tables.
- Password change fails (wrong current password, weak new password, mismatch) — appropriate error messages shown inline.
- Account deletion should require explicit confirmation to prevent accidental deletion.
- Display name update with empty string or whitespace-only value should be rejected.
- New password same as current password should be rejected or warned.

## Acceptance Criteria

- Navigating to `/settings` while logged out redirects to `/login`.
- Navigating to `/settings` while logged in renders the page with "Settings" header and sidebar tabs.
- Clicking each sidebar tab shows the correct section with its subheader.
- Account tab: submitting a valid new display name updates it and shows a success message.
- Account tab: submitting a password change with incorrect current password shows an error.
- Account tab: submitting a password change where new and confirm passwords don't match shows an error.
- Account tab: deleting account requires confirmation before proceeding.
- Products tab: saved products are listed in a table; each row has functional View and Unsave actions.
- Products tab: clicking View navigates to the compare page with that product loaded.
- Products tab: clicking Unsave removes the product from the list.
- Products tab: empty state is shown when there are no saved products.
- Comparisons tab: saved comparisons are listed in a table with correct name and EAN codes.
- Comparisons tab: clicking View navigates to the compare page with all products in the comparison loaded.
- Comparisons tab: clicking Unsave removes the comparison from the list.
- Comparisons tab: empty state is shown when there are no saved comparisons.
- Logout button logs the user out and redirects to the login page.

## Open Questions

- Where exactly should the logout button live — bottom of the sidebar, or in the page header? bottom of sidebar
- Should display name and password changes auto-save or require a submit button per section? Submit button
- Should account deletion be a modal confirmation or an inline confirmation flow? Inline
- For the Products View action, should it open in the same tab or a new tab? New tab
- Should the Comparisons View action clear any existing items on the compare page before loading the saved comparison? It should open the search in a new tab, thus it would be a brand new search with no preexisting codes

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Settings page redirects unauthenticated users to `/login`.
- Settings page renders "Settings" header and all four sidebar tabs when authenticated.
- Switching tabs renders the correct section subheader.
- Account tab renders display name, password change, and delete account sections.
- Products tab renders a table with saved products, including Name, EAN Code, and Actions columns.
- Products tab shows an empty state when there are no saved products.
- Unsaving a product from the Products tab removes it from the list.
- Comparisons tab renders a table with saved comparisons including correct name format and EAN codes.
- Comparisons tab shows an empty state when there are no saved comparisons.
- Unsaving a comparison from the Comparisons tab removes it from the list.
