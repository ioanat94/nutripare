# Spec for email-password-sign-up

branch: claude/feature/email-password-sign-up

## Summary

The current login screen supports email/password sign-in and Google OAuth, but has no dedicated sign-up flow for email/password users. New users who want to register with an email and password have no way to do so. This feature adds a "sign up" mode to the existing auth screen, allowing users to toggle between sign-in and sign-up, following standard industry UX patterns.

## Functional Requirements

- The auth screen defaults to "sign in" mode.
- A prompt below the email/password inputs (e.g. "Don't have an account? Sign up") lets the user switch to "sign up" mode.
- In "sign up" mode, the form collects email and password and creates a new Firebase Auth account.
- A corresponding prompt in "sign up" mode (e.g. "Already have an account? Sign in") lets the user switch back.
- On successful sign-up, the user is authenticated and redirected the same way as after sign-in.
- The Google sign-in button remains available in both modes.
- The form title and submit button label update to reflect the current mode ("Sign In" vs "Sign Up").
- Validation errors (e.g. email already in use, weak password) are surfaced to the user in the existing error message area.

## Possible Edge Cases

- Email already registered: Firebase returns `auth/email-already-in-use` — show a user-friendly message.
- Weak password: Firebase returns `auth/weak-password` — surface the constraint to the user.
- Sign-up succeeds but Firestore user document creation fails — the auth account exists but the app profile may be incomplete; the `onAuthStateChanged` handler in `AuthProvider` already handles creating the Firestore document on first sign-in, so this should be covered automatically.
- User toggles between modes after partially filling the form — inputs should retain their values.

## Acceptance Criteria

- Clicking "Don't have an account? Sign up" switches the form to sign-up mode and updates the title and submit label.
- Clicking "Already have an account? Sign in" switches back to sign-in mode.
- Submitting the sign-up form with a valid email/password creates a new Firebase Auth user and redirects the user.
- Submitting the sign-up form with an already-registered email shows a clear error message.
- Submitting the sign-up form with a password that is too short/weak shows a clear error message.
- The Google sign-in button is visible and functional in both modes.
- The sign-in flow is unchanged in behaviour and appearance.

## Open Questions

- Should sign-up require a display name field, or derive it from the email prefix as the `AuthProvider` currently does? Derive it.
- Should there be a password confirmation field on sign-up, or is a single password field sufficient? It should have password confirmation.

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- The toggle link renders in sign-in mode and switches to sign-up mode on click.
- The toggle link renders in sign-up mode and switches back to sign-in mode on click.
- The form title and submit button label reflect the current mode.
- Submitting the sign-up form calls the Firebase `createUserWithEmailAndPassword` function.
- A Firebase `auth/email-already-in-use` error is displayed to the user.
- A Firebase `auth/weak-password` error is displayed to the user.
