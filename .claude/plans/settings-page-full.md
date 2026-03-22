# Plan: Settings Page Full

## Context

The settings page (`app/settings/page.tsx`) is currently a minimal stub with only a logout button and no auth protection. This plan fleshes it out into a full settings experience with auth-gating, a sidebar tab layout, account management (display name, password, delete account), and read/manage views for saved products and comparisons pulled from Firestore. The compare page also needs minor updates to support opening saved items in a new tab via URL params.

---

## Step 1 — Add Firestore read helpers (`lib/firestore.ts`)

Add two new exported functions (the existing helpers only write/delete/check; there are no "get all" functions yet):

- `getSavedProducts(uid: string): Promise<SavedProduct[]>` — queries `users/{uid}/products`, returns all docs as `SavedProduct[]`
- `getSavedComparisons(uid: string): Promise<SavedComparison[]>` — queries `users/{uid}/comparisons`, returns all docs as `SavedComparison[]`

Both use `getDocs(collection(db, 'users', uid, '...'))` consistent with the existing Firestore helpers pattern.

---

## Step 2 — Support `?codes=` URL param on compare page (`app/compare/page.tsx`)

The View action in settings opens `/compare?codes=<ean1>,<ean2>,...` in a new tab. The compare page needs to read this param and auto-submit.

Changes:

- Extract the page body into a `ComparePageContent` component that calls `useSearchParams()`
- On mount (via `useEffect`), if the `codes` param is present, set it as the initial input value and auto-trigger `handleSubmit`
- Wrap the default export in a `<Suspense>` boundary (required by Next.js App Router when using `useSearchParams` in a page)

---

## Step 3 — Rewrite settings page (`app/settings/page.tsx`)

Full `'use client'` page. Structure:

### Auth guard

- `const { user, loading } = useAuth()`
- While `loading`: show a spinner / blank state
- If `!user` after loading resolves: `router.push('/login?redirect=/settings')`

### Layout

```
<main>
  <h1>Settings</h1>           ← prominent header
  <div class="flex">
    <nav>                      ← sidebar
      [Account]
      [Nutrients]
      [Products]
      [Comparisons] tab buttons
      <LogOut button>          ← bottom of sidebar
    </nav>
    <section>                  ← content area
      <h2>{activeTab}</h2>     ← subheader
      {tab content}
    </section>
  </div>
</main>
```

Use `useState<'account' | 'nutrients' | 'products' | 'comparisons'>` for active tab.

### Account tab

Three independent sections, each with its own submit button:

1. **Display name** — controlled input + `handleUpdateDisplayName`:
   - Calls `updateProfile(auth.currentUser, { displayName: newName })` (Firebase Auth)
   - Calls `updateDoc(doc(db, 'users', user.id), { displayName: newName })` (Firestore)
   - Validates: non-empty, not just whitespace
   - Shows inline success/error message via Sonner toast

2. **Change password** — three inputs (current, new, confirm new) + `handleChangePassword`:
   - Validates: new === confirm, new !== current
   - `reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(email, currentPw))`
   - `updatePassword(auth.currentUser, newPw)`
   - Shows inline error on wrong current password or Firebase error

3. **Delete account** — inline confirmation:
   - Initially shows "Delete account" button
   - On click: shows "Are you sure?" confirmation text + "Yes, delete" / "Cancel" buttons
   - On confirm: `deleteUser(auth.currentUser)` + optionally delete Firestore user doc
   - Redirect to `/` after deletion

### Nutrients tab

Placeholder text: "Nutrient preferences coming soon."

### Products tab

On tab activation (or on mount when tab is active): `getSavedProducts(user.id)` → `savedProducts` state.

Table using existing `<Table>` component from `components/ui/table.tsx`:

| Name | EAN Code | Actions |
| ---- | -------- | ------- |
| ...  | ...      | `Eye` `SaveOff` |

- **View** (`Eye` icon from lucide-react): `window.open('/compare?codes=' + product.ean, '_blank')`
- **Unsave** (`SaveOff` icon from lucide-react, same as nutrition-table): calls `deleteProduct(user.id, product.ean)`, removes from local state optimistically, shows toast
- Empty state: "No saved products yet."

### Comparisons tab

On tab activation: `getSavedComparisons(user.id)` → `savedComparisons` state.

| Name         | EAN Codes       | Actions |
| ------------ | --------------- | ------- |
| X + Y others | ean1, ean2, ... | `Eye` `SaveOff` |

- Name format: `comparison.name` (already stored as "X + Y others" from compare page's `handleSaveComparison`)
- **View**: `window.open('/compare?codes=' + comparison.eans.join(','), '_blank')`
- **Unsave**: calls `deleteComparison(user.id, comparison.eans)`, removes from local state, shows toast
- Empty state: "No saved comparisons yet."

### Logout button (bottom of sidebar)

```
await signOut(getAuth()); router.push('/');
```

Moves the existing logic from the stub page.

---

## Step 4 — Tests (`tests/settings.test.tsx`)

Mock pattern: same as `save-products-and-comparisons.test.tsx` — `vi.mock` for auth context, Firestore helpers, Firebase auth methods, next/navigation.

Tests:

1. Redirects to `/login` when user is null (after loading completes)
2. Renders "Settings" header and four sidebar tab buttons when authenticated
3. Switching tabs renders the correct subheader
4. Account tab renders display name input, password section, and delete account button
5. Products tab: calls `getSavedProducts`, renders table rows with name and EAN
6. Products tab: shows empty state when `getSavedProducts` returns `[]`
7. Products tab: clicking Unsave calls `deleteProduct` and removes row
8. Comparisons tab: calls `getSavedComparisons`, renders rows with name and EANs
9. Comparisons tab: shows empty state when `getSavedComparisons` returns `[]`
10. Comparisons tab: clicking Unsave calls `deleteComparison` and removes row

---

## Critical files

| File                      | Change                                                              |
| ------------------------- | ------------------------------------------------------------------- |
| `lib/firestore.ts`        | Add `getSavedProducts`, `getSavedComparisons`                       |
| `app/compare/page.tsx`    | Suspense wrapper + `useSearchParams` + auto-submit on `codes` param |
| `app/settings/page.tsx`   | Full rewrite                                                        |
| `tests/settings.test.tsx` | New test file                                                       |

## Verification

1. Run `npm test -- --run tests/settings.test.tsx` — all tests pass
2. Run `npm test -- --run` — no regressions in existing tests
3. Manual: navigate to `/settings` logged out → redirected to `/login`
4. Manual: navigate to `/settings` logged in → full page renders, tabs work, logout works
5. Manual: save a product on compare page → appears in Products tab → View opens new tab at `/compare?codes=<ean>` with product auto-loaded → Unsave removes it
