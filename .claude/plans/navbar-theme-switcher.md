# Plan: Navbar Theme Switcher

## Context

The app currently has dark mode applied as a static `className="dark"` on the `<html>` element in `app/layout.tsx`. We need to replace this with a dynamic, client-side theme toggle in a new `Navbar` component. The user's preference must persist to `localStorage`, and FOIT (flash of incorrect theme) is not acceptable.

No navigation links are needed in the Navbar at this stage — it is purely a shell for the theme toggle.

---

## Files to Create

- `hooks/use-theme.ts` — client-side hook that manages theme state, localStorage persistence, and `dark` class toggling on `document.documentElement`
- `components/navbar.tsx` — client Navbar component rendering the theme toggle button
- `tests/navbar.test.tsx` — tests for the Navbar and `useTheme` hook behaviour

## Files to Modify

- `app/layout.tsx` — remove static `dark` class, add FOIT-prevention inline script in `<head>`, render `<Navbar />` in `<body>`
- `tests/color-theme.test.tsx` — remove/update the test that asserts the static `dark` class on `RootLayout` (that responsibility moves to `navbar.test.tsx`)

---

## 1. `hooks/use-theme.ts`

A custom client-side hook that:

- Exports type `Theme = 'dark' | 'light'` and the hook `useTheme()`
- Returns `{ theme: Theme, toggleTheme: () => void }`
- On mount (`useEffect`), reads `localStorage.getItem('nutripare-theme')`:
  - If `'light'`, set state to `'light'` and remove `dark` from `document.documentElement.classList`
  - Otherwise (including `null` or any error), set state to `'dark'` and add `dark` to classList
- `toggleTheme` flips the state, updates `document.documentElement.classList` (add/remove `dark`), and writes the new value to `localStorage`
- Wraps localStorage access in `try/catch` to silently fall back to dark on storage errors
- Initial state before mount is `'dark'` (matches the FOIT script's default, avoids flicker)

---

## 2. FOIT-prevention inline script in `app/layout.tsx`

To prevent a flash of incorrect theme before hydration, add an inline `<script>` tag directly inside `<head>` in the layout using `dangerouslySetInnerHTML`. This script runs synchronously before the first paint:

```
try {
  var t = localStorage.getItem('nutripare-theme');
  if (t === 'light') document.documentElement.classList.remove('dark');
  else document.documentElement.classList.add('dark');
} catch(e) {
  console.error("Error fetching theme")
}
```

This means:

- Server-rendered HTML no longer has `dark` in `className` (static class is removed)
- The script adds `dark` immediately on the client before paint, so there is no visible flash for the default dark theme
- If the user previously selected light, the script removes the class before paint

---

## 3. `components/navbar.tsx`

A `'use client'` component that:

- Calls `useTheme()` to get `{ theme, toggleTheme }`
- Renders a `<nav>` with `flex justify-end items-center` layout and appropriate padding/border
- Contains a single shadcn `<Button variant="ghost" size="icon">` that calls `toggleTheme` on click
- When `theme === 'dark'`, renders the `Moon` Lucide icon (clicking will switch to light)
- When `theme === 'light'`, renders the `Sun` Lucide icon (clicking will switch to dark)
- Adds a `sr-only` accessible label for the button (e.g. "Toggle theme")

---

## 4. `app/layout.tsx` changes

- Remove `dark` from the `<html>` `className` (keep the font variables)
- Add a `<head>` block containing the FOIT-prevention `<script>` (see step 2)
- Add `<Navbar />` as the first child inside `<body>`, above `{children}`

---

## 5. `tests/navbar.test.tsx`

New test file covering:

- **Navbar renders without crashing** — render `<Navbar />` and expect no throw
- **Theme toggle button is present** — query by role `button` and assert it exists
- **Default theme is dark** — on mount with no localStorage value, `document.documentElement` has the `dark` class
- **Clicking toggle switches to light** — after click, `dark` class is removed from `document.documentElement`
- **Clicking toggle again switches back to dark** — `dark` class is re-added
- **localStorage is written on toggle** — after click, `localStorage.getItem('nutripare-theme')` equals `'light'`
- **localStorage value is read on mount** — set `localStorage.setItem('nutripare-theme', 'light')` before render, assert `dark` class is absent after mount

Notes on test setup:

- `document.documentElement` is the jsdom `<html>` element — mutate and assert its `classList` directly
- Use `userEvent` or `fireEvent.click` for the toggle
- Reset `document.documentElement.classList` and `localStorage` in `beforeEach`

---

## 6. `tests/color-theme.test.tsx` update

Remove the test case `'applies dark class to html element by default'` from the `RootLayout` describe block, as this behaviour is now dynamic (not a static prop) and is covered by `navbar.test.tsx`. The rest of the CSS token tests remain unchanged.

---

## Verification

1. `npm run dev` — confirm dark mode loads without flash on first visit; toggle works and persists across refresh
2. `npm test -- --run tests/navbar.test.tsx` — all new tests pass
3. `npm test -- --run tests/color-theme.test.tsx` — existing CSS tests still pass
4. `npm run build` — no TypeScript errors
