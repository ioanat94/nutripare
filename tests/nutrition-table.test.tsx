import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { NutritionTable } from '@/components/nutrition-table';
import type { ProductNutrition } from '@/types/openfoodfacts';

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

describe('NutritionTable', () => {
  it('renders nothing when products is empty', () => {
    const { container } = render(
      <NutritionTable products={[]} onDismiss={vi.fn()} onClearAll={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders a table with one value column when one product is provided', () => {
    render(
      <NutritionTable
        products={[makeProduct()]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('renders two value columns when two products are provided', () => {
    const products = [
      makeProduct({ code: '111', product_name: 'Product A' }),
      makeProduct({ code: '222', product_name: 'Product B' }),
    ];
    render(
      <NutritionTable products={products} onDismiss={vi.fn()} onClearAll={vi.fn()} />,
    );
    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
  });

  it('applies text-destructive to a nutrient value above its negative threshold', () => {
    // salt negative threshold: above 1.5
    render(
      <NutritionTable
        products={[makeProduct({ salt: 2 })]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    const saltRow = screen.getByText('Salt (g)').closest('tr')!;
    const cell = saltRow.querySelector('td:last-child')!;
    expect(cell).toHaveClass('text-destructive');
  });

  it('applies text-positive to a nutrient value below its positive threshold', () => {
    // salt positive threshold: below 0.3
    render(
      <NutritionTable
        products={[makeProduct({ salt: 0.1 })]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    const saltRow = screen.getByText('Salt (g)').closest('tr')!;
    const cell = saltRow.querySelector('td:last-child')!;
    expect(cell).toHaveClass('text-positive');
  });

  it('applies no color class for a nutrient with no threshold entry (kcals)', () => {
    render(
      <NutritionTable
        products={[makeProduct({ kcals: 500 })]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    const kcalRow = screen.getByText('Calories (kcal)').closest('tr')!;
    const cell = kcalRow.querySelector('td:last-child')!;
    expect(cell).not.toHaveClass('text-destructive');
    expect(cell).not.toHaveClass('text-positive');
    expect(cell).not.toHaveClass('text-warning');
  });

  it('formats whole numbers without a decimal', () => {
    render(
      <NutritionTable
        products={[makeProduct({ kcals: 100, protein: 5.5 })]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    const kcalRow = screen.getByText('Calories (kcal)').closest('tr')!;
    expect(kcalRow.querySelector('td:last-child')).toHaveTextContent('100');
    const proteinRow = screen.getByText('Protein (g)').closest('tr')!;
    expect(proteinRow.querySelector('td:last-child')).toHaveTextContent('5.5');
  });

  it('shows "Unknown product" when product_name is empty', () => {
    render(
      <NutritionTable
        products={[makeProduct({ product_name: '' })]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    expect(screen.getByText('Unknown product')).toBeInTheDocument();
  });

  it('renders "—" with no color class for an undefined nutrient value', () => {
    render(
      <NutritionTable
        products={[makeProduct({ salt: undefined })]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    const saltRow = screen.getByText('Salt (g)').closest('tr')!;
    const cell = saltRow.querySelector('td:last-child')!;
    expect(cell).toHaveTextContent('—');
    expect(cell).not.toHaveClass('text-destructive');
    expect(cell).not.toHaveClass('text-positive');
  });

  it('calls onDismiss with the product code when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    render(
      <NutritionTable
        products={[makeProduct({ code: '111', product_name: 'Test Product' })]}
        onDismiss={onDismiss}
        onClearAll={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /dismiss test product/i }));
    expect(onDismiss).toHaveBeenCalledWith('111');
  });

  it('hides table when products become empty after dismissing the last column', () => {
    const onDismiss = vi.fn();
    const { rerender } = render(
      <NutritionTable
        products={[makeProduct()]}
        onDismiss={onDismiss}
        onClearAll={vi.fn()}
      />,
    );
    expect(screen.getByRole('table')).toBeInTheDocument();

    rerender(
      <NutritionTable products={[]} onDismiss={onDismiss} onClearAll={vi.fn()} />,
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
