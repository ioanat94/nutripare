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

**Route groups:**
- `app/(public)/` — unauthenticated routes: `/` (home), `/login`, `/compare`
- `app/(settings)/` — settings route: `/`
- `app/layout.tsx` — root layout with Geist font and global metadata

**Path alias:** `@/*` maps to the project root.

**Styling:** Tailwind CSS v4 via PostCSS. Theme variables (`--background`, `--foreground`, font variables) are defined in `app/globals.css` with dark mode via `prefers-color-scheme`.

**Testing:** Vitest with jsdom environment, `@testing-library/react`, and `@testing-library/jest-dom`. The setup file (`tests/setup.ts`) runs `cleanup()` after each test automatically. Vitest globals are enabled so `describe`/`it`/`expect` don't need to be imported.

No API routes, database, or auth implementation exist yet — the project is in early scaffolding stage.
