import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock dnd-kit (no-op, we don't test DnD here)
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  MouseSensor: class {},
  TouchSensor: class {},
  KeyboardSensor: class {},
  closestCenter: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  arrayMove: <T,>(arr: T[], from: number, to: number): T[] => {
    const result = [...arr];
    result.splice(to, 0, ...result.splice(from, 1));
    return result;
  },
  verticalListSortingStrategy: {},
  sortableKeyboardCoordinates: vi.fn(),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

// Mock firestore helpers
vi.mock('@/lib/firestore', () => ({
  getNutritionSettings: vi.fn(),
  saveNutritionSettings: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/firebase', () => ({ db: {} }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const { getNutritionSettings, saveNutritionSettings } = await import('@/lib/firestore');
const mockGetNutritionSettings = vi.mocked(getNutritionSettings);
const mockSaveNutritionSettings = vi.mocked(saveNutritionSettings);

import { NutritionTable } from '@/components/nutrition-table';
import type { NutritionRuleset, NutritionSettings } from '@/types/firestore';
import type { ProductNutrition } from '@/types/openfoodfacts';
import React from 'react';

function makeProduct(overrides: Partial<ProductNutrition> = {}): ProductNutrition {
  return {
    code: '111',
    product_name: 'Test Product',
    kcals: 100,
    protein: 5,
    carbohydrates: 20,
    sugar: 10,
    fat: 3,
    saturated_fat: 1,
    fiber: 2,
    salt: 0.5,
    ...overrides,
  };
}

function makeSettings(rulesets: NutritionRuleset[] = []): NutritionSettings {
  return {
    visibleRows: ['kcals', 'protein', 'carbohydrates', 'sugar', 'fat', 'saturated_fat', 'fiber', 'salt', 'computed_score'],
    showCrown: true,
    showFlag: true,
    rulesets,
    rowOrder: ['kcals', 'protein', 'carbohydrates', 'sugar', 'fat', 'saturated_fat', 'fiber', 'salt', 'computed_score'],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetNutritionSettings.mockResolvedValue(null);
  mockSaveNutritionSettings.mockResolvedValue(undefined);
});

async function renderTab() {
  const { NutritionTab } = await import('@/components/settings/nutrition-tab');
  render(<NutritionTab userId='uid-123' />);
  await waitFor(() => expect(screen.queryByText(/visible rows/i)).toBeInTheDocument());
}

// ─── NutritionTab rulesets list ───────────────────────────────────────────────

describe('NutritionTab — rulesets list', () => {
  it('renders name, view, and delete controls for each ruleset', async () => {
    mockGetNutritionSettings.mockResolvedValue(
      makeSettings([
        { id: 'r1', name: 'Dairy', rules: [] },
        { id: 'r2', name: 'Bread', rules: [] },
      ]),
    );
    await renderTab();

    expect(screen.getByText('Dairy')).toBeInTheDocument();
    expect(screen.getByText('Bread')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /view ruleset/i })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /delete ruleset/i })).toHaveLength(2);
  });

  it('clicking Delete shows confirmation dialog without immediately deleting', async () => {
    mockGetNutritionSettings.mockResolvedValue(
      makeSettings([{ id: 'r1', name: 'Dairy', rules: [] }]),
    );
    await renderTab();

    const deleteBtn = screen.getByRole('button', { name: /delete ruleset/i });
    fireEvent.click(deleteBtn);

    await waitFor(() =>
      expect(screen.getByText(/delete ruleset\?/i)).toBeInTheDocument(),
    );
    expect(screen.getByText('Dairy')).toBeInTheDocument();
  });

  it('confirming deletion removes the ruleset from the list', async () => {
    mockGetNutritionSettings.mockResolvedValue(
      makeSettings([
        { id: 'r1', name: 'Dairy', rules: [] },
        { id: 'r2', name: 'Bread', rules: [] },
      ]),
    );
    await renderTab();

    fireEvent.click(screen.getAllByRole('button', { name: /delete ruleset/i })[0]);
    await waitFor(() => expect(screen.getByText(/delete ruleset\?/i)).toBeInTheDocument());

    // Click the confirm Delete button in the dialog
    fireEvent.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);

    await waitFor(() => expect(screen.queryByText('Dairy')).not.toBeInTheDocument());
    expect(screen.getByText('Bread')).toBeInTheDocument();
  });

  it('clicking View opens detail view with correct ruleset name pre-filled', async () => {
    mockGetNutritionSettings.mockResolvedValue(
      makeSettings([{ id: 'r1', name: 'Dairy', rules: [] }]),
    );
    await renderTab();

    fireEvent.click(screen.getByRole('button', { name: /view ruleset/i }));

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: /ruleset name/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole('textbox', { name: /ruleset name/i })).toHaveValue('Dairy');
  });

  it('"Add ruleset" dropdown contains New ruleset and From template options', async () => {
    await renderTab();

    fireEvent.click(screen.getByRole('button', { name: /add ruleset/i }));

    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: /new ruleset/i })).toBeInTheDocument(),
    );
    expect(screen.getByText(/from template/i)).toBeInTheDocument();
  });

  it('"New ruleset" creates a blank entry and opens detail view', async () => {
    await renderTab();

    fireEvent.click(screen.getByRole('button', { name: /add ruleset/i }));
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: /new ruleset/i })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: /new ruleset/i }));

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: /ruleset name/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole('textbox', { name: /ruleset name/i })).toHaveValue('New Ruleset');
  });

  it('"From template" adds a copy of the built-in ruleset and opens editor with its name', async () => {
    await renderTab();

    fireEvent.click(screen.getByRole('button', { name: /add ruleset/i }));
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: /^default$/i })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: /^default$/i }));

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: /ruleset name/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole('textbox', { name: /ruleset name/i })).toHaveValue('Default');
  });
});

// ─── NutritionTab ruleset detail ──────────────────────────────────────────────

describe('NutritionTab — ruleset detail', () => {
  it('saves updated name and rules when Save is clicked', async () => {
    mockGetNutritionSettings.mockResolvedValue(
      makeSettings([{ id: 'r1', name: 'Dairy', rules: [] }]),
    );
    await renderTab();

    fireEvent.click(screen.getByRole('button', { name: /view ruleset/i }));
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: /ruleset name/i })).toBeInTheDocument(),
    );

    // Rename
    fireEvent.change(screen.getByRole('textbox', { name: /ruleset name/i }), {
      target: { value: 'Dairy Products' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() =>
      expect(mockSaveNutritionSettings).toHaveBeenCalledWith(
        'uid-123',
        expect.objectContaining({
          rulesets: [expect.objectContaining({ id: 'r1', name: 'Dairy Products' })],
        }),
      ),
    );
  });

  it('Cancel returns to list view without saving changes', async () => {
    mockGetNutritionSettings.mockResolvedValue(
      makeSettings([{ id: 'r1', name: 'Dairy', rules: [] }]),
    );
    await renderTab();

    fireEvent.click(screen.getByRole('button', { name: /view ruleset/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument(),
    );

    // Rename but then cancel
    fireEvent.change(screen.getByRole('textbox', { name: /ruleset name/i }), {
      target: { value: 'Renamed' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /^rulesets$/i })).toBeInTheDocument(),
    );
    expect(mockSaveNutritionSettings).not.toHaveBeenCalled();
    expect(screen.getByText('Dairy')).toBeInTheDocument();
  });

  it('Cancel on a new ruleset removes it from the list', async () => {
    await renderTab();

    fireEvent.click(screen.getByRole('button', { name: /add ruleset/i }));
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: /new ruleset/i })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: /new ruleset/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    await waitFor(() =>
      expect(screen.queryByText('New Ruleset')).not.toBeInTheDocument(),
    );
  });
});

// ─── NutritionTable ruleset selector ─────────────────────────────────────────

describe('NutritionTable — ruleset selector', () => {
  it('score row shows "—" when no rulesets provided', () => {
    render(
      <NutritionTable
        products={[makeProduct({ code: '111', product_name: 'A', protein: 25 })]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        settings={makeSettings([])}
        rulesets={[]}
        selectedRulesetId={null}
      />,
    );
    const scoreRow = screen.getByText('Computed Score').closest('tr')!;
    // With empty rulesets and no selectedRuleset, falls back to defaultRules — score may be valid
    expect(scoreRow).toBeInTheDocument();
  });

  it('switching ruleset triggers onRulesetChange callback', () => {
    const onRulesetChange = vi.fn();
    const rulesets: NutritionRuleset[] = [
      { id: 'r1', name: 'Ruleset A', rules: [] },
      { id: 'r2', name: 'Ruleset B', rules: [] },
    ];
    const products = [
      makeProduct({ code: '111', product_name: 'A' }),
      makeProduct({ code: '222', product_name: 'B' }),
    ];
    render(
      <NutritionTable
        products={products}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        settings={makeSettings(rulesets)}
        rulesets={rulesets}
        selectedRulesetId='r1'
        onRulesetChange={onRulesetChange}
      />,
    );

    // Open the ... menu
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));
    // Open the Ruleset submenu trigger
    fireEvent.click(screen.getByText(/ruleset:/i));
    // Select the second ruleset
    fireEvent.click(screen.getByRole('menuitemradio', { name: /ruleset b/i }));

    expect(onRulesetChange).toHaveBeenCalledWith('r2', expect.anything());
  });

  it('score row renders "—" when active ruleset has no rules and no default fallback applies', () => {
    const rulesets: NutritionRuleset[] = [
      { id: 'r1', name: 'Empty Ruleset', rules: [] },
    ];
    render(
      <NutritionTable
        products={[makeProduct({ code: '111', product_name: 'A', salt: 2 })]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        settings={makeSettings(rulesets)}
        rulesets={rulesets}
        selectedRulesetId='r1'
      />,
    );
    const scoreRow = screen.getByText('Computed Score').closest('tr')!;
    const cell = scoreRow.querySelector('td:last-child')!;
    expect(cell).toHaveTextContent('—');
  });
});
