import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock firestore helpers
vi.mock('@/lib/firestore', () => ({
  getNutritionSettings: vi.fn(),
  saveNutritionSettings: vi.fn().mockResolvedValue(undefined),
}));

// Mock firebase
vi.mock('@/lib/firebase', () => ({
  db: {},
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const { getNutritionSettings, saveNutritionSettings } =
  await import('@/lib/firestore');
const mockGetNutritionSettings = vi.mocked(getNutritionSettings);
const mockSaveNutritionSettings = vi.mocked(saveNutritionSettings);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetNutritionSettings.mockResolvedValue(null);
  mockSaveNutritionSettings.mockResolvedValue(undefined);
});

async function renderTab() {
  const { NutritionTab } = await import('@/components/settings/nutrition-tab');
  render(<NutritionTab userId='uid-123' />);
  // Wait for loading to finish
  await waitFor(() =>
    expect(screen.queryByText(/visible nutrients/i)).toBeInTheDocument(),
  );
}

describe('NutritionTab', () => {
  it('renders all three sections', async () => {
    await renderTab();
    expect(screen.getByRole('heading', { name: /visible nutrients/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^highlights$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^rules$/i })).toBeInTheDocument();
  });

  it('renders all 8 nutrient checkboxes checked by default', async () => {
    await renderTab();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(8);
    checkboxes.forEach((cb) => {
      expect(cb).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('unchecking a nutrient enables the Save button', async () => {
    await renderTab();
    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    expect(saveBtn).toBeDisabled();

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    await waitFor(() => expect(saveBtn).not.toBeDisabled());
  });

  it('renders both emoji toggles as enabled by default', async () => {
    await renderTab();
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(2);
    switches.forEach((sw) => {
      expect(sw).toHaveAttribute('aria-checked', 'true');
    });
  });

  it('toggling crown switch enables the Save button', async () => {
    await renderTab();
    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    expect(saveBtn).toBeDisabled();

    const [crownSwitch] = screen.getAllByRole('switch');
    fireEvent.click(crownSwitch);

    await waitFor(() => expect(saveBtn).not.toBeDisabled());
  });

  it('toggling flag switch enables the Save button', async () => {
    await renderTab();
    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    expect(saveBtn).toBeDisabled();

    const [, flagSwitch] = screen.getAllByRole('switch');
    fireEvent.click(flagSwitch);

    await waitFor(() => expect(saveBtn).not.toBeDisabled());
  });

  it('Save button is disabled when no changes have been made', async () => {
    await renderTab();
    expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();
  });

  it('Save button becomes enabled after any change', async () => {
    await renderTab();
    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    await waitFor(() => expect(saveBtn).not.toBeDisabled());
  });

  it('clicking Add rule appends a new row', async () => {
    await renderTab();
    const removeButtons = screen.getAllByRole('button', { name: /remove rule/i });
    const initialCount = removeButtons.length;

    fireEvent.click(screen.getByRole('button', { name: /add rule/i }));

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /remove rule/i })).toHaveLength(
        initialCount + 1,
      ),
    );
  });

  it('clicking Remove rule removes it from the list', async () => {
    await renderTab();
    const removeButtons = screen.getAllByRole('button', { name: /remove rule/i });
    const initialCount = removeButtons.length;

    fireEvent.click(removeButtons[0]);

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /remove rule/i })).toHaveLength(
        initialCount - 1,
      ),
    );
  });

  it('duplicate nutrient+rating shows inline error on save attempt and does not save', async () => {
    mockGetNutritionSettings.mockResolvedValue({
      visibleNutrients: ['kcals', 'protein', 'carbohydrates', 'sugar', 'fat', 'saturated_fat', 'fiber', 'salt'],
      showCrown: true,
      showFlag: true,
      rules: [
        { nutrient: 'protein', direction: 'above', value: 20, rating: 'positive' },
        { nutrient: 'protein', direction: 'below', value: 5, rating: 'positive' },
      ],
    });

    const { NutritionTab } = await import('@/components/settings/nutrition-tab');
    render(<NutritionTab userId='uid-456' />);

    // Wait for settings to load
    await waitFor(() => expect(screen.queryByText(/visible nutrients/i)).toBeInTheDocument());

    // Make a change to enable Save, then attempt to save
    const [crownSwitch] = screen.getAllByRole('switch');
    fireEvent.click(crownSwitch);

    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    await waitFor(() => expect(saveBtn).not.toBeDisabled());
    fireEvent.click(saveBtn);

    // Error should now appear and settings should not have been saved
    await waitFor(() =>
      expect(screen.getAllByText(/already exists/i).length).toBeGreaterThan(0),
    );
    expect(mockSaveNutritionSettings).not.toHaveBeenCalled();
  });

  it('calls saveNutritionSettings with correct payload on Save', async () => {
    await renderTab();

    // Uncheck first nutrient to enable save
    fireEvent.click(screen.getAllByRole('checkbox')[0]);

    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    await waitFor(() => expect(saveBtn).not.toBeDisabled());

    fireEvent.click(saveBtn);

    await waitFor(() =>
      expect(mockSaveNutritionSettings).toHaveBeenCalledWith(
        'uid-123',
        expect.objectContaining({
          showCrown: true,
          showFlag: true,
        }),
      ),
    );
  });

  it('restores previously saved settings on load', async () => {
    mockGetNutritionSettings.mockResolvedValue({
      visibleNutrients: ['kcals', 'protein'],
      showCrown: false,
      showFlag: true,
      rules: [],
    });

    await renderTab();

    const checkboxes = screen.getAllByRole('checkbox');
    // Only kcals and protein should be checked (first 2)
    expect(checkboxes[0]).toHaveAttribute('aria-checked', 'true');  // kcals
    expect(checkboxes[1]).toHaveAttribute('aria-checked', 'true');  // protein
    expect(checkboxes[2]).toHaveAttribute('aria-checked', 'false'); // carbohydrates

    const [crownSwitch] = screen.getAllByRole('switch');
    expect(crownSwitch).toHaveAttribute('aria-checked', 'false');
  });
});
