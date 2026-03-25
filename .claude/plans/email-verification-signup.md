# Plan: Email Verification on Signup

## Context

New email/password users currently get full app access immediately after signup — no email verification required. Firebase's `emailVerified` flag exists on the auth user object but is never checked. This plan adds a verification gate: after signup, the user sees a "check your inbox" screen and cannot access protected routes until they click the link in their email. OAuth users (Google) are unaffected because Firebase sets `emailVerified: true` for them automatically.

---

## Files to Modify

| File | Change |
|------|--------|
| `contexts/auth-context.tsx` | Add `emailVerified: boolean` to context value |
| `components/auth-form.tsx` | Call `sendEmailVerification` after signup |
| `app/login/page.tsx` | Show verification screen instead of redirecting when `!emailVerified` |
| `app/settings/[[...tab]]/page.tsx` | Redirect unverified email users to `/login` |

## New File

| File | Purpose |
|------|---------|
| `components/email-verification-screen.tsx` | UI for the verification gate |
| `tests/email-verification.test.tsx` | Tests for the verification screen |

---

## Step-by-Step Implementation

### 1. `contexts/auth-context.tsx`

- Add `emailVerified: boolean` to the `AuthContextValue` interface
- In the `onAuthStateChanged` callback, set `emailVerified = firebaseUser.emailVerified`
- Pass it into the context value
- Default state: `emailVerified: false`

Note: `firebaseUser.emailVerified` is `true` for Google/OAuth users and `false` for newly created email/password accounts. No provider-type detection needed — the flag handles both cases correctly.

### 2. `components/auth-form.tsx`

- Import `sendEmailVerification` from `firebase/auth` and `auth` from `@/lib/firebase`
- After `signUpAction()` resolves (no error thrown), call `sendEmailVerification(auth.currentUser!)` in a try-catch (silently ignore errors — the user can resend from the verification screen)

### 3. `components/email-verification-screen.tsx` (new)

Props: `{ email: string; onSignOut: () => void; onVerified: () => void }`

Renders a centered card (matching app style) with:
- Heading and description telling user to check their inbox
- The email address displayed prominently
- **"Check again"** button: calls `await auth.currentUser?.reload()`, then checks `auth.currentUser?.emailVerified` — if true, calls `onVerified()` to proceed; if false, shows a brief inline message "Not verified yet."
- **"Resend email"** button: calls `sendEmailVerification(auth.currentUser!)`, shows success message and disables the button for 30s to prevent spam
- **"Sign out"** link/button: calls `onSignOut()` which signs out via `signOut(auth)`

Note: `auth.currentUser?.reload()` refreshes the Firebase user object from the server but does **not** trigger `onAuthStateChanged`, so verification must be checked directly on `auth.currentUser.emailVerified` after reload.

### 4. `app/login/page.tsx`

Current behavior: `useEffect([user])` → if `user`, redirect.

New behavior:
- Also consume `emailVerified` from `useAuth()`
- `useEffect([user, emailVerified])` → if `user && emailVerified`, redirect
- Conditionally render: if `user && !emailVerified`, render `<EmailVerificationScreen>` instead of the login form. Pass:
  - `email={auth.currentUser?.email ?? ''}`
  - `onSignOut`: calls `signOut(auth)` (clears context, page reverts to login form)
  - `onVerified`: calls `router.replace(redirect)`

### 5. `app/settings/[[...tab]]/page.tsx`

The existing redirect logic checks `!user`. Extend it to also redirect when `user && !emailVerified`:
```
if (!loading && (!user || !emailVerified)) → router.replace('/login?redirect=/settings')
```

---

## Verification / Test Plan

### Manual test
1. Sign up with a new email → should land on verification screen (not the app)
2. Try navigating to `/settings` while unverified → should redirect to `/login`
3. Click "Resend email" → success message shown, button disabled for 30s
4. Click "Check again" before verifying → "Not verified yet" message
5. Click the link in the email → go back to app, click "Check again" → proceeds into app
6. Sign out from verification screen → lands on login form
7. Sign in with Google → no verification screen, straight to app
8. Sign in with a previously verified email/password account → no verification screen

### Automated tests (`tests/email-verification.test.tsx`)
- Renders verification screen when `user` exists but `emailVerified` is false
- Does NOT render verification screen when `emailVerified` is true (verified user)
- Does NOT render verification screen for OAuth users (`emailVerified` always true)
- "Resend" button calls `sendEmailVerification` and shows success message
- "Check again" button: if `reload()` results in `emailVerified: true`, calls `onVerified`
- "Check again" button: if still unverified, shows "Not verified yet" message
- "Sign out" button calls `signOut`
