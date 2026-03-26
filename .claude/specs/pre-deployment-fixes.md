# Spec for pre-deployment-fixes

branch: claude/feature/pre-deployment-fixes

## Summary

A set of security, reliability, and UX fixes that must be addressed before the app is deployed to production. These were identified during a deployment readiness audit and cover an open redirect vulnerability, missing API error handling, missing error/404 pages, silent async failures in settings tabs, and a blank loading state on the settings page.

## Functional Requirements

- Validate the `?redirect=` query parameter in the login page so that only relative URLs (starting with `/` but not `//`) are accepted; fall back to `/` if the value is invalid
- Add a try/catch and `res.ok` check to the `/api/product/[code]` proxy route; return an appropriate error response (e.g. 502 or 404) instead of forwarding upstream errors silently or throwing
- Add an `app/error.tsx` error boundary page that matches the app's design and provides a "Try again" action
- Add an `app/not-found.tsx` 404 page that matches the app's design and links back to the home page
- Add `.catch()` handlers with user-visible toast notifications to the Firestore calls in the settings tabs (`products-tab`, `comparisons-tab`, `nutrition-tab`) so that failures surface as errors rather than infinite loading states
- Replace the `return null` loading state on the settings page with a visible loading indicator (spinner) so the user knows the page is loading

## Possible Edge Cases

- Redirect param could be an empty string, `//evil.com` (protocol-relative), or a fully-qualified URL — all should fall back to `/`
- OpenFoodFacts API may return a valid JSON body with `status: 0` even on a 200 response — the proxy should handle both HTTP errors and API-level not-found responses
- Firestore errors in settings tabs may happen after partial data has loaded — the error toast should not clear already-loaded data
- The settings page may re-render during auth state transitions — the loading indicator should not flash if auth resolves quickly

## Acceptance Criteria

- Navigating to `/login?redirect=https://evil.com` redirects to `/` after login, not to the external URL
- Navigating to `/login?redirect=/compare` correctly redirects to `/compare` after login
- Requesting `/api/product/invalid-code` returns a non-200 status with a JSON error body rather than a 200 with an error payload or an unhandled exception
- Navigating to a non-existent route (e.g. `/does-not-exist`) shows the custom `not-found.tsx` page
- Simulating a Firestore failure in a settings tab shows a toast error and does not leave the tab in a permanent loading state
- The settings page shows a loading indicator while auth state is resolving instead of a blank screen
- Any unhandled page-level error shows the `error.tsx` page with a recoverable action

## Open Questions

- Should the `error.tsx` page include a "Go home" link in addition to "Try again", or just one of these? Just "go home"
- Should the settings tab error toasts offer a retry action or just inform the user? Just inform

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Login page: redirect param is sanitised — valid relative URLs pass through, external URLs and protocol-relative URLs fall back to `/`
- API proxy route: returns a 502/404 error response when the upstream fetch fails or returns a non-ok status
- API proxy route: returns a 404 when the product is not found (OpenFoodFacts `status: 0`)
