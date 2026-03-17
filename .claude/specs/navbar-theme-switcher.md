# Spec for navbar-theme-switcher

branch: claude/feature/navbar-theme-switcher

## Summary

Add a persistent Navbar component to the application and implement a theme switching mechanism (light/dark) within it. The user's theme preference is saved to localStorage so it persists across sessions. The theme toggle control is positioned in the top-right of the navbar using a Lucide icon button via shadcn's Button component.

## Functional Requirements

- Create a `Navbar` component rendered at the top of all pages via the root layout
- The Navbar includes a theme toggle button in its top-right area
- The toggle switches between light and dark themes
- The active theme is persisted to `localStorage` under a consistent key (e.g. `nutripare-theme`)
- On initial load, the theme is restored from localStorage; if no preference is stored, fall back to dark (the app's current default)
- The `dark` class on `<html>` is toggled dynamically based on the active theme
- The toggle button uses a Lucide icon (e.g. `Sun` for light mode, `Moon` for dark mode) rendered via a shadcn Button with `variant="ghost"` and `size="icon"`
- No full page reload is required when switching themes

## Possible Edge Cases

- SSR/hydration mismatch: localStorage is not available on the server — the theme read must be deferred to the client
- The `dark` class is currently applied statically in `app/layout.tsx`; this static class must be removed and replaced with client-side logic
- If localStorage is unavailable (private browsing, storage quota exceeded), the app should silently fall back to the default dark theme without throwing
- The Navbar should not break layout on small screens

## Acceptance Criteria

- A `Navbar` component exists and is rendered on every page via the root layout
- The theme toggle button is visible in the top-right corner of the Navbar
- Clicking the toggle switches between light and dark themes immediately
- Refreshing the page preserves the last selected theme
- The correct Lucide icon is shown depending on the current theme
- No flash of incorrect theme on initial load (or the approach is documented as a known limitation)
- The static `dark` class in `layout.tsx` is replaced by the dynamic client-side mechanism

## Open Questions

- Should the Navbar include any navigation links at this stage, or is it purely a shell for the theme toggle for now? Only theme toggle for now.
- Is a flash of incorrect theme (FOIT) acceptable, or should we add a blocking inline script to `<head>` to set the class before hydration? FOIT is not acceptable.

## Testing Guidelines

Create test file(s) in the ./tests folder for the new feature, and create meaningful tests for the following cases, without going too heavy:

- Navbar renders without crashing
- Theme toggle button is present in the Navbar
- Clicking the toggle switches the theme class on `<html>` from dark to light (and back)
- The selected theme is written to localStorage on toggle
- On mount, the theme is read from localStorage and applied correctly
- When localStorage has no value, the default dark theme is applied
