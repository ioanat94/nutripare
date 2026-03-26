# Plan: Pre-Deployment Security and Error Handling Fixes

## Context

A deployment readiness audit surfaced six issues to fix before going live: an open redirect vulnerability in the login page, a silent API proxy that forwards upstream errors as successes, missing error/404 pages, settings tabs that silently hang forever if Firestore fails, and a blank screen during auth resolution on the settings page.

---

## 1. Fix open redirect — `app/login/page.tsx`

Add a `safeRedirect` helper inline in the file:

```
function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}
```

Replace the current `const redirect = searchParams.get('redirect') ?? '/'` with:

```
const redirect = safeRedirect(searchParams.get('redirect'));
```

The `redirect` variable is already used in 3 places (`router.replace`, `window.location.href`, `router.push`) — no other changes needed since they already reference the same variable.

---

## 2. Harden the API proxy — `app/api/product/[code]/route.ts`

Wrap the fetch in a try/catch, check `res.ok`, and handle OpenFoodFacts `status: 0`:

```
export async function GET(...) {
  const { code } = await params;
  const url = `...`;
  try {
    const res = await fetch(url, { ... });
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
    }
    const data = await res.json();
    if (data.status === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 502 });
  }
}
```

---

## 3. Add error boundary — new `app/error.tsx`

Next.js error boundaries require `"use client"`. Props are `{ error: Error & { digest?: string }; reset: () => void }`. Per the spec, show a "Go home" link only (no reset button).

```tsx
'use client';
import Link from 'next/link';

export default function Error() {
  return (
    <main className='flex flex-1 flex-col items-center justify-center gap-4 text-center'>
      <h1 className='text-2xl font-bold'>Something went wrong</h1>
      <p className='text-muted-foreground'>An unexpected error occurred.</p>
      <Link href='/' className='...button styles...'>Go home</Link>
    </main>
  );
}
```

Use the existing `buttonVariants` helper from `@/components/ui/button` for button styling.

---

## 4. Add 404 page — new `app/not-found.tsx`

No `"use client"` needed. Same layout pattern as `error.tsx`:

```tsx
import Link from 'next/link';
export default function NotFound() {
  return (
    <main className='flex flex-1 flex-col items-center justify-center gap-4 text-center'>
      <h1 className='text-2xl font-bold'>Page not found</h1>
      <p className='text-muted-foreground'>...</p>
      <Link href='/'>Go home</Link>
    </main>
  );
}
```

---

## 5. Fix silent Firestore failures in settings tabs

All three tabs follow the same pattern. Add `.catch()` to each initial data fetch useEffect and call `setLoading(false)` so the tab doesn't hang. Pattern to apply:

**`components/settings/products-tab.tsx`** (line 28):
```ts
getSavedProducts(userId).then((data) => {
  setProducts(data);
  setLoading(false);
}).catch(() => {
  toast.error('Failed to load products');
  setLoading(false);
});
```

**`components/settings/comparisons-tab.tsx`**: same — `toast.error('Failed to load comparisons')`

**`components/settings/nutrition-tab.tsx`**: same — `toast.error('Failed to load nutrition settings')`

- `toast` is already imported from `'sonner'` in all three files.
- `setLoading` is already defined in all three files.

---

## 6. Replace blank settings loading state — `app/settings/[[...tab]]/page.tsx`

Replace `if (loading || !user || !emailVerified) return null;` with a spinner:

```tsx
if (loading || !user || !emailVerified) {
  return (
    <div className='flex flex-1 items-center justify-center'>
      <Loader2 className='size-6 animate-spin text-muted-foreground' />
    </div>
  );
}
```

Add `Loader2` to the existing `lucide-react` import. This matches the pattern used in `app/compare/page.tsx` lines 356-360.

---

## Critical files

| File | Change |
|------|--------|
| `app/login/page.tsx` | Add `safeRedirect` helper, sanitise redirect param |
| `app/api/product/[code]/route.ts` | try/catch + `res.ok` check + `status: 0` check |
| `app/error.tsx` | New file — error boundary page |
| `app/not-found.tsx` | New file — 404 page |
| `components/settings/products-tab.tsx` | Add `.catch()` to initial fetch |
| `components/settings/comparisons-tab.tsx` | Add `.catch()` to initial fetch |
| `components/settings/nutrition-tab.tsx` | Add `.catch()` to initial fetch |
| `app/settings/[[...tab]]/page.tsx` | Replace `return null` with Loader2 spinner |

---

## Tests to write

**`tests/login-redirect.test.tsx`**
- Valid relative URL (`/compare`) passes through unchanged
- External URL (`https://evil.com`) falls back to `/`
- Protocol-relative URL (`//evil.com`) falls back to `/`
- Empty string / null falls back to `/`

**`tests/api-product-proxy.test.ts`**
- Returns 502 when upstream fetch throws
- Returns 502 when `res.ok` is false
- Returns 404 when `data.status === 0`
- Returns 200 with data on success

---

## Verification

1. Run `npm test -- --run` — all existing tests should still pass, new tests should pass
2. Manually visit `/login?redirect=https://evil.com`, sign in → should land on `/` not the external URL
3. Visit `/does-not-exist` → custom not-found page
4. Temporarily throw in a page component → custom error page
5. Dev tools: Network tab shows `/api/product/bad-code` returns 404, not 200
