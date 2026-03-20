# Spec for barcode-scanning

branch: claude/feature/barcode-scanning

## Summary

Add barcode scanning functionality to the compare page, allowing users to scan product barcodes using their device camera. When a barcode is scanned, the app immediately looks up the product and adds it to the comparison table. This feature should work in both desktop and mobile browsers using the `html5-qrcode` library.

## Functional Requirements

- Add a barcode icon button immediately to the right of the "Look Up" button on the compare page
- The button contains only a barcode icon (no text label)
- Clicking the button opens a barcode scanner modal/overlay with a live camera feed
- The scanner supports both desktop webcams and mobile rear-facing cameras
- Upon a successful scan, the scanner closes automatically and the scanned barcode (EAN/UPC code) is used to look up the product
- If no product is currently in the comparison table, the scanned product is loaded as the first item
- If one or more products are already in the table, the scanned product is appended as a new column
- The scanner can also be dismissed manually (e.g. via a close button or pressing Escape) without triggering a search
- The `html5-qrcode` library (https://github.com/mebjas/html5-qrcode) is used for all camera/scanning functionality

## Possible Edge Cases

- User denies camera permission — display a clear error message within the scanner UI
- Barcode is scanned but the product is not found in the data source — handle identically to a failed manual "Look Up" search
- The same barcode is scanned twice — the product should not be added as a duplicate column
- Scanner is opened on a device with multiple cameras (e.g. front and rear) — default to rear-facing camera on mobile
- Browser does not support camera access (e.g. insecure non-HTTPS context) — disable the button or show an informative message
- html5-qrcode library fails to load or initialize — surface an error without crashing the page

## Acceptance Criteria

- A barcode icon button is visible next to the "Look Up" button on the compare page
- Clicking the button activates the camera and shows a scanning UI
- A successfully scanned barcode triggers an automatic product search without any additional user action
- The scanned product appears in the comparison table immediately after scanning
- Scanning when a product is already in the table does not append a new column
- The scanner works on desktop (webcam) and mobile (rear camera) in a browser environment
- Camera permission denial is communicated to the user via an error state in the scanner UI
- The scanner can be closed without performing a search

## Open Questions

- Should there be a visible scanning target/reticle to guide the user when framing the barcode? Yes (the library probably has a functionality for this)
- Should the scanner enforce a specific barcode format (EAN-13, UPC-A, etc.) or accept any supported format? -> Accept EAN-13 and EAN-8 only. Food products use EAN-13 globally (UPC-A is a subset of EAN-13), and EAN-8 covers smaller packaging. This avoids false positives from QR codes or unrelated barcode types.
- Is there a maximum number of products that can be in the comparison table? If so, should scanning be disabled when the limit is reached? No max.

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Renders the barcode icon button next to the "Look Up" button
- Clicking the barcode button opens the scanner UI
- A mocked successful scan triggers the product search with the scanned code
- The scanner closes after a successful scan
- A close/dismiss action closes the scanner without triggering a search
- When a product is already in the table, a new scan does not append a duplicate product
