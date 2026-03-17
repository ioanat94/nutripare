# Spec for Neon Green Color Theme

branch: claude/feature/neon-green-color-theme

## Summary

Replace the default shadcn/ui and Tailwind CSS color theme with a custom palette centered around a neon blueish-green primary color (`#00ffc2`). Both light and dark themes must be defined. Dark mode should be the default presentation of the app.

## Functional Requirements

- Set the primary color to approximately `#00ffc2` (neon blueish-green) in both light and dark themes, expressed using the oklch color format to stay consistent with the existing token system
- Define a harmonious full palette: background, foreground, card, popover, secondary, muted, accent, destructive, border, input, ring, and chart colors for both themes
- Dark theme colors should feel deep and rich (dark navy/charcoal backgrounds) to complement the neon primary
- Light theme colors should be clean and minimal, with the neon primary still readable and accessible
- Dark mode must be the default — the app should render in dark mode on first load without requiring user interaction
- The `.dark` class-based dark mode toggle system (already in place via shadcn) should be preserved so a future light/dark switcher can work

## Possible Edge Cases

- The neon primary may have insufficient contrast against white backgrounds in light mode — the light theme foreground-on-primary must still meet reasonable readability standards
- oklch values must be clipped to valid gamut ranges; very saturated neon colors can fall outside sRGB
- Ring and focus indicator colors should remain visible in both themes for accessibility
- Destructive/error color must remain distinguishable from the neon green in both themes
- Chart colors should be visually distinct from each other and from the primary

## Acceptance Criteria

- `app/globals.css` `:root` block contains updated light theme CSS variables using the new palette
- `app/globals.css` `.dark` block contains updated dark theme CSS variables using the new palette
- The primary color in both themes visually matches approximately `#00ffc2`
- The app defaults to dark mode on load (dark class applied to `<html>` or equivalent root element by default)
- No existing token names are removed — only values are changed
- The UI renders without visual regressions (no invisible text, broken contrast, or missing borders)

## Open Questions

- Should the root layout apply the `dark` class statically, or should it be driven by a cookie/localStorage for persistence across sessions? (For this spec, static default is acceptable) - Statically for now, we will handle theme switching and persistence later.
- Should sidebar and chart tokens also be updated, or only the core UI tokens? - Might as well update sidebar and chart also while we are here.

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- The CSS variables for `--primary` exist in the stylesheet and contain a non-default (non-grey) value
- The `<html>` element has the `dark` class applied by default on initial render
- Core token names (e.g. `--background`, `--foreground`, `--primary`) are all still present and non-empty in both `:root` and `.dark` blocks
