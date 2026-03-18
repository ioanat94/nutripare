# Plan: Email/Password Sign Up Mode

## Context

The login screen supports email/password sign-in and Google OAuth but has no sign-up path for email/password. New users can only register via Google. This feature adds a sign-up mode to the existing auth screen so email/password users can create accounts, with a toggle link between modes following standard industry UX.

The `SignInAuthForm` already accepts an optional `onSignUpClick` prop that renders the "Don't have an account?" link — we just need to wire it up.

The `AuthProvider` (`contexts/auth-context.tsx`) already creates the Firestore user document on first `onAuthStateChanged` fire, so sign-up only needs to call Firebase Auth's `createUserWithEmailAndPassword`; Firestore provisioning is automatic.

---

## Critical Files

| File | Action |
|---|---|
| `components/sign-in-auth-screen.tsx` | Modify — add mode state, pass `onSignUpClick`, switch rendered form |
| `components/sign-in-auth-form.tsx` | Read-only — already has `onSignUpClick` prop wired |
| `components/sign-up-auth-form.tsx` | Create — new sign-up form with email, password, confirm password |
| `app/login/page.tsx` | Read-only or minor — already uses `SignInAuthScreen`, no change needed if screen manages mode |
| `lib/firebase.ts` | Read-only — `auth` already exported |
| `tests/sign-up-auth-form.test.tsx` | Create — unit tests for new form component |

---

## Implementation Steps

### 1. Create `components/sign-up-auth-form.tsx`

New component, mirroring the structure of `sign-in-auth-form.tsx`.

- **Schema (zod):** `{ email: string, password: string, confirmPassword: string }` — validate that `confirmPassword === password` with a `.refine()`; password min length 6 (Firebase minimum).
- **Submission:** Call `createUserWithEmailAndPassword(auth, email, password)` from `firebase/auth`.
- **Error mapping:** Map Firebase error codes to user-friendly messages:
  - `auth/email-already-in-use` → "An account with this email already exists."
  - `auth/weak-password` → "Password must be at least 6 characters."
  - fallback → raw error message
- **Callbacks:**
  - `onSignIn?(credential: UserCredential): void` — fires on success; `AuthProvider` handles Firestore from here.
  - `onSignInClick?(): void` — renders "Already have an account? Sign in" link.
- **Submit button label:** "Sign Up"
- **Reuse:** `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` from `components/ui/form.tsx`; `Input` and `Button` from shadcn; `useUI()` from `@firebase-oss/ui-react` for the loading state.

### 2. Modify `components/sign-in-auth-screen.tsx`

Add `'signIn' | 'signUp'` mode state (default `'signIn'`).

- Pass `onSignUpClick={() => setMode('signUp')}` to `SignInAuthForm`.
- When mode is `'signUp'`, render `SignUpAuthForm` with `onSignInClick={() => setMode('signIn')}` and `onSignIn={onSignIn}`.
- Update `CardTitle` to reflect the current mode ("Sign In" / "Sign Up") — use a simple ternary, no translation lookup needed.
- The `children` slot (Google button + separator) renders in **both** modes unchanged.
- Reset mode to `'signIn'` is not required on sign-out (screen is only shown to unauthenticated users).

### 3. No changes to `app/login/page.tsx`

The login page already renders `<SignInAuthScreen onSignIn={...}><GoogleSignInButton /></SignInAuthScreen>`. Since mode is managed inside the screen component, the page needs no changes.

---

## Testing (`tests/sign-up-auth-form.test.tsx`)

Mock `firebase/auth` (`createUserWithEmailAndPassword`) and `@firebase-oss/ui-react` (`useUI`).

Tests to write:

1. Renders email, password, and confirm-password fields plus a "Sign Up" button.
2. "Already have an account? Sign in" link calls `onSignInClick`.
3. Submitting with mismatched passwords shows a validation error without calling Firebase.
4. Submitting with valid inputs calls `createUserWithEmailAndPassword` with the correct email and password.
5. Firebase `auth/email-already-in-use` error displays a user-friendly message.
6. Firebase `auth/weak-password` error displays a user-friendly message.

---

## Verification

1. Run `npm test -- --run` — all tests must pass.
2. Run `npm run dev` and navigate to `/login`:
   - Clicking "Don't have an account?" switches to sign-up mode.
   - Title changes to "Sign Up", button label to "Sign Up".
   - "Already have an account?" switches back.
   - Google button present in both modes.
   - Sign up with a new email/password → redirected, user doc created in Firestore.
   - Sign up with an existing email → error message shown.
   - Sign up with a short password → error message shown.
   - Sign up with mismatched passwords → error shown before Firebase is called.
