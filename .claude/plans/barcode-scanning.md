# Plan: Barcode Scanning

## Context

Users currently look up food products by manually typing EAN codes. This feature adds a camera-based barcode scanner so users can scan product barcodes directly. The scanner uses the `html5-qrcode` library, works on both desktop (webcam) and mobile (rear camera), and integrates with the existing compare-page product lookup flow without changing any of that logic.

---

## Steps

### 1. Install dependency
```
npm install html5-qrcode
```

### 2. Create `components/barcode-scanner.tsx`

A client-side modal overlay that wraps `Html5Qrcode`. Props:
- `onScan(code: string): void` — called immediately on a successful scan
- `onClose(): void` — called when user dismisses without scanning

Behaviour:
- On mount: initialise `Html5Qrcode` attached to a div with id `barcode-scanner-container`, start scanning with `facingMode: 'environment'` (rear camera on mobile, default webcam on desktop)
- Format restriction: `Html5QrcodeSupportedFormats.EAN_13` and `Html5QrcodeSupportedFormats.EAN_8` only
- On successful decode: call `scanner.stop()` then `onScan(decodedText)`
- On camera permission error: show an inline error message (no crash)
- Escape key listener to call `onClose()`
- Close button in the UI to call `onClose()`
- Cleanup on unmount: `scanner.stop()` + `scanner.clear()` (both wrapped in `.catch(() => {})` to silence already-stopped errors)

The scanner renders as a full-screen modal overlay consistent with the app's dark theme.

### 3. Update `app/compare/page.tsx`

- Add `scannerOpen` boolean state (default `false`)
- Add `handleScan(code: string)` async function:
  1. `setScannerOpen(false)` — close modal immediately
  2. `setLoading(true)`
  3. Call `fetchProduct(code)` (already imported)
  4. On success: `setProducts(prev => replaceOrAppend(prev, product))` + `setNotFoundCodes([])`
  5. On null or error: `setNotFoundCodes([code])`
  6. `setLoading(false)`
- Dynamically import `BarcodeScanner` via `next/dynamic(..., { ssr: false })` to prevent SSR from loading the browser-only library
- Add a scan button immediately after the existing "Look Up" submit button (as a sibling `type="button"` inside the form):
  - Uses `ScanBarcode` icon from lucide-react (already imported)
  - Disabled when `loading === true`
  - `onClick={() => setScannerOpen(true)}`
- Render `{scannerOpen && <BarcodeScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />}` below the form
- The existing `ScanBarcode` icon in the input prefix can remain as-is

### 4. Create `tests/barcode-scanner.test.tsx`

Mock strategy: `vi.mock('html5-qrcode')` with a fake `Html5Qrcode` class whose `start` method resolves and whose `stop`/`clear` methods resolve. The `onScan` callback is captured from the `start` call so tests can trigger it manually. Mock `next/dynamic` to return the real `BarcodeScanner` synchronously.

Tests:
- Renders the barcode icon button next to "Look Up" (on the compare page)
- Clicking the barcode button shows the scanner UI
- A mocked successful scan calls `fetchProduct` with the scanned code
- The scanner UI is no longer visible after a successful scan
- Clicking the close button hides the scanner without calling `fetchProduct`
- Scanning a product already in the table updates (not duplicates) it — verified via `replaceOrAppend` behaviour

---

## Files Modified
- `app/compare/page.tsx` — add scan button, `scannerOpen` state, `handleScan`, dynamic import
- `components/barcode-scanner.tsx` — new file
- `tests/barcode-scanner.test.tsx` — new test file

## Reused
- `fetchProduct` from `@/lib/openfoodfacts` — unchanged
- `replaceOrAppend` helper in compare page — unchanged, handles deduplication already
- `ScanBarcode` icon from lucide-react — already imported

## Verification
1. `npm test -- --run tests/barcode-scanner.test.tsx` — all tests pass
2. `npm run build` — no SSR errors from html5-qrcode
3. Manual: open `/compare`, click scan button, camera activates, scan an EAN-13 barcode on food packaging → product appears in table; scan a second product → new column added; scan same product again → no duplicate column
4. Mobile: verify rear camera is used by default
