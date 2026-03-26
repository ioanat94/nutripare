import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Check,
  ExternalLink,
  MoreHorizontal,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { HelpToc, HelpTocMobile } from '@/components/help-toc';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'searching', label: 'Searching for Products' },
  { id: 'nutrition-table', label: 'The Nutrition Table' },
  { id: 'table-actions', label: 'Table Actions' },
  { id: 'saving', label: 'Saving Products and Comparisons' },
  { id: 'settings-account', label: 'Settings — Account' },
  { id: 'settings-nutrition', label: 'Settings — Nutrition' },
  { id: 'settings-products', label: 'Settings — Products' },
  { id: 'settings-comparisons', label: 'Settings — Comparisons' },
  { id: 'account-features', label: 'Signed-in vs. Signed-out' },
  { id: 'faq', label: 'FAQ' },
];

const defaultThresholds = [
  { nutrient: 'Protein', threshold: 'above', value: '20g', rating: 'Great' },
  { nutrient: 'Sugar', threshold: 'below', value: '5g', rating: 'Great' },
  { nutrient: 'Sugar', threshold: 'above', value: '22.5g', rating: 'Bad' },
  {
    nutrient: 'Saturated Fat',
    threshold: 'below',
    value: '1.5g',
    rating: 'Great',
  },
  { nutrient: 'Saturated Fat', threshold: 'above', value: '5g', rating: 'Bad' },
  { nutrient: 'Fiber', threshold: 'above', value: '6g', rating: 'Great' },
  { nutrient: 'Salt', threshold: 'below', value: '0.3g', rating: 'Great' },
  { nutrient: 'Salt', threshold: 'above', value: '1.5g', rating: 'Bad' },
];

const ratingDot: Record<string, string> = {
  Great: 'bg-[var(--positive)]',
  Good: 'bg-[var(--info)]',
  Concerning: 'bg-[var(--warning)]',
  Bad: 'bg-destructive',
};

export default function HelpPage() {
  return (
    <main className='mx-auto w-full max-w-5xl px-6 py-12'>
      <h1 className='mb-10 text-3xl font-bold tracking-tight'>User Guide</h1>
      <div className='flex gap-12'>
        <HelpToc sections={SECTIONS} />

        <div className='min-w-0 flex-1'>
          {/* Mobile ToC */}
          <HelpTocMobile sections={SECTIONS} />

          <div className='mt-10 space-y-16 lg:mt-0'>
            {/* 1. Overview */}
            <section id='overview'>
              <h2 className='mb-4 text-2xl font-semibold'>Overview</h2>
              <div className='space-y-3 text-base text-muted-foreground'>
                <p>
                  Nutripare lets you look up food products by EAN barcode,
                  display their nutritional values side by side, and highlight
                  differences based on configurable rules. Enter one or more
                  barcodes on the Compare page and instantly see how products
                  stack up across protein, sugar, fat, salt, and more.
                </p>
                <p>
                  Product data comes from{' '}
                  <a
                    href='https://world.openfoodfacts.org'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4 hover:text-primary'
                  >
                    Open Food Facts
                    <ExternalLink className='size-3.5' aria-hidden='true' />
                  </a>
                  , a free collaborative database maintained by volunteers.
                  Values may be incomplete or inaccurate — always verify
                  important information against the physical product label.
                </p>
              </div>
            </section>

            {/* 2. Searching for Products */}
            <section id='searching'>
              <h2 className='mb-4 text-2xl font-semibold'>
                Searching for Products
              </h2>
              <div className='space-y-3 text-base text-muted-foreground'>
                <p>
                  EAN barcodes are entered into the search field on the Compare
                  page. Valid codes are 8, 12, or 13 digits long — shorter or
                  longer values are rejected immediately.
                </p>
                <p>
                  You can enter a single EAN to look up one product, or enter
                  multiple EANs at once by separating them with commas:{' '}
                  <code className='rounded bg-muted px-1 py-0.5 text-foreground'>
                    5000112637922, 8076809513388
                  </code>
                  . After the first product loads, additional products can be
                  added one at a time or in bulk using the same input field —
                  they are appended as new columns in the table.
                </p>
                <p>
                  The{' '}
                  <span className='text-foreground font-medium'>
                    barcode scanner button
                  </span>{' '}
                  opens the device camera to scan a physical barcode.
                  Low-resolution webcams can produce inconsistent results, so
                  manual entry is recommended as a fallback if scanning is
                  unreliable.
                </p>
                <p>Two error states are displayed in amber below the input:</p>
                <ul className='list-disc space-y-1 pl-5'>
                  <li>
                    <span className='text-foreground'>Invalid EAN format</span>{' '}
                    — the code is not a valid 8, 12, or 13-digit EAN.
                  </li>
                  <li>
                    <span className='text-foreground'>Product not found</span> —
                    the code is valid but no matching product exists in Open
                    Food Facts.
                  </li>
                </ul>
              </div>
            </section>

            {/* 3. The Nutrition Table */}
            <section id='nutrition-table'>
              <h2 className='mb-4 text-2xl font-semibold'>
                The Nutrition Table
              </h2>
              <div className='space-y-3 text-base text-muted-foreground'>
                <p>
                  Each product appears as a column. All values are per 100g.
                </p>

                <h3 className='text-base font-semibold text-foreground pt-2'>
                  Color coding
                </h3>
                <ul className='space-y-1.5 pl-1'>
                  {[
                    {
                      dot: 'bg-[var(--positive)]',
                      label: 'Green (great)',
                      desc: 'the value meets a "great" threshold rule.',
                    },
                    {
                      dot: 'bg-[var(--info)]',
                      label: 'Blue (good)',
                      desc: 'the value meets a "good" threshold rule.',
                    },
                    {
                      dot: 'bg-[var(--warning)]',
                      label: 'Amber (concerning)',
                      desc: 'the value meets a "concerning" threshold rule.',
                    },
                    {
                      dot: 'bg-destructive',
                      label: 'Red (bad)',
                      desc: 'the value meets a "bad" threshold rule.',
                    },
                  ].map(({ dot, label, desc }) => (
                    <li key={label} className='flex items-start gap-2'>
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${dot}`}
                      />
                      <span>
                        <span className='text-foreground font-medium'>
                          {label}
                        </span>{' '}
                        — {desc}
                      </span>
                    </li>
                  ))}
                  <li className='flex items-start gap-2'>
                    <span className='mt-1.5 size-2 shrink-0 rounded-full bg-border' />
                    <span>
                      <span className='text-foreground font-medium'>
                        No color
                      </span>{' '}
                      — the value does not match any rule, or no rules are
                      defined for that nutrient.
                    </span>
                  </li>
                </ul>

                <h3 className='text-base font-semibold text-foreground pt-2'>
                  Emoji flags
                </h3>
                <ul className='space-y-1.5 pl-1'>
                  <li>
                    <span className='text-foreground font-medium'>
                      Crown (&#x1F451;)
                    </span>{' '}
                    — shown on the best value across products for a nutrient
                    that has a &ldquo;great&rdquo; rule.
                  </li>
                  <li>
                    <span className='text-foreground font-medium'>
                      Red flag (&#x1F6A9;)
                    </span>{' '}
                    — shown on the worst value across products for a nutrient
                    that has a &ldquo;bad&rdquo; rule.
                  </li>
                </ul>
                <p>
                  Emojis only appear when comparing two or more products, and
                  can be hidden in Settings.
                </p>

                <h3 className='text-base font-semibold text-foreground pt-2'>
                  Default thresholds
                </h3>
                <p>
                  The app ships with a built-in default ruleset based on the{' '}
                  <span className='text-foreground font-medium'>
                    UK Food Standards Agency (FSA) per-100g traffic light
                    thresholds
                  </span>
                  , which are also widely used across the EU for front-of-pack
                  nutrition labeling. These defaults apply to signed-out users
                  and to signed-in users who have not yet customized their
                  settings.
                </p>
                <div className='overflow-x-auto rounded-md border border-border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nutrient</TableHead>
                        <TableHead>Threshold</TableHead>
                        <TableHead>Value (per 100g)</TableHead>
                        <TableHead>Rating</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {defaultThresholds.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.nutrient}</TableCell>
                          <TableCell>{row.threshold}</TableCell>
                          <TableCell>{row.value}</TableCell>
                          <TableCell>
                            <span className='flex items-center gap-1.5'>
                              <span
                                className={`size-2 shrink-0 rounded-full ${ratingDot[row.rating]}`}
                              />
                              {row.rating}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <h3 className='text-base font-semibold text-foreground pt-2'>
                  Sorting
                </h3>
                <p>
                  Clicking any row label sorts all product columns by that
                  nutrient, highest to lowest. Clicking again reverses the sort.
                  The active sort column is highlighted and shows an arrow
                  indicator.
                </p>

                <h3 className='text-base font-semibold text-foreground pt-2'>
                  Computed Score
                </h3>
                <p>
                  A single 0–100 score calculated from the active ruleset
                  appears at the bottom of the table. It reflects how well a
                  product performs across all rules — positive rules raise the
                  score, negative rules lower it. Hovering the help icon next to
                  the label shows a brief tooltip.
                </p>
                <p>The score is computed as follows:</p>
                <ol className='list-decimal space-y-2 pl-5'>
                  <li>
                    For each rule that fires (the product&apos;s value meets the
                    rule&apos;s condition), a weighted contribution is
                    calculated. The weight depends on the rating: Great = +3,
                    Good = +1, Concerning = −1, Bad = −3.
                  </li>
                  <li>
                    The contribution is scaled by how far the value exceeds the
                    threshold:{' '}
                    <code className='rounded bg-muted px-1 py-0.5 text-foreground'>
                      weight × log(1 + distance / max(threshold, 1))
                    </code>
                    , where distance is{' '}
                    <code className='rounded bg-muted px-1 py-0.5 text-foreground'>
                      |value − threshold|
                    </code>
                    .
                  </li>
                  <li>
                    All contributions are summed into a raw score, then mapped
                    to the 0–100 range using:{' '}
                    <code className='rounded bg-muted px-1 py-0.5 text-foreground'>
                      round(50 × (1 + tanh(rawScore / 3)))
                    </code>
                    , clamped to [0, 100].
                  </li>
                </ol>
                <p>
                  A score of 50 is neutral (no rules fire). Scores above 50
                  indicate a generally healthy profile under the active ruleset;
                  scores below 50 indicate the opposite. Nutrients with missing
                  values are skipped and do not affect the score.
                </p>
              </div>
            </section>

            {/* 4. Table Actions */}
            <section id='table-actions'>
              <h2 className='mb-4 text-2xl font-semibold'>Table Actions</h2>
              <div className='space-y-3 text-base text-muted-foreground'>
                <p>
                  The{' '}
                  <span className='font-medium text-foreground'>
                    <MoreHorizontal
                      className='mb-0.5 inline size-4 align-middle'
                      aria-hidden='true'
                    />{' '}
                    menu
                  </span>{' '}
                  in the top-right of the table gives access to table-wide
                  actions:
                </p>
                <ul className='list-disc space-y-1.5 pl-5'>
                  <li>
                    <span className='text-foreground font-medium'>
                      Switch ruleset
                    </span>{' '}
                    (signed-in users) — changes which ruleset is used for
                    highlights and scoring.
                  </li>
                  <li>
                    <span className='text-foreground font-medium'>
                      Save comparison / Update comparison / Save as new
                      comparison
                    </span>{' '}
                    — see Saving below.
                  </li>
                  <li>
                    <span className='text-foreground font-medium'>Share</span> —
                    copies a shareable URL for the current set of products to
                    the clipboard.
                  </li>
                  <li>
                    <span className='text-foreground font-medium'>
                      Clear all
                    </span>{' '}
                    — removes all products from the table.
                  </li>
                </ul>
                <p>
                  Each product column also has its own{' '}
                  <span className='font-medium text-foreground'>
                    <MoreHorizontal
                      className='mb-0.5 inline size-4 align-middle'
                      aria-hidden='true'
                    />{' '}
                    menu
                  </span>{' '}
                  with:
                </p>
                <ul className='list-disc space-y-1.5 pl-5'>
                  <li>
                    <span className='text-foreground font-medium'>
                      Save product / Unsave product
                    </span>{' '}
                    (signed-in users only).
                  </li>
                  <li>
                    <span className='text-foreground font-medium'>Share</span> —
                    copies a shareable URL for just that product.
                  </li>
                  <li>
                    <span className='text-foreground font-medium'>Remove</span>{' '}
                    — removes the product column from the table.
                  </li>
                </ul>
              </div>
            </section>

            {/* 5. Saving */}
            <section id='saving'>
              <h2 className='mb-4 text-2xl font-semibold'>
                Saving Products and Comparisons
              </h2>
              <div className='space-y-3 text-base text-muted-foreground'>
                <p>
                  Signed-in users can save individual products via the
                  per-column menu. Saved products are stored in the Products tab
                  under Settings.
                </p>
                <p>
                  Signed-in users can save the current set of two or more
                  products as a named comparison. A dialog prompts for a name
                  (pre-filled with a suggestion). Saved comparisons appear in
                  the Comparisons tab under Settings.
                </p>
                <p>
                  When a saved comparison is loaded (via the Comparisons tab or
                  a shared URL), the table shows its name and tracks whether the
                  products have been modified since loading. If modified, the{' '}
                  <span className='font-medium text-foreground'>
                    <MoreHorizontal
                      className='mb-0.5 inline size-4 align-middle'
                      aria-hidden='true'
                    />{' '}
                    menu
                  </span>{' '}
                  offers{' '}
                  <span className='text-foreground font-medium'>
                    Update [name]
                  </span>{' '}
                  (overwrite) or{' '}
                  <span className='text-foreground font-medium'>
                    Save as new comparison
                  </span>
                  .
                </p>
                <p>
                  To delete a saved comparison from the table view, use{' '}
                  <span className='text-foreground font-medium'>
                    Delete [name]
                  </span>{' '}
                  in the{' '}
                  <span className='font-medium text-foreground'>
                    <MoreHorizontal
                      className='mb-0.5 inline size-4 align-middle'
                      aria-hidden='true'
                    />{' '}
                    menu
                  </span>
                  . To unsave an individual product, use{' '}
                  <span className='text-foreground font-medium'>
                    Unsave product
                  </span>{' '}
                  in the per-column menu.
                </p>
              </div>
            </section>

            {/* 6. Settings — Account */}
            <section id='settings-account'>
              <h2 className='mb-4 text-2xl font-semibold'>
                Settings — Account
              </h2>
              <p className='text-base text-muted-foreground'>
                The Account tab lets you manage your signed-in account: update
                your display name, change your email address, set a new
                password, and sign out.
              </p>
            </section>

            {/* 7. Settings — Nutrition */}
            <section id='settings-nutrition'>
              <h2 className='mb-4 text-2xl font-semibold'>
                Settings — Nutrition
              </h2>
              <div className='space-y-3 text-base text-muted-foreground'>
                <p>
                  <span className='text-foreground font-medium'>
                    Visible rows
                  </span>{' '}
                  — checkboxes control which nutrient rows appear in the table.
                  The drag handle to the left of each row allows reordering —
                  the order is reflected in the table.
                </p>
                <p>
                  <span className='text-foreground font-medium'>
                    Highlights
                  </span>{' '}
                  — two toggles, &ldquo;Show crown (&#x1F451;)&rdquo; and
                  &ldquo;Show flag (&#x1F6A9;)&rdquo;, enable or disable the
                  emoji indicators globally.
                </p>
                <p>
                  <span className='text-foreground font-medium'>Rulesets</span>{' '}
                  — a list of saved rulesets. Each ruleset defines which
                  nutrients are highlighted and how. Use the search box to
                  filter by name; drag handles allow reordering the list.
                </p>
                <ul className='list-disc space-y-1.5 pl-5'>
                  <li>
                    Clicking the{' '}
                    <span className='text-foreground font-medium'>
                      eye icon
                    </span>{' '}
                    opens the ruleset editor.
                  </li>
                  <li>
                    Clicking the{' '}
                    <span className='text-foreground font-medium'>
                      trash icon
                    </span>{' '}
                    (with confirmation) deletes the ruleset.
                  </li>
                  <li>
                    <span className='text-foreground font-medium'>
                      Add ruleset
                    </span>{' '}
                    creates a new empty ruleset and opens the editor
                    immediately.
                  </li>
                </ul>
                <p>In the ruleset editor:</p>
                <ul className='list-disc space-y-1.5 pl-5'>
                  <li>The ruleset name is editable inline at the top.</li>
                  <li>
                    Each rule defines: nutrient, direction (above/below),
                    threshold value, and rating (great / good / concerning /
                    bad).
                  </li>
                  <li>
                    Rules can be reordered by dragging. This is purely for
                    organizational purposes and does not affect the scoring.
                  </li>
                  <li>
                    <span className='text-foreground font-medium'>
                      Add rule
                    </span>{' '}
                    appends a new blank rule row.
                  </li>
                  <li>
                    <span className='text-foreground font-medium'>
                      Reset to defaults
                    </span>{' '}
                    restores the built-in default rules (disabled when already
                    at defaults).
                  </li>
                  <li>
                    <span className='text-foreground font-medium'>Save</span>{' '}
                    persists the ruleset.
                  </li>
                  <li>
                    <span className='text-foreground font-medium'>
                      Delete ruleset
                    </span>{' '}
                    removes it (with confirmation); disabled for newly created
                    unsaved rulesets.
                  </li>
                  <li>
                    <span className='text-foreground font-medium'>Cancel</span>{' '}
                    discards unsaved changes; cancelling a new ruleset also
                    removes it from the list.
                  </li>
                </ul>
                <p>
                  Changes to visible rows, row order, and highlight toggles
                  require clicking the main{' '}
                  <span className='text-foreground font-medium'>Save</span>{' '}
                  button at the bottom of the tab.
                </p>
              </div>
            </section>

            {/* 8. Settings — Products */}
            <section id='settings-products'>
              <h2 className='mb-4 text-2xl font-semibold'>
                Settings — Products
              </h2>
              <div className='space-y-3 text-base text-muted-foreground'>
                <p>
                  Lists all saved products in a searchable table. Search by name
                  or EAN to filter the list.
                </p>
                <ul className='list-disc space-y-1.5 pl-5'>
                  <li>
                    The{' '}
                    <span className='text-foreground font-medium'>
                      view button
                    </span>{' '}
                    opens the product on the Compare page in a new tab.
                  </li>
                  <li>
                    The{' '}
                    <span className='text-foreground font-medium'>
                      unsave button
                    </span>{' '}
                    removes the product from your saved list.
                  </li>
                </ul>
                <p>
                  Checking two or more products enables a{' '}
                  <span className='text-foreground font-medium'>Compare</span>{' '}
                  button at the bottom that opens those products on the Compare
                  page in a new tab.
                </p>
              </div>
            </section>

            {/* 9. Settings — Comparisons */}
            <section id='settings-comparisons'>
              <h2 className='mb-4 text-2xl font-semibold'>
                Settings — Comparisons
              </h2>
              <div className='space-y-3 text-base text-muted-foreground'>
                <p>
                  Lists all saved comparisons in a searchable table. Search by
                  name or EAN to filter the list. Each row shows the comparison
                  name and the EAN codes it contains.
                </p>
                <ul className='list-disc space-y-1.5 pl-5'>
                  <li>
                    The{' '}
                    <span className='text-foreground font-medium'>
                      pencil icon
                    </span>{' '}
                    puts the row into rename mode — confirm with the checkmark
                    or cancel with the X.
                  </li>
                  <li>
                    The{' '}
                    <span className='text-foreground font-medium'>
                      view button
                    </span>{' '}
                    opens the comparison on the Compare page in a new tab.
                  </li>
                  <li>
                    The{' '}
                    <span className='text-foreground font-medium'>
                      unsave button
                    </span>{' '}
                    removes the comparison from your saved list.
                  </li>
                </ul>
              </div>
            </section>

            {/* 10. Signed-in vs. Signed-out */}
            <section id='account-features'>
              <h2 className='mb-4 text-2xl font-semibold'>
                Signed-in vs. Signed-out
              </h2>
              <div className='overflow-x-auto rounded-xl border border-border'>
                <table className='w-full text-base'>
                  <thead>
                    <tr className='border-b border-border'>
                      <th className='px-4 py-3 text-left font-medium text-muted-foreground w-full' />
                      <th className='px-4 py-3 text-center min-w-16 sm:min-w-24'>
                        <UserX
                          className='mx-auto size-5 text-muted-foreground'
                          aria-label='Signed out'
                        />
                      </th>
                      <th className='w-16 px-4 py-3 text-center bg-primary/5 sm:w-24'>
                        <UserCheck
                          className='mx-auto size-5 text-primary'
                          aria-label='Signed in'
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        label: 'Search and compare products',
                        out: true,
                        in: true,
                      },
                      {
                        label: 'Color-coded nutrition highlights',
                        out: true,
                        in: true,
                      },
                      { label: 'Table sorting', out: true, in: true },
                      {
                        label: 'Share products and comparisons via URL',
                        out: true,
                        in: true,
                      },
                      {
                        label: 'Save and manage products',
                        out: false,
                        in: true,
                      },
                      {
                        label: 'Save and manage comparisons',
                        out: false,
                        in: true,
                      },
                      {
                        label: 'Create and customize rulesets',
                        out: false,
                        in: true,
                      },
                      {
                        label: 'Control visible rows and order',
                        out: false,
                        in: true,
                      },
                      {
                        label: 'Toggle crown and flag indicators',
                        out: false,
                        in: true,
                      },
                      {
                        label: 'Switch rulesets on the Compare page',
                        out: false,
                        in: true,
                      },
                      {
                        label: 'Settings synced across devices',
                        out: false,
                        in: true,
                      },
                    ].map((row, i) => (
                      <tr
                        key={row.label}
                        className={
                          i % 2 === 0 ? 'bg-transparent' : 'bg-muted/20'
                        }
                      >
                        <td className='px-4 py-3 text-muted-foreground'>
                          {row.label}
                        </td>
                        <td className='px-4 py-3 text-center'>
                          {row.out ? (
                            <Check
                              className='mx-auto size-4 text-positive'
                              aria-label='Yes'
                            />
                          ) : (
                            <X
                              className='mx-auto size-4 text-destructive/40'
                              aria-label='No'
                            />
                          )}
                        </td>
                        <td className='px-4 py-3 text-center bg-primary/5 min-w-16 sm:min-w-24'>
                          {row.in ? (
                            <Check
                              className='mx-auto size-4 text-positive'
                              aria-label='Yes'
                            />
                          ) : (
                            <X
                              className='mx-auto size-4 text-destructive/40'
                              aria-label='No'
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* FAQ */}
            <section id='faq'>
              <h2 className='mb-8 text-2xl font-semibold'>FAQ</h2>
              <div className='space-y-10'>
                {/* Scanning & Products */}
                <div>
                  <h3 className='mb-3 text-base font-semibold text-muted-foreground uppercase tracking-wide'>
                    Scanning &amp; Products
                  </h3>
                  <Accordion multiple className='w-full'>
                    <AccordionItem value='barcode-not-recognized'>
                      <AccordionTrigger>
                        Why isn&apos;t my barcode being recognized?
                      </AccordionTrigger>
                      <AccordionContent className='text-muted-foreground'>
                        Nutripare accepts EAN barcodes that are 8, 12, or 13
                        digits long. Shorter or longer values are rejected
                        immediately. If your code is the right length but still
                        fails, the product may not exist in the Open Food Facts
                        database — try searching for it directly on{' '}
                        <a
                          href='https://world.openfoodfacts.org'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex items-center gap-1'
                        >
                          world.openfoodfacts.org
                          <ExternalLink className='size-3' aria-hidden='true' />
                        </a>
                        .
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value='data-source'>
                      <AccordionTrigger>
                        Where does the product data come from?
                      </AccordionTrigger>
                      <AccordionContent className='text-muted-foreground'>
                        All product data comes from{' '}
                        <a
                          href='https://world.openfoodfacts.org'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex items-center gap-1'
                        >
                          Open Food Facts
                          <ExternalLink className='size-3' aria-hidden='true' />
                        </a>
                        , a free collaborative database maintained by volunteers
                        worldwide. Values may be incomplete or inaccurate —
                        always verify important nutritional information against
                        the physical product label.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value='missing-product'>
                      <AccordionTrigger>
                        Can I add a product that isn&apos;t in the database?
                      </AccordionTrigger>
                      <AccordionContent className='text-muted-foreground'>
                        Not directly through Nutripare. If a product is missing,
                        you can contribute it to Open Food Facts using their
                        website or mobile app — once added there, it will be
                        available in Nutripare too.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Scoring */}
                <div>
                  <h3 className='mb-3 text-base font-semibold text-muted-foreground uppercase tracking-wide'>
                    Scoring
                  </h3>
                  <Accordion multiple className='w-full'>
                    <AccordionItem value='score-meaning'>
                      <AccordionTrigger>
                        What does the nutrition score actually measure?
                      </AccordionTrigger>
                      <AccordionContent className='text-muted-foreground'>
                        The score (0–100) is built from your nutrition rules,
                        each of which has a direction and a rating. Great and
                        good rules (e.g. protein above 20g) push the score up
                        when they fire; caution and bad rules (e.g. sugar above
                        22.5g) push it down. The further a value is past its
                        threshold, the larger the contribution. A product where
                        no rules fire at all scores exactly 50. The score is
                        entirely driven by your personal rules — changing
                        thresholds, directions, or ratings will change it.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value='low-score'>
                      <AccordionTrigger>
                        Why does a product I think is healthy have a low score?
                      </AccordionTrigger>
                      <AccordionContent className='text-muted-foreground'>
                        The score is only as good as the rules behind it. If a
                        nutrient has a strict threshold and the product exceeds
                        it — even slightly — it will drag the score down. You
                        can review and adjust your thresholds in{' '}
                        <span className='font-medium text-foreground'>
                          Settings → Nutrition
                        </span>{' '}
                        to better reflect your own dietary priorities.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value='similar-scores'>
                      <AccordionTrigger>
                        Why do two products with similar nutrition have very
                        different scores?
                      </AccordionTrigger>
                      <AccordionContent className='text-muted-foreground'>
                        The score is non-linear — exceeding a threshold has a
                        larger impact the further over it you go. A product that
                        is slightly over on many nutrients can score very
                        differently from one that is well within limits on most
                        but heavily over on one. Weights assigned to each
                        nutrient in your rules also affect the balance.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Comparisons & Settings */}
                <div>
                  <h3 className='mb-3 text-base font-semibold text-muted-foreground uppercase tracking-wide'>
                    Comparisons &amp; Settings
                  </h3>
                  <Accordion multiple className='w-full'>
                    <AccordionItem value='compare-limit'>
                      <AccordionTrigger>
                        Can I compare more than two products at once?
                      </AccordionTrigger>
                      <AccordionContent className='text-muted-foreground'>
                        Yes — there is no hard limit. You can add as many
                        products as you like by entering additional barcodes
                        into the search field. Each new product is appended as a
                        new column in the table. Keep in mind that comparing a
                        large number of products at once may affect performance.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value='save-difference'>
                      <AccordionTrigger>
                        What&apos;s the difference between saving a product and
                        saving a comparison?
                      </AccordionTrigger>
                      <AccordionContent className='text-muted-foreground'>
                        Saving a{' '}
                        <span className='font-medium text-foreground'>
                          product
                        </span>{' '}
                        bookmarks a single item so you can quickly load it again
                        later from the Products tab in Settings. Saving a{' '}
                        <span className='font-medium text-foreground'>
                          comparison
                        </span>{' '}
                        saves the full set of products currently in the table
                        together, so you can restore the entire comparison in
                        one step from the Comparisons tab.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value='rules-update'>
                      <AccordionTrigger>
                        If I change my nutrition rules, do my old comparisons
                        update?
                      </AccordionTrigger>
                      <AccordionContent className='text-muted-foreground'>
                        Scores and highlights are calculated live each time you
                        load a comparison, so they always reflect your current
                        rules. However, if a comparison was saved with a
                        specific ruleset, it will load using that ruleset by
                        default — you can switch rulesets from the table header.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value='reset-settings'>
                      <AccordionTrigger>
                        What happens if I reset a ruleset?
                      </AccordionTrigger>
                      <AccordionContent className='text-muted-foreground'>
                        Resetting a ruleset restores its rules to the default
                        thresholds, discarding any changes you&apos;ve made to
                        it. Other rulesets, display preferences, and visible
                        nutrients are unaffected.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Account */}
                <div>
                  <h3 className='mb-3 text-base font-semibold text-muted-foreground uppercase tracking-wide'>
                    Account
                  </h3>
                  <Accordion multiple className='w-full'>
                    <AccordionItem value='need-account'>
                      <AccordionTrigger>
                        Do I need an account to use the app?
                      </AccordionTrigger>
                      <AccordionContent className='text-muted-foreground'>
                        No. You can look up products and compare them without
                        signing in. An account is only needed if you want to
                        save products, save comparisons, or sync your nutrition
                        settings across devices.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value='data-stored'>
                      <AccordionTrigger>
                        What data is stored when I create an account?
                      </AccordionTrigger>
                      <AccordionContent className='text-muted-foreground'>
                        Only what you explicitly create: your email address,
                        display name, saved products, saved comparisons, and
                        nutrition settings. No tracking, analytics, or
                        advertising data is collected. See the{' '}
                        <a href='/privacy'>Privacy Policy</a> for full details.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value='multiple-devices'>
                      <AccordionTrigger>
                        Can I use the app on multiple devices?
                      </AccordionTrigger>
                      <AccordionContent className='text-muted-foreground'>
                        Yes. Your saved products, comparisons, and nutrition
                        settings are stored in the cloud and will be available
                        on any device you sign in to.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* General */}
                <div>
                  <h3 className='mb-3 text-base font-semibold text-muted-foreground uppercase tracking-wide'>
                    General
                  </h3>
                  <Accordion multiple className='w-full'>
                    <AccordionItem value='offline'>
                      <AccordionTrigger>
                        Does the app work offline?
                      </AccordionTrigger>
                      <AccordionContent className='text-muted-foreground'>
                        No. Product lookups require a live connection to the
                        Open Food Facts API, and saving data requires a
                        connection to the database. The app will not function
                        without internet access.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value='traffic-light'>
                      <AccordionTrigger>
                        What do the traffic light colors on each nutrient mean?
                      </AccordionTrigger>
                      <AccordionContent className='text-muted-foreground'>
                        Each nutrient cell is colored based on the rating of the
                        rule that fires for that value.{' '}
                        <span className='font-medium text-positive'>Green</span>{' '}
                        means a great rule fired,{' '}
                        <span className='font-medium text-info'>blue</span>{' '}
                        means good,{' '}
                        <span className='font-medium text-warning'>amber</span>{' '}
                        means caution, and{' '}
                        <span className='font-medium text-destructive'>
                          red
                        </span>{' '}
                        means bad. No color means no rule fired for that
                        nutrient — either no rule is configured, or the value
                        didn&apos;t cross its threshold.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
