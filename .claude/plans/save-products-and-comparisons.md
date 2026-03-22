# Plan: Save Products and Comparisons

## Context

Users currently have no way to persist products or comparisons they find on the compare page. This feature adds Firestore-backed save functionality for both individual products and full comparisons, restricted to authenticated users. The security boundary is Firestore Security Rules (server-side), not just client-side auth checks.

---

## Step 1 — Install Sonner

Run `npx shadcn@latest add sonner` to install the shadcn Sonner toast component.

---

## Step 2 — Update Firestore Types (`types/firestore.ts`)

Replace the current flat-array schema with subcollection-friendly types:

```typescript
export interface FirestoreUser {
  id: string;
  displayName: string;
  // products and comparisons are now subcollections, not fields
}

export interface SavedProduct {
  id: string;
  name: string;
  ean: string;
}

export interface SavedComparison {
  id: string;
  name: string;
  eans: string[];
}
```

Remove the old `products: string[]` and `comparisons: string[][]` fields entirely.

---

## Step 3 — Update Auth Context (`contexts/auth-context.tsx`)

When creating a new user document in `setDoc`, remove the `products` and `comparisons` fields (they no longer exist on the user doc). Only store `{ id, displayName }`.

---

## Step 4 — Create Firestore Helper (`lib/firestore.ts`)

New file with two exported async functions:

**`saveProduct(uid, { name, ean })`**
1. Query `users/{uid}/products` where `ean == ean`.
2. If any documents exist → `throw new Error('DUPLICATE')`.
3. Otherwise → `addDoc` to `users/{uid}/products` with `{ name, ean }`.

**`saveComparison(uid, { name, eans })`**
1. Fetch all documents from `users/{uid}/comparisons`.
2. For each existing comparison, sort its `eans` and compare to sorted input `eans`. If an exact match exists → `throw new Error('DUPLICATE')`.
3. Otherwise → `addDoc` to `users/{uid}/comparisons` with `{ name, eans }`.

Use `collection`, `query`, `where`, `getDocs`, `addDoc` from `firebase/firestore`. Import `db` from `@/lib/firebase`.

---

## Step 5 — Update Firestore Security Rules (`firestore.rules`)

Replace the current open rules with auth-scoped rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /products/{productId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /comparisons/{comparisonId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## Step 6 — Update NutritionTable (`components/nutrition-table.tsx`)

**New optional props:**
```typescript
onSaveProduct?: (code: string) => Promise<void>;
onSaveComparison?: () => Promise<void>;
```
These are only passed when the user is authenticated. When absent, no save buttons render.

**Internal state:**
- `savingProduct: string | null` — the product code currently being saved (one at a time per product)
- `savingComparison: boolean` — whether a comparison save is in progress

**Toolbar changes** (product count row):
- When `onSaveComparison` is provided and `products.length >= 2`, render a "Save Comparison" text button next to the product count label.
- While `savingComparison` is true, replace button label with a `Loader2` spinner.

**Product column header changes:**
- When `onSaveProduct` is provided, add a floppy disk icon button (`Save` icon from lucide-react) next to the existing dismiss (X) button.
- While `savingProduct === p.code`, show a `Loader2` spinner instead of the floppy disk icon.

**Button click handlers (inside NutritionTable):**
- `handleSaveProduct(code)`: set `savingProduct = code`, call `await onSaveProduct(code)`, set `savingProduct = null`. No try/catch here — error handling and toasts happen in compare page.
- `handleSaveComparison()`: set `savingComparison = true`, call `await onSaveComparison()`, set `savingComparison = false`.

---

## Step 7 — Update Compare Page (`app/compare/page.tsx`)

Import `useAuth` from `@/contexts/auth-context` and `toast` from `sonner`.
Import `saveProduct` and `saveComparison` from `@/lib/firestore`.

**`handleSaveProduct(code: string)`:**
```
1. Re-check user from useAuth at call time. If null, return early.
2. Find the product in products state by code.
3. name = product.product_name || code
4. try:
     await saveProduct(user.id, { name, ean: code })
     toast.success('Product saved')
   catch (e):
     if e.message === 'DUPLICATE': toast.info('Product already saved')
     else: toast.error('Failed to save product')
```

**`handleSaveComparison()`:**
```
1. Re-check user at call time. If null, return early.
2. firstName = products[0].product_name || products[0].code
3. name = `${firstName} + ${products.length - 1} others`
4. eans = products.map(p => p.code)
5. try:
     await saveComparison(user.id, { name, eans })
     toast.success('Comparison saved')
   catch (e):
     if e.message === 'DUPLICATE': toast.info('Comparison already saved')
     else: toast.error('Failed to save comparison')
```

Pass to `<NutritionTable>`:
- `onSaveProduct={user ? handleSaveProduct : undefined}`
- `onSaveComparison={user ? handleSaveComparison : undefined}`

---

## Step 8 — Add Toaster to Layout (`app/layout.tsx`)

Import `Toaster` from `@/components/ui/sonner` and render it as a sibling of `<Navbar>` inside the layout body. This makes toasts available app-wide.

---

## Step 9 — Write Tests (`tests/save-products-and-comparisons.test.tsx`)

Mock `@/contexts/auth-context` with `vi.mock()` to control `useAuth` return value.
Mock `@/lib/firestore` with `vi.mock()` to spy on `saveProduct`/`saveComparison`.
Mock `sonner` to intercept toast calls.

Test cases:
1. Save product button not rendered when user is unauthenticated (`onSaveProduct` not passed).
2. Save product button rendered when user is authenticated and product is loaded.
3. Save comparison button not rendered for fewer than 2 products.
4. Save comparison button rendered when 2+ products loaded and user is authenticated.
5. Clicking save product calls `onSaveProduct` with the correct EAN.
6. Clicking save comparison calls `onSaveComparison`.
7. Comparison name is formatted as `"<first product name> + <N> others"`.
8. Save product button shows spinner (`Loader2`) while save is in progress.
9. Saving a duplicate product (mock throws `Error('DUPLICATE')`) shows "already saved" toast.
10. Saving a duplicate comparison (mock throws `Error('DUPLICATE')`) shows "already saved" toast.

---

## Verification

1. `npm test -- --run` — all tests pass
2. `npm run lint` — no lint errors
3. `npm run build` — no TypeScript errors
4. Manual: log in, load a product, click floppy disk → "Product saved" toast appears, document visible in Firestore console under `users/{uid}/products`.
5. Manual: load same product again, click save → "Product already saved" toast.
6. Manual: load 2+ products, click "Save Comparison" → "Comparison saved" toast, document in `users/{uid}/comparisons`.
7. Manual: repeat same comparison → "Comparison already saved" toast.
8. Manual: log out, reload compare page → no save buttons visible.
9. Deploy updated `firestore.rules` and verify unauthenticated writes are rejected.
