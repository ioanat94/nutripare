# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # Run ESLint (also runs on pre-commit)
npm run test      # Run Vitest in watch mode
npm run test:ui   # Run Vitest with browser UI
npm run coverage  # Run tests with coverage report
npm test -- --run                          # Run tests once (runs on pre-push)
npm test -- --run tests/compare.test.tsx   # Run a single test file
```

## Architecture

Next.js 16 App Router application (React 19, TypeScript strict mode, Tailwind CSS v4).

**Routes:**

- `app/page.tsx` — home (`/`)
- `app/login/page.tsx` — login (`/login`)
- `app/compare/page.tsx` — compare (`/compare`)
- `app/settings/[[...tab]]/page.tsx` — settings with optional tab segment (`/settings/account`, `/settings/nutrition`, etc.)
- `app/admin/page.tsx` — admin dashboard for product reports (`/admin`)
- `app/help/page.tsx` — user guide (`/help`)
- `app/privacy/page.tsx` — privacy policy (`/privacy`)
- `app/auth/action/page.tsx` — email verification callback (`/auth/action`)
- `app/layout.tsx` — root layout with Geist font, global metadata, and `dark` class on `<html>`
- `app/providers.tsx` — context providers (Auth, Tooltip, UI)
- `app/api/product/[code]/route.ts` — GET proxy to OpenFoodFacts API (caches 1h via `next.revalidate`)
- `app/api/report/route.ts` — product report submission (IP-based rate limiting)

**Key directories:**

- `components/` — shared UI: `navbar`, `footer`, `barcode-scanner`, `nutrition-table`, `auth-form`, `auth-screen`, `email-verification-screen`, `compare.page`, `demo-table`, `home-demo`, `ruleset-demo`, `help-toc`, `policies`, plus shadcn primitives under `components/ui/`
- `components/settings/` — tab components for the settings page: `account-tab`, `comparisons-tab`, `nutrition-tab`, `products-tab`
- `lib/` — `firebase.ts` (app/auth/Firestore init + FirebaseUI), `openfoodfacts.ts` (fetch + parse helpers including EAN check digit validation), `firestore.ts` (Firestore CRUD helpers for products, comparisons, nutrition settings, and reports), `reports.ts` (report submission wrapper)
- `utils/` — `score.ts` (computed nutrition score), `thresholds.ts` (threshold color mapping), `tailwind.ts` (cn helper), `constants.ts` (routes, built-in rulesets, demo data, labels), `getDefaultRules.ts` (default ruleset generator)
- `types/` — `openfoodfacts.ts` (API response + `ProductNutrition`), `firestore.ts` (user, saved product/comparison, nutrition rules/rulesets, reports), `table.ts` (table cell/row rendering types), `thresholds.ts` (ThresholdColor type)
- `hooks/` — `use-theme.ts` (dark/light toggle, persisted to `localStorage`), `use-expanded-table.ts` (table expansion state)
- `contexts/` — `auth-context.tsx` (Firebase auth state provider with email verification tracking and new-user Firestore init)

**Path alias:** `@/*` maps to the project root. Also configured in `vitest.config.ts` so tests can use it.

**Auth & data:** Firebase Auth via `@firebase-oss/ui-react` + a custom `AuthProvider` context. Firestore is used to persist saved products, saved comparisons, per-user nutrition settings, and product reports. Admin report management is in `app/admin/`. All Firebase config comes from `NEXT_PUBLIC_FIREBASE_*` env vars. Email verification is required and tracked via `onVisibilityChange` refresh.

**Barcode scanning:** `html5-qrcode` wrapped in `components/barcode-scanner.tsx`, loaded dynamically (`ssr: false`) on the compare page. EAN input is parsed and validated (including check digit) in `lib/openfoodfacts.ts` before fetching.

**Drag-drop:** Column reordering in the nutrition table uses `@dnd-kit/core` and `@dnd-kit/sortable`.

**Styling:** Tailwind CSS v4 via PostCSS. Theme variables are defined in `app/globals.css` using oklch color space. Dark mode uses the `.dark` class — toggled by `useTheme` hook at runtime (dark is the default). Custom tokens beyond shadcn defaults: `--positive` / `--positive-foreground` (green), `--warning` / `--warning-foreground` (amber), and `--info` / `--info-foreground` (blue). Font variables (`--font-geist-sans`, `--font-geist-mono`) must be set on `<html>`, not `<body>`, so they resolve correctly in the `@theme inline` block.

**Testing:** Vitest with jsdom environment, `@testing-library/react`, and `@testing-library/jest-dom`. The setup file (`tests/setup.ts`) runs `cleanup()` after each test automatically. Vitest globals are enabled so `describe`/`it`/`expect` don't need to be imported. The `s` regex flag is not available (tsconfig targets ES2017) — use `[^}]+` or `[\s\S]` instead.

## Planning

When asked to plan a feature:

- Save the plan to `./.claude/plans/<spec-name>.md` (matching the spec filename, without the path)
- Do not ask to implement after planning — exit plan mode immediately once the plan is saved
