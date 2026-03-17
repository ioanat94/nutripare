# Plan: Neon Green Color Theme

## Context

The shadcn/ui scaffolding produced a default neutral (grey) color palette. The user wants a custom theme centered on a neon blueish-green primary (`#00ffc2`), with dark mode as the app default. Currently the app has no `.dark` class on `<html>`, so dark mode variables never activate — the app is always in light mode regardless of OS preference.

## Files to Modify

- `app/globals.css` — update all CSS custom property values in `:root` (light) and `.dark` (dark) blocks
- `app/layout.tsx` — add `className="dark"` to the `<html>` element to make dark mode the default
- `tests/color-theme.test.tsx` — new test file (create)

---

## 1. Convert primary color to oklch

`#00ffc2` → approximately **oklch(0.91 0.17 171)**

This will be used as `--primary` in the dark theme. For the light theme, a slightly deeper version will be used to ensure contrast: approximately **oklch(0.55 0.17 171)**.

---

## 2. Dark theme palette (`.dark` block in `globals.css`)

Concept: deep navy/charcoal backgrounds + neon green accent

| Token | Value | Notes |
|---|---|---|
| `--background` | `oklch(0.13 0.02 220)` | Deep navy-dark |
| `--foreground` | `oklch(0.96 0.005 220)` | Soft white |
| `--card` | `oklch(0.17 0.02 220)` | Slightly lighter than bg |
| `--card-foreground` | `oklch(0.96 0.005 220)` | Same as foreground |
| `--popover` | `oklch(0.17 0.02 220)` | Match card |
| `--popover-foreground` | `oklch(0.96 0.005 220)` | Same as foreground |
| `--primary` | `oklch(0.91 0.17 171)` | Neon green #00ffc2 |
| `--primary-foreground` | `oklch(0.13 0.02 220)` | Dark bg on neon button |
| `--secondary` | `oklch(0.22 0.02 220)` | Muted dark surface |
| `--secondary-foreground` | `oklch(0.96 0.005 220)` | Light text |
| `--muted` | `oklch(0.22 0.02 220)` | Same as secondary |
| `--muted-foreground` | `oklch(0.62 0.01 220)` | Subdued text |
| `--accent` | `oklch(0.25 0.04 171)` | Subtle teal tint |
| `--accent-foreground` | `oklch(0.91 0.17 171)` | Neon green on accent |
| `--destructive` | `oklch(0.65 0.22 25)` | Warm red-orange |
| `--border` | `oklch(1 0 0 / 10%)` | Subtle white border |
| `--input` | `oklch(1 0 0 / 15%)` | Input border |
| `--ring` | `oklch(0.91 0.17 171)` | Neon green focus ring |
| `--chart-1` | `oklch(0.91 0.17 171)` | Neon green |
| `--chart-2` | `oklch(0.75 0.15 210)` | Cyan-blue |
| `--chart-3` | `oklch(0.65 0.18 260)` | Indigo-violet |
| `--chart-4` | `oklch(0.78 0.14 140)` | Lime green |
| `--chart-5` | `oklch(0.60 0.20 30)` | Amber-orange |
| `--sidebar` | `oklch(0.10 0.02 220)` | Darker than background |
| `--sidebar-foreground` | `oklch(0.96 0.005 220)` | Same as foreground |
| `--sidebar-primary` | `oklch(0.91 0.17 171)` | Neon green |
| `--sidebar-primary-foreground` | `oklch(0.13 0.02 220)` | Dark |
| `--sidebar-accent` | `oklch(0.25 0.04 171)` | Same as accent |
| `--sidebar-accent-foreground` | `oklch(0.91 0.17 171)` | Neon green |
| `--sidebar-border` | `oklch(1 0 0 / 8%)` | Subtle white |
| `--sidebar-ring` | `oklch(0.91 0.17 171)` | Neon green |

---

## 3. Light theme palette (`:root` block in `globals.css`)

Concept: clean white/light-grey backgrounds, darker teal-green primary for readability

| Token | Value | Notes |
|---|---|---|
| `--background` | `oklch(0.98 0 0)` | Near white |
| `--foreground` | `oklch(0.13 0.02 220)` | Dark navy text |
| `--card` | `oklch(1 0 0)` | Pure white |
| `--card-foreground` | `oklch(0.13 0.02 220)` | Dark navy |
| `--popover` | `oklch(1 0 0)` | White |
| `--popover-foreground` | `oklch(0.13 0.02 220)` | Dark |
| `--primary` | `oklch(0.55 0.17 171)` | Deep teal-green (accessible) |
| `--primary-foreground` | `oklch(0.98 0 0)` | White text on primary |
| `--secondary` | `oklch(0.94 0.01 171)` | Very light teal tint |
| `--secondary-foreground` | `oklch(0.13 0.02 220)` | Dark navy |
| `--muted` | `oklch(0.94 0.005 220)` | Light neutral |
| `--muted-foreground` | `oklch(0.50 0.01 220)` | Medium grey |
| `--accent` | `oklch(0.92 0.05 171)` | Light neon-green wash |
| `--accent-foreground` | `oklch(0.35 0.12 171)` | Deep teal |
| `--destructive` | `oklch(0.53 0.24 27)` | Accessible red |
| `--border` | `oklch(0.88 0.01 220)` | Light border |
| `--input` | `oklch(0.88 0.01 220)` | Input border |
| `--ring` | `oklch(0.55 0.17 171)` | Deep teal ring |
| `--chart-1` | `oklch(0.55 0.17 171)` | Deep teal |
| `--chart-2` | `oklch(0.55 0.15 210)` | Cyan-blue |
| `--chart-3` | `oklch(0.50 0.18 260)` | Indigo |
| `--chart-4` | `oklch(0.60 0.14 140)` | Lime |
| `--chart-5` | `oklch(0.55 0.20 30)` | Amber |
| `--sidebar` | `oklch(0.96 0.005 220)` | Very light grey |
| `--sidebar-foreground` | `oklch(0.13 0.02 220)` | Dark |
| `--sidebar-primary` | `oklch(0.55 0.17 171)` | Deep teal |
| `--sidebar-primary-foreground` | `oklch(0.98 0 0)` | White |
| `--sidebar-accent` | `oklch(0.92 0.05 171)` | Light teal wash |
| `--sidebar-accent-foreground` | `oklch(0.35 0.12 171)` | Deep teal |
| `--sidebar-border` | `oklch(0.88 0.01 220)` | Light border |
| `--sidebar-ring` | `oklch(0.55 0.17 171)` | Deep teal |

`--radius` stays at `0.625rem` (unchanged).

---

## 4. Make dark mode default (`app/layout.tsx`)

Add `className="dark"` to the `<html>` element. This is a static default — theme switching/persistence will be handled in a future feature.

---

## 5. Tests (`tests/color-theme.test.tsx`)

Since jsdom doesn't process CSS files, CSS variable values can't be tested via computed styles. Focus on what IS testable:

- **Dark class on html**: Render the `RootLayout` component and assert the rendered `<html>` has the `dark` class
- **CSS token presence**: Read the raw `globals.css` file content and assert `--primary` exists in both `:root` and `.dark` blocks

---

## Verification

1. `npm run dev` — visually confirm dark navy background + neon green primary
2. Remove `className="dark"` temporarily to verify light theme renders correctly
3. `npm test -- --run tests/color-theme.test.tsx` — confirm tests pass
4. `npm run build` — confirm no TypeScript errors
