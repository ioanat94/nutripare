# Spec for email-verification-signup

branch: claude/feature/email-verification-signup

## Summary

When a user creates an account using email and password, they must verify their email address before they can access the app. Until verified, the app should block access and prompt the user to check their inbox. Users who sign in with an already-created but unverified account should also be blocked.

## Functional Requirements

- After a successful email/password signup, Firebase sends a verification email to the user's address automatically.
- After signup (or login with an unverified account), the user is shown a "verify your email" screen instead of the main app.
- The verification screen displays the email address the link was sent to and instructs the user to check their inbox.
- The verification screen includes a "Resend verification email" button, with rate-limiting feedback (e.g. a cooldown or success message after clicking).
- The verification screen includes a "I've verified my email" / "Refresh" button that re-checks the user's verification status without requiring a full page reload.
- The verification screen includes a "Sign out" option so the user can switch accounts.
- Once the user's email is verified and they click refresh, they are immediately taken into the app.
- Users who sign in with Google (or other OAuth providers) are not affected — verification only applies to email/password accounts.
- If a user is already verified (returning user), they proceed to the app as normal with no interruption.

## Possible Edge Cases

- User verifies their email in another tab or browser window — clicking refresh on the verification screen should pick this up.
- User tries to navigate directly to app routes while unverified — they should be redirected to the verification screen.
- Resend email fails (e.g. Firebase rate limit) — show an appropriate error message.
- User signs out from the verification screen and then signs back in — they should still see the verification screen if still unverified.
- User closes the app before verifying and returns later — on next login, they should land on the verification screen again.
- Email link is expired or already used — Firebase handles this, but the UI should still prompt the user to resend if they are still unverified.

## Acceptance Criteria

- A new email/password signup always triggers a verification email before granting app access.
- An unverified user cannot access any protected page (compare, settings, etc.).
- The verification screen is shown immediately after signup and on any subsequent login while unverified.
- The resend button sends a new verification email and confirms success or shows an error.
- The refresh/check button updates verification state without a full reload.
- Verified users and OAuth users are never shown the verification screen.
- Signing out from the verification screen works and redirects to the login page.

## Open Questions

- Should the verification email use Firebase's default template, or do we need a custom branded template? Default
- Should there be a timeout or expiry for how long the user can remain on the verification screen before being signed out automatically? Nah
- Should unverified users be able to access the home/landing page (`/`), or only be blocked from authenticated routes? They can access unauthenticated routes.

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Renders the verification screen (not the app) when the logged-in user's email is not verified.
- Does not render the verification screen for OAuth users (emailVerified is true by default).
- Does not render the verification screen for already-verified email/password users.
- Resend button calls the appropriate Firebase method and shows a success message.
- Refresh/check button re-reads verification state and proceeds to the app when verified.
- Sign out button on the verification screen triggers sign-out and redirects to login.
