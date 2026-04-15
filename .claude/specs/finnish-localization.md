# Spec for Finnish Localization

branch: claude/feature/finnish-localization

## Summary

Add Finnish language support to the application using `next-intl`. All user-facing text will be extracted into translation files for English (en) and Finnish (fi). The locale will be reflected in the URL (e.g. `/fi/compare`) via Next.js middleware and an `[locale]` route segment. A language toggle will be added to the navigation bar. Human proofreaders will review the Finnish translations after the initial machine-assisted pass.

## Functional Requirements

- Install and configure `next-intl` for the Next.js App Router
- Create translation files for English (`en`) and Finnish (`fi`) covering all user-facing strings in:
  - `components/navbar.tsx`
  - `components/footer.tsx`
  - `components/auth-form.tsx`
  - `components/auth-screen.tsx`
  - `components/email-verification-screen.tsx`
  - `components/barcode-scanner.tsx`
  - `components/nutrition-table.tsx`
  - `components/demo-table.tsx`
  - `components/ruleset-demo.tsx`
  - `components/help-toc.tsx`
  - `components/home-demo.tsx`
  - `components/policies/`
  - `components/settings/account-tab.tsx`
  - `components/settings/comparisons-tab.tsx`
  - `components/settings/nutrition-tab.tsx`
  - `components/settings/products-tab.tsx`
  - `app/page.tsx`
  - `app/login/page.tsx`
  - `app/compare/page.tsx`
  - `app/settings/[[...tab]]/page.tsx`
  - `app/admin/page.tsx`
  - `app/help/page.tsx` (prose loaded from `content/help.en.mdx` / `content/help.fi.mdx`)
  - `app/privacy/page.tsx` (prose loaded from `content/privacy.en.mdx` / `content/privacy.fi.mdx`)
  - `app/layout.tsx` (page title / metadata)
  - `utils/constants.ts` (labels, built-in ruleset names, demo data labels)
- Add `next-intl` middleware to detect and route locales; wrap all routes under an `[locale]` segment
- Add a language toggle button to the navbar, visually consistent with the existing theme toggle
- The toggle should display the current language code (e.g. `EN` / `FI`) or use a globe icon with a dropdown
- Switching language navigates to the equivalent URL under the new locale (e.g. `/compare` → `/fi/compare`)
- Default locale is `en`; navigating to `/` redirects to `/en/` (or the user's preferred locale if previously visited)
- Finnish translations are a first-pass (machine-assisted); the spec explicitly notes human proofreading is required afterwards

## Possible Edge Cases

- Product names and nutrition data come from OpenFoodFacts and should not be translated — only the app UI strings are in scope
- Built-in ruleset names defined in `utils/constants.ts` are user-visible and should be translated
- Metadata (`<title>`, `<meta description>`) should also be localised
- `sr-only` accessibility strings in the navbar and elsewhere must be translated
- The admin page is an internal tool; still translate UI strings but lower priority
- The help page contains long-form prose — translate fully but mark clearly for proofreading
- Privacy policy page contains legal text — translate but flag prominently for legal/proofreading review
- Tests that assert on specific English strings will need to be updated or made locale-aware

## Acceptance Criteria

- Switching language in the navbar immediately re-renders all translated strings with no reload
- Selecting Finnish shows Finnish text throughout the app; selecting English restores English text
- Locale is reflected in the URL and survives a page refresh or shared link
- Default locale on first visit is English (`/en/`)
- All user-visible static strings are covered in both translation files (no untranslated fallback strings visible to the user)
- The language toggle is keyboard-accessible and screen-reader-friendly
- No regressions in existing functionality (auth, compare, settings, admin)

## Open Questions

- Should the language also be stored per-user in Firestore (so it syncs across devices), or URL-only for now?
- ~~Should the privacy policy and help page prose be broken into keyed strings or stored as separate locale files/MDX documents?~~ → Use separate MDX files per locale (e.g. `content/privacy.en.mdx`, `content/privacy.fi.mdx`)
- ~~Should the language also be stored per-user in Firestore?~~ → URL-only, no Firestore sync

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Language toggle renders in the navbar and switches between `EN` and `FI`
- Selected language is persisted to and restored from `localStorage`
- Key UI strings render in English by default
- Key UI strings render in Finnish after switching to `fi` locale
- Switching language does not cause a full page reload
- Accessibility: toggle button has an accessible label in both languages
