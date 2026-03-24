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
- `app/settings/page.tsx` — settings (`/settings`)
- `app/preview/page.tsx` — theme/component preview (`/preview`)
- `app/layout.tsx` — root layout with Geist font, global metadata, and `dark` class on `<html>`
- `app/api/product/[code]/route.ts` — GET proxy to OpenFoodFacts API (caches 1h via `next.revalidate`)

**Key directories:**
- `components/` — shared UI: `navbar`, `barcode-scanner`, `nutrition-table`, `auth-form`, `auth-screen`, `policies`, plus shadcn primitives under `components/ui/`
- `components/settings/` — tab components for the settings page: `account-tab`, `comparisons-tab`, `nutrition-tab`, `products-tab`
- `lib/` — `firebase.ts` (app/auth/Firestore init + FirebaseUI), `openfoodfacts.ts` (fetch + parse helpers), `firestore.ts` (Firestore CRUD helpers for products, comparisons, and nutrition settings)
- `utils/` — `score.ts` (computed nutrition score), `thresholds.ts` (default nutrition rules), `tailwind.ts` (cn helper)
- `types/` — `openfoodfacts.ts` (API response + `ProductNutrition`), `firestore.ts`
- `hooks/` — `use-theme.ts` (dark/light toggle, persisted to `localStorage`)
- `contexts/` — `auth-context.tsx` (Firebase auth state provider)

**Path alias:** `@/*` maps to the project root. Also configured in `vitest.config.ts` so tests can use it.

**Auth & data:** Firebase Auth via `@firebase-oss/ui-react` + a custom `AuthProvider` context. Firestore is used to persist saved products, saved comparisons, and per-user nutrition settings. All Firebase config comes from `NEXT_PUBLIC_FIREBASE_*` env vars.

**Barcode scanning:** `html5-qrcode` wrapped in `components/barcode-scanner.tsx`, loaded dynamically (`ssr: false`) on the compare page.

**Styling:** Tailwind CSS v4 via PostCSS. Theme variables are defined in `app/globals.css` using oklch color space. Dark mode uses the `.dark` class — toggled by `useTheme` hook at runtime (dark is the default). Custom tokens beyond shadcn defaults: `--positive` / `--positive-foreground` (green), `--warning` / `--warning-foreground` (amber), and `--info` / `--info-foreground` (blue). Font variables (`--font-geist-sans`, `--font-geist-mono`) must be set on `<html>`, not `<body>`, so they resolve correctly in the `@theme inline` block.

**Testing:** Vitest with jsdom environment, `@testing-library/react`, and `@testing-library/jest-dom`. The setup file (`tests/setup.ts`) runs `cleanup()` after each test automatically. Vitest globals are enabled so `describe`/`it`/`expect` don't need to be imported. The `s` regex flag is not available (tsconfig targets ES2017) — use `[^}]+` or `[\s\S]` instead.

## Planning

When asked to plan a feature:
- Save the plan to `./.claude/plans/<spec-name>.md` (matching the spec filename, without the path)
- Do not ask to implement after planning — exit plan mode immediately once the plan is saved
