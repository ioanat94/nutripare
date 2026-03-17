# Plan: Landing Page Feature Showcase

## Context

The home page (`/`) is currently a minimal stub with a heading and a paragraph. This plan replaces it with a proper landing page that communicates what Nutripare does, showcases its core features in a card grid, lists account-only benefits, and drives users to `/compare` via a prominent CTA.

Header/nav is explicitly out of scope (to be handled as a separate layout component).

---

## Files to Modify / Create

| Action      | Path                  |
| ----------- | --------------------- |
| **Replace** | `app/page.tsx`        |
| **Create**  | `tests/home.test.tsx` |

No new components or dependencies needed. `lucide-react` and the existing `Button` component (`components/ui/button.tsx`) cover everything required. Cards will use plain Tailwind classes (no additional shadcn install).

---

## Page Structure

### 1. Hero Section

- Large, bold headline — creative and punchy. Suggested first pass: **"Know what you're eating. Actually."**
- One-liner subheading: plain description of the app ("Scan or enter a barcode, and get clear nutritional info in seconds.")
- Single CTA `Button` (variant `default`, size `lg`) with text like **"Start comparing →"** linking to `/compare` via Next.js `<Link>`
- One placeholder slot below the CTA for a screenshot/visual — styled as a bordered, rounded rectangle with a subtle muted background and a small label ("Visual coming soon" or similar)

### 2. Features Section

Heading: "What it does"

Card grid (2-col on sm+, 1-col on mobile) with 4 feature cards. Each card has:

- A Lucide icon (large, primary-colored)
- A short bold title
- One sentence description

| Feature                         | Icon                           | Title                           |
| ------------------------------- | ------------------------------ | ------------------------------- |
| EAN / barcode → nutrition info  | `ScanBarcode`                  | "Scan or type a barcode"        |
| Good/bad nutrient highlights    | `ThumbsUp` / `Gauge`           | "See what matters at a glance"  |
| Side-by-side product comparison | `Columns2` or `ArrowLeftRight` | "Compare products side by side" |
| Sort by nutritional factor      | `ArrowUpDown`                  | "Sort by any nutrient"          |

One placeholder slot after the card grid for a feature screenshot.

### 3. "With an Account" Section

Heading: "Even better with an account" (tone: inviting, not gated)
Subheading note: "Nutripare is free to use — no credit card, no catch."

Card grid (2-col on sm+, 1-col on mobile) with 4 benefit cards. Each card has a Lucide icon, title, and one-line description:

| Benefit                          | Icon                | Title                     |
| -------------------------------- | ------------------- | ------------------------- |
| Save products                    | `Bookmark`          | "Save products"           |
| Save comparison groups           | `FolderHeart`       | "Save comparisons"        |
| Customise tracked nutrients      | `SlidersHorizontal` | "Choose your nutrients"   |
| Set personal high/low thresholds | `Gauge`             | "Set your own thresholds" |

No sign-up CTA in this section.

---

## Visual Placeholder Slots

Render as a `<div>` with:

- `bg-muted`, `border border-border`, `rounded-xl`
- Fixed aspect ratio or min-height (e.g. `min-h-48` or `aspect-video`)
- Centered muted text label: `"[ Visual placeholder ]"`
- `data-testid="visual-placeholder"` for easy future targeting

---

## Styling Notes

- Page max-width: `max-w-5xl mx-auto px-6` (wider than current `max-w-3xl` to suit card grids)
- Section vertical spacing: `py-20` between sections
- Card style: `bg-card border border-border rounded-xl p-6`
- Icon size: `size-8` or `size-10`, colored `text-primary`
- Dark mode is default — all colors via theme tokens, no hardcoded values

---

## Tests (`tests/home.test.tsx`)

- Hero renders an `<h1>` with text content
- Hero renders a link/button pointing to `/compare`
- Features section renders exactly 4 feature cards
- Each feature card has an svg icon and a text description
- Account benefits section renders exactly 4 benefit cards
- Page has a `<main>` landmark
- At least 2 heading levels are present (`h1` + at least one `h2`)

Use `render(<Home />)` from `@testing-library/react`. Mock `next/link` if needed (check if jsdom handles it — it typically does with Next.js test setup).

---

## Verification

1. `npm run dev` → visit `/` — confirm all three sections render, CTA button links to `/compare`, placeholder slots visible
2. Resize to mobile — confirm single-column layout
3. `npm test -- --run tests/landing-page.test.tsx` — all tests pass
4. `npm run lint` — no lint errors
