# Spec for landing-page-feature-showcase

branch: claude/feature/landing-page-feature-showcase

## Summary

Flesh out the home page (`/`) to clearly communicate what Nutripare does and invite users to start using it. The page should be modern, clean, and friendly in tone — matter of fact without being dry. It explains the core features through short sections with icons (e.g. Lucide), and includes a prominent CTA that sends users to `/compare`. Placeholder areas for screenshots or visuals should be included so they can be dropped in later.

## Functional Requirements

- Hero section with a punchy headline, short subheading describing the app in plain terms, and a CTA button linking to `/compare`
- Feature section highlighting the core capabilities, each with an icon and brief description:
  - Enter an EAN barcode or scan a product to instantly view its nutritional info
  - Key nutrients are flagged as good or bad at a glance (e.g. high protein = good, high sugar = bad)
  - Enter or scan multiple products to compare them side by side
  - Sort compared products by any individual nutritional factor
- "With an account" section listing the benefits of signing up:
  - Save individual products for quick access
  - Save comparison groups to revisit later
  - Customise which nutrients matter to you
  - Set your own thresholds for what counts as high or low for a given nutrient
- Placeholder slots for screenshots or other visuals (clearly marked, easy to swap in later)
- CTA button copy should be punchy and action-oriented (e.g. "Start comparing", "See it in action", "Try it now")
- Navigation or header with links to `/login` and `/compare`

## Possible Edge Cases

- Page should look good without any visuals in the placeholder slots (graceful empty state)
- CTA and layout should remain readable and usable on small screens (mobile)
- "With an account" section should not feel like a paywall — tone should be inviting, not gated (the app is planned to be free to use)

## Acceptance Criteria

- Home page (`/`) renders the hero, features, and account benefits sections
- CTA button navigates to `/compare`
- All feature items include an icon and description
- Placeholder visual slots are visible and clearly marked
- Page is responsive on mobile and desktop
- Copy tone is friendly and matter of fact — no jargon, no hype
- Uses Lucide icons (or similar) for feature illustrations

## Open Questions

- What should the hero headline be? (Can be iterated on, a first pass is fine) Not sure yet, be creative.
- Should the "With an account" section include a sign-up CTA, or just describe the benefits? Let's skip sign-up CTA for now.
- Should the header/nav be part of this spec or handled separately as a shared layout component? Separately.
- Any preference on layout style — e.g. alternating text/visual rows, card grid, or a single-column flow? Let's give card grid a try.

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Hero section renders with a heading and a link/button pointing to `/compare`
- Feature list renders the expected number of feature items
- Each feature item has an icon and a text description
- "With an account" section renders with the correct benefit items
- Page is accessible (key landmarks present: `main`, headings hierarchy)
