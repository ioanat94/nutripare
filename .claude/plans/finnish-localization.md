# Plan: Finnish Localization

## Context

The app has no i18n infrastructure — all user-facing strings are hardcoded in components and `utils/constants.ts`. The goal is to add Finnish language support using `next-intl` with URL-based locale routing (`/en/...` and `/fi/...`), a language toggle in the navbar, and full coverage of all UI strings in both locales.

---

## Architecture Decisions

### Layout split
`app/layout.tsx` becomes a pass-through shell (`return children` only, no `<html>`/`<body>`). `app/[locale]/layout.tsx` owns the full document shell (`<html lang={locale}>`, `<body>`, fonts, inline theme script, `NextIntlClientProvider`, `<Providers>`, `<Navbar>`, `<Footer>`, `<Toaster>`). This is required because only the `[locale]` layout knows the current locale at render time.

### `utils/constants.ts` — label removal
- Remove `label` from `ROWS` and `SCORE_ROW` (only `key` remains)
- Remove `label` from `HELP_SECTIONS` (only `id` remains)
- Delete `RATING_LABEL`, `NUTRIENT_LABEL`, `RULESET_DESCRIPTION` entirely
- Remove `name` from `BUILTIN_RULESETS` (id is sufficient; names looked up via `t()`)
- Add a `key` field to each `DEFAULT_ROWS` entry matching the corresponding `ROWS` key (e.g. `'kcals'`, `'protein'`); demo components replace `row.label` with `t('nutrients.' + row.key)`. The `RowData` type gains an optional `key` field to support this.

### Help and privacy pages
Keep as `.tsx` files. All prose text moves to `messages/en.json` / `messages/fi.json` under `HelpPage` and `PrivacyPage` namespaces. No MDX toolchain needed.

### Navigation imports
All components switch from `'next/link'` / `'next/navigation'` to `'@/i18n/navigation'` (the locale-aware re-export). Signatures are identical, so this is a bulk search-and-replace.

### `app/auth/action/`
Keep at `app/auth/action/page.tsx` (not moved under `[locale]`). Exclude `/auth/action` from the middleware matcher alongside `/api/`. Firebase console needs no changes — the action URL stays at `/auth/action`.

The page reads the preferred locale from the `NEXT_LOCALE` cookie (already written by `useLocaleToggle`) to render strings in the right language via `getTranslations`. After handling verification, redirect to `/${locale}/` (derived from cookie) instead of a hardcoded path. This means locale comes from the cookie rather than the URL on this one page — acceptable tradeoff vs. risking broken Firebase email links.

---

## File Changes

### New files
```
messages/en.json              — all English strings
messages/fi.json              — all Finnish strings
i18n/routing.ts               — defineRouting() with locales: ['en', 'fi'], defaultLocale: 'en'
i18n/request.ts               — getRequestConfig() reading messages from messages/${locale}.json
i18n/navigation.ts            — re-exports Link, useRouter, usePathname, redirect from next-intl/navigation
middleware.ts                 — createMiddleware(routing), matcher excludes /api/*
app/[locale]/layout.tsx       — full document shell + NextIntlClientProvider
hooks/use-locale.ts           — locale toggle hook (mirrors use-theme.ts)
tests/test-utils.tsx          — renderWithI18n() helper wrapping NextIntlClientProvider with en messages
tests/locale-toggle.test.tsx  — new tests for locale toggle behaviour
```

### Moved files (all routes shift under `app/[locale]/`)
```
app/page.tsx                         → app/[locale]/page.tsx
app/compare/page.tsx                 → app/[locale]/compare/page.tsx
app/login/page.tsx                   → app/[locale]/login/page.tsx
app/admin/page.tsx                   → app/[locale]/admin/page.tsx
app/help/page.tsx                    → app/[locale]/help/page.tsx
app/privacy/page.tsx                 → app/[locale]/privacy/page.tsx
app/settings/[[...tab]]/page.tsx     → app/[locale]/settings/[[...tab]]/page.tsx
app/error.tsx                        → app/[locale]/error.tsx
app/not-found.tsx                    → app/[locale]/not-found.tsx
```

`app/api/` stays at root (no locale prefix, excluded from middleware matcher).

### Modified files
- `app/layout.tsx` — strip to pass-through only (`return children`)
- `next.config.ts` — wrap with `createNextIntlPlugin('./i18n/request.ts')`
- `utils/constants.ts` — remove label/name/description fields as above
- `components/navbar.tsx` — add locale toggle button; replace hardcoded strings with `t()`; switch Link/router imports to `@/i18n/navigation`
- `components/footer.tsx` — use `t()`, switch to `@/i18n/navigation` Link
- All other components in spec scope — `useTranslations` / `getTranslations` for each hardcoded string; switch navigation imports
- `tests/setup.ts` — add global mock for `next-intl/server`; add mock for `@/i18n/navigation`
- All existing test files — replace `vi.mock('next/navigation', ...)` with `vi.mock('@/i18n/navigation', ...)`; update string assertions to use `renderWithI18n()` where English text is checked

---

## Key Patterns

### next-intl config (`i18n/routing.ts`)
```ts
export const routing = defineRouting({
  locales: ['en', 'fi'],
  defaultLocale: 'en',
  localePrefix: 'always',
  localeCookie: { name: 'NEXT_LOCALE', maxAge: 60 * 60 * 24 * 365 },
});
```

### `[locale]/layout.tsx` metadata
Each page exports `generateMetadata({ params })` using `getTranslations({ locale, namespace: 'Metadata' })`. The root `app/layout.tsx` no longer exports static `metadata`.

### `hooks/use-locale.ts`
```ts
export function useLocaleToggle() {
  const locale = useLocale();          // from next-intl
  const router = useRouter();          // from @/i18n/navigation
  const pathname = usePathname();      // from @/i18n/navigation (no locale prefix)

  function toggleLocale() {
    const next = locale === 'en' ? 'fi' : 'en';
    localStorage.setItem('nutripare-locale', next);
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=...`;
    startTransition(() => router.replace(pathname, { locale: next }));
  }
  return { locale, toggleLocale, isPending };
}
```

### Navbar locale button
```tsx
<Button variant='ghost' size='icon' onClick={toggleLocale}>
  <span className='text-xs font-semibold' aria-hidden='true'>{locale.toUpperCase()}</span>
  <span className='sr-only'>{t('toggleLocale')}</span>
</Button>
```

### Translating constants at render time
```ts
// Nutrients (in nutrition-table.tsx, etc.)
const t = useTranslations('nutrients');
const rows = ROWS.map(row => ({ key: row.key, label: t(row.key) }));

// Rulesets (in nutrition-tab.tsx, etc.)
t(`rulesets.${ruleset.id}.name`)
t(`rulesets.${ruleset.id}.description`)

// Ratings (in help/page.tsx)
t(`ratings.${rule.rating}`)

// Help sections (in help-toc.tsx)
t(`helpSections.${section.id}`)
```

### `ratingDot` map fix (prerequisite in `help/page.tsx`)
Rekey on rating values before i18n work:
```ts
const ratingDot: Record<string, string> = {
  positive: 'bg-[var(--positive)]',
  info: 'bg-[var(--info)]',
  warning: 'bg-[var(--warning)]',
  negative: 'bg-destructive',
};
// Usage: ratingDot[rule.rating]  (no longer depends on translated display string)
```

### Test infrastructure
```ts
// tests/setup.ts additions
vi.mock('next-intl/server', () => ({
  getTranslations: async (opts?: any) => {
    const ns = typeof opts === 'string' ? opts : opts?.namespace;
    return (key: string) => (ns ? `${ns}.${key}` : key);
  },
  getMessages: async () => ({}),
  getLocale: async () => 'en',
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...props }: any) =>
    React.createElement('a', { href, ...props }, children),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
  redirect: vi.fn(),
}));

// tests/test-utils.tsx
import messages from '../messages/en.json';
export function renderWithI18n(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale='en' messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}
```

---

## Implementation Order

### Phase 1 — Infrastructure
1. `npm install next-intl`
2. Create `i18n/routing.ts`, `i18n/request.ts`, `i18n/navigation.ts`
3. Create `middleware.ts`
4. Update `next.config.ts`
5. Create `messages/en.json` (all keys, English values)
6. Create `messages/fi.json` (all keys, Finnish values — machine-assisted first pass)

### Phase 2 — Route restructuring
7. Create `app/[locale]/layout.tsx` (full shell)
8. Simplify `app/layout.tsx` to pass-through
9. Move all page files into `app/[locale]/`
10. Update all `next/link` and `next/navigation` imports to `@/i18n/navigation`

### Phase 3 — String extraction
11. Update pages and components to use `useTranslations` / `getTranslations`
12. Fix `ratingDot` map in `help/page.tsx` (prerequisite for Step 13)
13. Update `utils/constants.ts`: remove labels, delete constant maps
14. Update all consumers of removed fields
15. Add `generateMetadata()` to each page

### Phase 4 — Locale toggle
16. Create `hooks/use-locale.ts`
17. Add locale toggle button to `components/navbar.tsx`

### Phase 5 — Tests
18. Update `tests/setup.ts`
19. Create `tests/test-utils.tsx`
20. Update all existing test files (navigation mocks, string assertions)
21. Add `tests/locale-toggle.test.tsx`; extend `tests/navbar.test.tsx`

### Phase 6 — Post-deploy
22. No Firebase console changes needed. Smoke-test the email verification flow in both locales to confirm the cookie-based locale detection on `/auth/action` works correctly.

---

## Verification

- `npm run dev` — visit `/`, confirm redirect to `/en/`
- Toggle language in navbar — URL changes to `/fi/`, all strings render in Finnish
- Reload at `/fi/compare` — stays in Finnish
- Share `/fi/compare` link in a new browser tab — opens in Finnish
- All `sr-only` text and ARIA labels are translated
- `npm run test -- --run` — all tests pass
- `npm run build` — no type errors, no missing translation keys at build time
