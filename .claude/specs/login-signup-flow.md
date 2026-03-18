# Spec for login-signup-flow

branch: claude/feature/login-signup-flow

## Summary

Implement the full login/signup flow. This includes a user icon in the navbar that reflects auth state, a functional login page wired to Firebase Auth, and automatic Firestore user document creation on signup.

## Functional Requirements

- Add a user/person icon to the Navbar, placed to the left of the theme toggle button.
- The icon's color should use the theme's foreground color (white in dark mode, dark in light mode) when the user is logged out, and the theme's primary color when the user is logged in.
- Clicking the icon navigates to `/login` if the user is not authenticated, or to `/settings` if the user is authenticated.
- The login page at `/login` should use the existing Firebase sign-in components (`sign-in-auth-form.tsx`, `sign-in-auth-screen.tsx`) from `./components`.
- Wire the login page fully to Firebase Auth so users can sign in and sign up.
- On successful signup (new user creation), automatically create a document in the Firestore `users` collection with the following fields:
  - `id` — the Firebase Auth UID (string)
  - `displayName` — the user's display name from Auth (string)
  - `products` — empty array of strings
  - `comparisons` — empty array of arrays of strings
- Create a TypeScript type file at `./types/firestore.ts` that defines the `User` type matching the Firestore user document schema.

## Possible Edge Cases

- User icon should reactively update on auth state changes without requiring a page refresh.
- If a Firestore user document already exists for a signing-in user, do not overwrite it.
- Display name may be null for some auth providers — handle gracefully with a fallback (e.g. email prefix).
- The login page should redirect authenticated users away (e.g., to `/`) so they cannot re-visit it unnecessarily.

## Acceptance Criteria

- Navbar displays a user icon to the left of the theme toggle on all pages.
- Icon is in the foreground color when logged out, and primary color when logged in.
- Clicking icon while logged out navigates to `/login`.
- Clicking icon while logged in navigates to `/settings`.
- Login page renders using the existing Firebase sign-in components.
- Signing in with a valid account authenticates the user and redirects them.
- Signing up creates a new Firebase Auth user and a corresponding Firestore document under `users/{uid}`.
- The Firestore user document has `id`, `displayName`, `products`, and `comparisons` fields with correct types.
- `types/firestore.ts` exports a `User` type that matches the Firestore schema.
- No existing Firestore user document is overwritten on subsequent logins.

## Open Questions

- Which auth providers should be supported at launch — email/password only, or also Google/OAuth? Email/password and Google
- Should the login page redirect to the previously visited page after successful auth, or always go to `/`? Previously visited page
- Is `displayName` sourced from the Auth profile, or should users set it themselves later? Start with Auth/email prefix, but there will be a setting which will allow them to change it (implemented later)

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Navbar renders the user icon.
- Icon applies the correct color class when a mock auth state indicates logged-out.
- Icon applies the correct color class when a mock auth state indicates logged-in.
- Clicking the icon while logged out routes to `/login`.
- Clicking the icon while logged in routes to `/settings`.
- The `User` type in `types/firestore.ts` has the expected shape (type-level test or structure assertion).
