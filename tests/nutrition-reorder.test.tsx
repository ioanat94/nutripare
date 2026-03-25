import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import type { ReactNode } from 'react';

// ---- Mock dnd-kit ----
const dragEndHandlers: Array<
  (event: { active: { id: unknown }; over: { id: unknown } | null }) => void
> = [];

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: { children: ReactNode; onDragEnd: (event: { active: { id: unknown }; over: { id: unknown } | null }) => void }) => {
    dragEndHandlers.push(onDragEnd);
    return <>{children}</>;
  },
  MouseSensor: class {},
  TouchSensor: class {},
  KeyboardSensor: class {},
  closestCenter: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <>{children}</>,
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

// ---- Mock firestore / firebase / sonner ----
vi.mock('@/lib/firestore', () => ({
  getNutritionSettings: vi.fn(),
  saveNutritionSettings: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const { getNutritionSettings, saveNutritionSettings } = await import('@/lib/firestore');
const mockGetNutritionSettings = vi.mocked(getNutritionSettings);
const mockSaveNutritionSettings = vi.mocked(saveNutritionSettings);

import { ROWS, NutritionTable } from '@/components/nutrition-table';
import type { NutritionSettings } from '@/types/firestore';
import type { ProductNutrition } from '@/types/openfoodfacts';

function makeSettings(overrides: Partial<NutritionSettings> = {}): NutritionSettings {
  return {
    visibleRows: [...ROWS.map((r) => r.key), 'computed_score'],
    showCrown: true,
    showFlag: true,
    rulesets: [],
    rowOrder: [...ROWS.map((r) => r.key), 'computed_score'],
    ...overrides,
  };
}

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

beforeEach(() => {
  vi.clearAllMocks();
  dragEndHandlers.length = 0;
  mockGetNutritionSettings.mockResolvedValue(null);
  mockSaveNutritionSettings.mockResolvedValue(undefined);
});

async function renderTab() {
  const { NutritionTab } = await import('@/components/settings/nutrition-tab');
  render(<NutritionTab userId='uid-123' />);
  await waitFor(() => expect(screen.queryByText(/visible rows/i)).toBeInTheDocument());
}

describe('NutritionTab reorder', () => {
  it('renders visible rows as a single-column list (no grid-cols-2)', async () => {
    await renderTab();
    const section = screen.getByRole('heading', { name: /visible rows/i }).closest('section')!;
    expect(section.querySelector('.grid-cols-2')).not.toBeInTheDocument();
  });

  it('renders a drag handle for each nutrient row', async () => {
    await renderTab();
    const handles = screen.getAllByTestId('nutrient-drag-handle');
    expect(handles).toHaveLength(ROWS.length + 1); // +1 for computed_score
  });

  it('renders a drag handle for each rule row in detail view', async () => {
    mockGetNutritionSettings.mockResolvedValue(
      makeSettings({
        rulesets: [{ id: 'default', name: 'Default', rules: [
          { nutrient: 'protein', direction: 'above', value: 20, rating: 'positive' },
          { nutrient: 'salt', direction: 'above', value: 1.5, rating: 'negative' },
        ]}],
      }),
    );
    await renderTab();
    fireEvent.click(screen.getByRole('button', { name: /view ruleset/i }));
    await waitFor(() => {
      const handles = screen.getAllByTestId('rule-drag-handle');
      expect(handles).toHaveLength(2);
    });
  });

  it('renders nutrients in the order from saved settings', async () => {
    const customOrder = ['protein', 'kcals', 'carbohydrates', 'sugar', 'fat', 'saturated_fat', 'fiber', 'salt', 'computed_score'];
    mockGetNutritionSettings.mockResolvedValue(makeSettings({ rowOrder: customOrder, rulesets: [] }));
    await renderTab();

    const labels = screen.getAllByRole('checkbox').map(
      (cb) => cb.closest('label')?.textContent?.trim() ?? '',
    );
    expect(labels[0]).toMatch(/protein/i);
    expect(labels[1]).toMatch(/calories/i);
  });

  it('renders rules in the order from saved settings (in detail view)', async () => {
    mockGetNutritionSettings.mockResolvedValue(
      makeSettings({
        rulesets: [{ id: 'default', name: 'Default', rules: [
          { nutrient: 'salt', direction: 'above', value: 1.5, rating: 'negative' },
          { nutrient: 'protein', direction: 'above', value: 20, rating: 'positive' },
        ]}],
      }),
    );
    await renderTab();
    fireEvent.click(screen.getByRole('button', { name: /view ruleset/i }));

    // The first rule's nutrient combobox should show Salt
    await waitFor(() => {
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes[0]).toHaveTextContent(/salt/i);
    });
  });

  it('reordering nutrients enables the Save button', async () => {
    mockGetNutritionSettings.mockResolvedValue(makeSettings());
    await renderTab();

    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    expect(saveBtn).toBeDisabled();

    // nutrientOrder is default: ['kcals', 'protein', ...] — swap first two
    const nutrientDragEnd = dragEndHandlers[dragEndHandlers.length - 2];
    act(() => {
      nutrientDragEnd({ active: { id: 'protein' }, over: { id: 'kcals' } });
    });

    await waitFor(() => expect(saveBtn).not.toBeDisabled());
  });

  it('reordering rulesets enables the Save button', async () => {
    mockGetNutritionSettings.mockResolvedValue(
      makeSettings({
        rulesets: [
          { id: 'r1', name: 'Ruleset 1', rules: [] },
          { id: 'r2', name: 'Ruleset 2', rules: [] },
        ],
      }),
    );
    await renderTab();

    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    expect(saveBtn).toBeDisabled();

    const rulesetDragEnd = dragEndHandlers[dragEndHandlers.length - 1];
    act(() => {
      rulesetDragEnd({ active: { id: 'r1' }, over: { id: 'r2' } });
    });

    await waitFor(() => expect(saveBtn).not.toBeDisabled());
  });

  it('saves rowOrder in new order after nutrient reorder', async () => {
    mockGetNutritionSettings.mockResolvedValue(makeSettings());
    await renderTab();

    const nutrientDragEnd = dragEndHandlers[dragEndHandlers.length - 2];
    act(() => {
      // Move protein (index 1) to before kcals (index 0)
      nutrientDragEnd({ active: { id: 'protein' }, over: { id: 'kcals' } });
    });

    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    await waitFor(() => expect(saveBtn).not.toBeDisabled());
    fireEvent.click(saveBtn);

    await waitFor(() => expect(mockSaveNutritionSettings).toHaveBeenCalled());
    const [, savedSettings] = mockSaveNutritionSettings.mock.calls[0];
    expect(savedSettings.rowOrder).toBeDefined();
    expect(savedSettings.rowOrder![0]).toBe('protein');
    expect(savedSettings.rowOrder![1]).toBe('kcals');
  });

  it('saves rules in new order after rule reorder in detail view', async () => {
    mockGetNutritionSettings.mockResolvedValue(
      makeSettings({
        rulesets: [{ id: 'default', name: 'Default', rules: [
          { nutrient: 'protein', direction: 'above', value: 20, rating: 'positive' },
          { nutrient: 'salt', direction: 'above', value: 1.5, rating: 'negative' },
        ]}],
      }),
    );
    await renderTab();

    // Navigate to detail view
    fireEvent.click(screen.getByRole('button', { name: /view ruleset/i }));
    await waitFor(() => screen.getAllByTestId('rule-drag-handle'));

    const ruleDragEnd = dragEndHandlers[dragEndHandlers.length - 1];
    act(() => {
      // Move rule-0 (protein) after rule-1 (salt)
      ruleDragEnd({ active: { id: 'rule-0' }, over: { id: 'rule-1' } });
    });

    // Click the detail view Save button
    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    fireEvent.click(saveBtn);

    await waitFor(() => expect(mockSaveNutritionSettings).toHaveBeenCalled());
    const [, savedSettings] = mockSaveNutritionSettings.mock.calls[0];
    expect(savedSettings.rulesets[0].rules[0].nutrient).toBe('salt');
    expect(savedSettings.rulesets[0].rules[1].nutrient).toBe('protein');
  });
});

describe('NutritionTable rowOrder', () => {
  it('renders rows in the order specified by rowOrder', () => {
    const customOrder = ['protein', 'kcals', 'carbohydrates', 'sugar', 'fat', 'saturated_fat', 'fiber', 'salt', 'computed_score'];
    render(
      <NutritionTable
        products={[makeProduct()]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        settings={makeSettings({ rowOrder: customOrder })}
      />,
    );

    const rowLabels = screen
      .getAllByRole('button', { name: /\(g\)|\(kcal\)/i })
      .map((b) => b.textContent ?? '');
    expect(rowLabels[0]).toMatch(/protein/i);
    expect(rowLabels[1]).toMatch(/calories/i);
  });

  it('falls back to default ROWS order when settings is null', () => {
    render(
      <NutritionTable
        products={[makeProduct()]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
        settings={null}
      />,
    );

    const rowLabels = screen
      .getAllByRole('button', { name: /\(g\)|\(kcal\)/i })
      .map((b) => b.textContent ?? '');
    expect(rowLabels[0]).toMatch(/calories/i);
    expect(rowLabels[1]).toMatch(/protein/i);
  });
});
