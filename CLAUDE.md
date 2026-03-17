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
npm test -- --run tests/main.test.tsx      # Run a single test file
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

**Path alias:** `@/*` maps to the project root. Also configured in `vitest.config.ts` so tests can use it.

**Styling:** Tailwind CSS v4 via PostCSS. Theme variables are defined in `app/globals.css` using oklch color space. Dark mode uses the `.dark` class (applied statically to `<html>` — dark is the default). Custom tokens beyond shadcn defaults: `--warning` / `--warning-foreground` (amber) and `--info` / `--info-foreground` (blue). Font variables (`--font-geist-sans`, `--font-geist-mono`) must be set on `<html>`, not `<body>`, so they resolve correctly in the `@theme inline` block.

**Testing:** Vitest with jsdom environment, `@testing-library/react`, and `@testing-library/jest-dom`. The setup file (`tests/setup.ts`) runs `cleanup()` after each test automatically. Vitest globals are enabled so `describe`/`it`/`expect` don't need to be imported. The `s` regex flag is not available (tsconfig targets ES2017) — use `[^}]+` or `[\s\S]` instead.

No API routes, database, or auth implementation exist yet — the project is in early scaffolding stage.
