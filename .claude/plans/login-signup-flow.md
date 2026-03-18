# Plan: Login/Signup Flow

## Context

The app has Firebase initialized (`lib/firebase.ts`) and sign-in UI components (`sign-in-auth-screen.tsx`, `sign-in-auth-form.tsx`) from `@firebase-oss/ui-react`, but no auth state management, no Firestore user creation, and no wired login page. This plan connects those pieces and adds auth-aware UI to the Navbar.

## Implementation Order

### 1. `lib/firebase.ts` — Add `auth` and `db` exports

Add `getAuth(app)` exported as `auth` and `getFirestore(app)` exported as `db`. All other files import from here. Keep existing `initializeUI` and `ui` exports unchanged.

Imports to add: `getAuth` from `firebase/auth`, `getFirestore` from `firebase/firestore`.

---

### 2. `types/firestore.ts` — Create User type

Create new file. Export a `FirestoreUser` interface:
- `id: string`
- `displayName: string`
- `products: string[]`
- `comparisons: string[][]`

Name it `FirestoreUser` to avoid collision with Firebase Auth's `User` type in files that import both.

---

### 3. `contexts/auth-context.tsx` — Create AuthProvider + useAuth

New `'use client'` file.

**State:** `user: FirestoreUser | null` (null), `loading: boolean` (true).

**`AuthProvider`:**
- `useEffect` subscribes to `onAuthStateChanged(auth, callback)`. Cleanup unsubscribes.
- Inside callback, when `firebaseUser` is non-null:
  1. Build `docRef = doc(db, 'users', firebaseUser.uid)`.
  2. Call `getDoc(docRef)`. If doc does not exist, call `setDoc(docRef, { id, displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User', products: [], comparisons: [] })`. This two-step approach prevents overwriting user-modified `displayName` on subsequent logins.
  3. Set `user` state to the Firestore data (from snapshot or the written values).
- When `firebaseUser` is null, set `user` to null.
- Set `loading` to false after either branch.

**`useAuth()`:** `useContext` call. Throws if used outside provider.

---

### 4. `app/providers.tsx` — Compose client providers

New `'use client'` file.

Wraps children: `<AuthProvider><FirebaseUIProvider ui={ui}>{children}</FirebaseUIProvider></AuthProvider>`

Import: `AuthProvider` from `@/contexts/auth-context`, `FirebaseUIProvider` from `@firebase-oss/ui-react`, `ui` from `@/lib/firebase`.

---

### 5. `app/layout.tsx` — Wrap with Providers

Server component. Import `Providers` from `@/app/providers`. Change body to:

```
<body className='antialiased'>
  <Providers>
    <Navbar />
    {children}
  </Providers>
</body>
```

`Navbar` must be inside `<Providers>` so it can call `useAuth()`.

---

### 6. `app/login/page.tsx` — Full login page

Convert to `'use client'`. Structure:

- Outer export wraps inner `LoginContent` in `<Suspense>` to satisfy Next.js requirement for `useSearchParams()`.
- `LoginContent` reads `redirect = useSearchParams().get('redirect') ?? '/'`.
- Renders `<SignInAuthScreen onSignIn={() => router.push(redirect)}>` with a `<GoogleSignInButton />` as a child.
- Center the card: outer div with `flex min-h-screen items-center justify-center`.
- If user is already authenticated (from `useAuth()`), redirect to `/` immediately via `useEffect` + `router.replace`.

---

### 7. `components/navbar.tsx` — Add user icon

Already `'use client'`. Changes:

- Import `User` from `lucide-react`, `useRouter` and `usePathname` from `next/navigation`.
- Import `useAuth` from `@/contexts/auth-context`.
- Add user icon `<Button>` to the left of the theme toggle (render it first in the flex row; `justify-end` keeps both icons on the right, user icon left of theme icon).
- Icon color class: `text-foreground` when `user` is null, `text-primary` when non-null. During `loading`, use `text-muted-foreground`.
- `onClick`: if no user → `router.push('/login?redirect=' + encodeURIComponent(pathname))`; if user → `router.push('/settings')`.
- SR label: "Sign in" / "Account settings" depending on state.

---

## Testing

Create `tests/navbar.test.tsx`:
- Navbar renders a user icon button.
- Icon has `text-foreground` class when auth context returns `user: null`.
- Icon has `text-primary` class when auth context returns a mock user.
- Clicking icon while logged out navigates to `/login?redirect=...`.
- Clicking icon while logged in navigates to `/settings`.

Mock `useAuth`, `next/navigation` (`useRouter`, `usePathname`), and `useTheme`.

---

## Critical Files

| File | Action |
|------|--------|
| `lib/firebase.ts` | Modify — add `auth`, `db` exports |
| `types/firestore.ts` | Create — `FirestoreUser` type |
| `contexts/auth-context.tsx` | Create — `AuthProvider`, `useAuth` |
| `app/providers.tsx` | Create — compose providers |
| `app/layout.tsx` | Modify — wrap with `<Providers>` |
| `app/login/page.tsx` | Modify — full login UI + redirect |
| `components/navbar.tsx` | Modify — user icon with auth state |
| `tests/navbar.test.tsx` | Create — auth icon tests |
