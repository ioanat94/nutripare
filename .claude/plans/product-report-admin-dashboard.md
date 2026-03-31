# Plan: Product Data Reporting and Admin Dashboard

## Context

Users currently have no way to flag incorrect or missing product data from OpenFoodFacts. This feature adds:

- A manual "Report" option in per-product dropdowns (incorrect data)
- A silent automatic report when a product barcode search returns no result (missing product)
- An admin-only dashboard to review, filter, and dismiss reports

Reports are stored as top-level Firestore documents in a `reports/{code}` collection (code = document ID for deduplication). All writes go through a server-side API route with IP rate limiting. Firestore security rules are the real access guard.

---

## Key Files to Read Before Implementing

- `app/compare/page.tsx` — owns `notFoundCodes` state; `runSearch` (lines ~130–164) and `handleScan` (lines ~305–321) are the two not-found entry points; AlertDialog for save comparison is the existing dialog pattern to follow
- `components/nutrition-table.tsx` — per-product `DropdownMenu` at lines ~425–528; `NutritionTableProps` interface at lines 64–81; `p.code` is available in scope for the "Report" item
- `components/ui/alert-dialog.tsx` — the project's only dialog primitive (wraps `@base-ui/react/dialog`); use this, not a new Dialog component
- `components/ui/dropdown-menu.tsx` — wraps `@base-ui/react/menu`; supports `DropdownMenuSub` + `DropdownMenuSubTrigger` + `DropdownMenuSubContent` for the dismiss sub-menu in admin
- `lib/firestore.ts` — all Firestore helpers; add report helpers here following the same async pattern
- `types/firestore.ts` — add `Report`, `ReportStatus`, `ReportReason` types here
- `app/api/product/[code]/route.ts` — reference for Next.js route handler pattern (`NextResponse.json`, async params)

---

## Implementation Steps

### 1. Add types — `types/firestore.ts`

Add to the bottom of the file:

```ts
export type ReportStatus = 'open' | 'solved' | 'dismissed';
export type ReportReason = 'incorrect data' | 'missing product';
export interface Report {
  code: string;
  date: Timestamp; // from firebase/firestore
  reason: ReportReason;
  status: ReportStatus;
}
```

Import `Timestamp` from `firebase/firestore`.

---

### 2. Add Firestore helpers — `lib/firestore.ts`

Add two admin-only helpers at the bottom (operate on top-level `reports` collection, not nested under `users/`):

```ts
getAllReports(): Promise<Report[]>
// getDocs(collection(db, 'reports')), map each doc to { code: d.id, ...d.data() }

updateReportStatus(code: string, status: ReportStatus): Promise<void>
// updateDoc(doc(db, 'reports', code), { status })
```

---

### 3. Create `lib/reports.ts` — client-side submit helper

Single exported function used by the compare page:

```ts
submitReport(code: string, reason: ReportReason): Promise<void>
// fetch('POST /api/report', { body: JSON.stringify({ code, reason }) })
// no error thrown — always resolves (rate-limited responses are silent 200s)
```

---

### 4. Create `app/api/report/route.ts` — POST handler

- **In-memory rate limiting:** `Map<string, { count: number; windowStart: number }>`, max 25 requests/hour/IP. Extract IP from `x-forwarded-for` (first value) or `x-real-ip`. Always return `200 { success: true }` even when rate-limited.
- **Parse body:** `{ code: string; reason: ReportReason }`. Validate `code` against `/^\d{8}(\d{5})?$/` (EAN-8 or EAN-13) — return 400 on invalid, but still silently succeed to the client (don't leak validation errors — actually return silent 200 for UX per spec).
- **Deduplication logic** (using `getDoc(doc(db, 'reports', code))`):
  - Doc doesn't exist → `setDoc` with `{ code, date: serverTimestamp(), reason, status: 'open' }`
  - Doc exists, `status === 'open'` → do nothing
  - Doc exists, `status === 'solved'` or `'dismissed'` → `setDoc` (overwrite) to reopen
- **Firebase:** import `db` from `@/lib/firebase`, use `firebase/firestore` (`getDoc`, `setDoc`, `doc`, `serverTimestamp`). The client SDK works in Next.js Route Handlers (Node runtime).

---

### 5. Update `components/nutrition-table.tsx`

- Add `onReport?: (code: string) => void` to the `NutritionTableProps` interface (lines ~64–81).
- In the per-product dropdown (lines ~489–527), add a new `DropdownMenuItem` above the `<DropdownMenuSeparator />`:
  - Icon: `Flag` from lucide-react, with warning color classes (`text-warning focus:text-warning`)
  - Label: "Report"
  - `onClick`: calls `onReport?.(p.code)`

---

### 6. Update `app/compare/page.tsx`

**New state:**

```ts
const [reportCode, setReportCode] = useState<string | null>(null);
```

**New handler:**

```ts
function handleReport(code: string) {
  setReportCode(code);
}
```

**Dialog** (add near the existing AlertDialog for save comparison):

```tsx
<AlertDialog
  open={reportCode !== null}
  onOpenChange={(open) => {
    if (!open) setReportCode(null);
  }}
>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Report product data</AlertDialogTitle>
      <AlertDialogDescription>
        Report missing or incorrect product data? Your report is anonymous.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <Button variant='outline' onClick={() => setReportCode(null)}>
        Cancel
      </Button>
      <Button
        variant='warning'
        onClick={async () => {
          if (reportCode) await submitReport(reportCode, 'incorrect data');
          setReportCode(null);
        }}
      >
        Confirm
      </Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Not-found silent report** — in `runSearch` after `setNotFoundCodes(notFound)`, and in `handleScan` after `setNotFoundCodes([code])`:

```ts
notFound.forEach((code) =>
  submitReport(code, 'missing product').catch(() => {}),
);
// or for single code in handleScan:
submitReport(code, 'missing product').catch(() => {});
```

**Wire to table:**

```tsx
<NutritionTable ... onReport={handleReport} />
```

---

### 7. Create `app/admin/page.tsx` — Admin dashboard

**Architecture:** `'use client'` component. Uses `useAuth()` from `@/contexts/auth-context`. No admin UID is stored in any env var or client bundle. Instead, the page attempts to call `getAllReports()` once auth has resolved. If Firestore returns a permission error (non-admin or unauthenticated), the catch block redirects to `/`. Firestore security rules are the security boundary — enforced server-side by Google, not bypassable from the client.

**State:**

```ts
reports: Report[]           // all reports, loaded once
filter: ReportStatus | 'all'
page: number
```

**Page size:** 25 (constant).

**Layout:**

- Show loading spinner while `loading === true` (auth not yet resolved)
- In `useEffect` (runs when `loading === false`): call `getAllReports()`. On permission error → `router.replace('/')`. On success → `setReports(data)`.
- Header: "Admin — Product Reports"
- Filter row: 4 buttons or Tabs (All / Open / Solved / Dismissed) showing counts
- Table: Code | Date | Reason | Status | Action
  - Date formatted with `toLocaleDateString()`
  - Status: small badge with color (`open` → warning, `solved` → positive, `dismissed` → muted)
  - Action: `DropdownMenu` with `DropdownMenuSub` for "Dismiss" → sub-items "Solved" and "False Report"
- Pagination: Previous / Next buttons, "Page X of Y" label
- Load reports with `getAllReports()` in a `useEffect` (after auth confirmed)

**Dismiss handler:**

```ts
async function handleDismiss(code: string, status: 'solved' | 'dismissed') {
  await updateReportStatus(code, status);
  setReports((prev) =>
    prev.map((r) => (r.code === code ? { ...r, status } : r)),
  );
}
```

Optimistic UI update — no page reload needed.

---

### 8. Firestore Security Rules (document in the plan, not code)

The admin must add these rules to the Firebase console:

```
match /reports/{code} {
  allow create: if true;                          // anyone can submit
  allow read, update: if request.auth != null
    && request.auth.uid == '<ADMIN_UID>';         // only admin can read/update
  allow delete: if false;                         // never delete
}
```

Replace `<ADMIN_UID>` with the actual Firebase UID.

---

## Files Created / Modified Summary

| Action      | Path                             |
| ----------- | -------------------------------- |
| Add types   | `types/firestore.ts`             |
| Add helpers | `lib/firestore.ts`               |
| Create      | `lib/reports.ts`                 |
| Create      | `app/api/report/route.ts`        |
| Modify      | `components/nutrition-table.tsx` |
| Modify      | `app/compare/page.tsx`           |
| Create      | `app/admin/page.tsx`             |
| Create      | `tests/report.test.tsx`          |

---

## Tests — `tests/report.test.tsx`

Mock `@/lib/reports` (submitReport), `@/lib/firestore` (getAllReports, updateReportStatus), `@/contexts/auth-context` (useAuth).

Tests:

1. "Report" dropdown item renders with warning color class in per-product dropdown
2. Clicking "Report" opens the AlertDialog with the correct message text
3. Clicking "Cancel" closes dialog without calling `submitReport`
4. Clicking "Confirm" calls `submitReport(code, 'incorrect data')` and closes dialog
5. When `fetchProduct` returns null, `submitReport` is called with `reason: 'missing product'`
6. Admin page redirects to `/` for non-admin user (user.id !== ADMIN_UID)
7. Admin page renders report list for admin user
8. Clicking "Solved" calls `updateReportStatus(code, 'solved')`
9. Clicking "False Report" calls `updateReportStatus(code, 'dismissed')`
10. Status filter shows only matching reports

---

## Verification

1. `npm run dev` — navigate to `/compare`, search a valid EAN, open product dropdown, verify "Report" item appears in warning color at the bottom above the separator
2. Click "Report" — verify dialog appears with correct text; Cancel closes it; Confirm calls the API route
3. Search an invalid/missing EAN — verify the existing not-found warning appears unchanged; check Firestore console for a new document in `reports` collection
4. Navigate to `/admin` as non-admin → should redirect to `/`
5. Navigate to `/admin` as admin → see report list; test filter tabs; test dismiss sub-menu
6. `npm test -- --run tests/report.test.tsx`
