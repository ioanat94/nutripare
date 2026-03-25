# Plan: Help Page

## Context

The app has a `/help` route and navbar icon already wired up, but `app/help/page.tsx` is currently empty. This plan fills it with a documentation-style page covering all 10 sections defined in `.claude/specs/help-page.md`. The page should be statically rendered, require no auth, and use a sticky ToC sidebar on desktop / inline ToC on mobile.

---

## Files to modify

- `app/help/page.tsx` — full rewrite (currently empty/minimal); Server Component for content
- `components/help-toc.tsx` — new Client Component for the sticky ToC with scroll-spy
- `tests/help.test.tsx` — new test file

---

## Layout

Two-column layout matching the project's established patterns:

```
<main class="mx-auto w-full max-w-5xl px-6 py-12">
  <div class="flex gap-12">
    <!-- Sidebar ToC: sticky, desktop only — Client Component -->
    <HelpToc sections={SECTIONS} />  {/* 'use client', hidden on mobile */}

    <!-- Content -->
    <div class="min-w-0 flex-1 space-y-16">
      <!-- Mobile ToC: inline at top, lg:hidden -->
      <nav class="lg:hidden ...">...</nav>

      <section id="overview">...</section>
      <section id="searching">...</section>
      ...
    </div>
  </div>
</main>
```

- Sidebar uses `sticky top-24` (clears the navbar height)
- `HelpToc` uses `IntersectionObserver` to watch all `section[id]` elements and tracks `activeId` in `useState`. Uses `rootMargin: '-20% 0px -70% 0px'` so the active item updates near the top of the viewport as the user scrolls.
- Active ToC link: `text-foreground font-medium`; inactive: `text-muted-foreground hover:text-foreground transition-colors`
- Each `<section>` in the page content has an `id` matching the ToC anchor

---

## Section IDs and headings

| # | id | Heading |
|---|-----|---------|
| 1 | `overview` | Overview |
| 2 | `searching` | Searching for Products |
| 3 | `nutrition-table` | The Nutrition Table |
| 4 | `table-actions` | Table Actions |
| 5 | `saving` | Saving Products and Comparisons |
| 6 | `settings-account` | Settings — Account |
| 7 | `settings-nutrition` | Settings — Nutrition |
| 8 | `settings-products` | Settings — Products |
| 9 | `settings-comparisons` | Settings — Comparisons |
| 10 | `account-features` | Signed-in vs. Signed-out |

---

## Content notes

- **Section 3** includes the FSA thresholds table (Nutrient / Threshold / Value / Rating) and the computed score formula rendered as a numbered list.
- **Section 10** renders as two side-by-side cards or a two-column dl on desktop, stacked on mobile.
- No interactive components — pure JSX with Tailwind prose-style styling.
- Use `<code>` for inline EAN examples. No external component imports needed beyond what's already available.
- Page is a standard async Server Component (`export default function HelpPage()`), no `'use client'`.

---

## Styling approach

Follow existing page conventions:
- Page title: `text-3xl font-bold tracking-tight`
- Section headings (h2): `text-xl font-semibold` with a top border or spacing separator
- Body text: `text-sm text-muted-foreground` for descriptions, `text-sm` for content
- ToC links: `text-sm text-muted-foreground hover:text-foreground transition-colors`
- Tables: use shadcn `<Table>` primitives (already used throughout the app)
- Colour badges for rating labels (green/blue/amber/red dots matching `--positive`, `--info`, `--warning`, `--destructive`)

---

## Tests (`tests/help.test.tsx`)

Mock `next/navigation` (useRouter, usePathname) and `@/contexts/auth-context` (same pattern as other test files).

Tests:
1. Smoke test — page renders without error
2. All 10 section headings are present (`screen.getByRole('heading', { name: /.../ })`)
3. ToC contains anchor links with correct `href="#<id>"` values for all 10 sections
4. Page renders for unauthenticated user (no redirect)
5. Navbar icon and home page "How it works" button point to `/help` (covered by existing navbar/home tests — skip here to avoid duplication)

---

## Verification

1. Run `npm run dev` and navigate to `/help` — verify layout, sidebar stickiness, anchor scrolling
2. Check mobile viewport (< lg breakpoint) — sidebar hides, inline ToC appears
3. Run `npm test -- --run tests/help.test.tsx`
4. Run `npm run lint`
