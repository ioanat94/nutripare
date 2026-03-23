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
    fireEvent.click(screen.getByRole('button', { name: /options for test product/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^remove$/i }));
    expect(onDismiss).toHaveBeenCalledWith('111');
  });

  it('shows crown on the highest protein value when it passes the positive threshold', () => {
    // cells[0] = label, cells[1] = product A (protein 25), cells[2] = product B (protein 30)
    const products = [
      makeProduct({ code: '111', product_name: 'A', protein: 25 }),
      makeProduct({ code: '222', product_name: 'B', protein: 30 }),
    ];
    render(<NutritionTable products={products} onDismiss={vi.fn()} onClearAll={vi.fn()} />);
    const proteinRow = screen.getByText('Protein (g)').closest('tr')!;
    const cells = proteinRow.querySelectorAll('td');
    expect(cells[2]).toHaveTextContent('👑');
    expect(cells[1]).not.toHaveTextContent('👑');
  });

  it('shows crown on both products when tied for the extreme positive value', () => {
    const products = [
      makeProduct({ code: '111', product_name: 'A', protein: 30 }),
      makeProduct({ code: '222', product_name: 'B', protein: 30 }),
    ];
    render(<NutritionTable products={products} onDismiss={vi.fn()} onClearAll={vi.fn()} />);
    const proteinRow = screen.getByText('Protein (g)').closest('tr')!;
    const cells = proteinRow.querySelectorAll('td');
    expect(cells[1]).toHaveTextContent('👑');
    expect(cells[2]).toHaveTextContent('👑');
  });

  it('shows flag on the highest sugar value when it passes the negative threshold', () => {
    // cells[0] = label, cells[1] = product A (sugar 25), cells[2] = product B (sugar 30)
    const products = [
      makeProduct({ code: '111', product_name: 'A', sugar: 25 }),
      makeProduct({ code: '222', product_name: 'B', sugar: 30 }),
    ];
    render(<NutritionTable products={products} onDismiss={vi.fn()} onClearAll={vi.fn()} />);
    const sugarRow = screen.getByText('Sugar (g)').closest('tr')!;
    const cells = sugarRow.querySelectorAll('td');
    expect(cells[2]).toHaveTextContent('🚩');
    expect(cells[1]).not.toHaveTextContent('🚩');
  });

  it('does not show any emoji when only one product is present', () => {
    render(
      <NutritionTable
        products={[makeProduct({ protein: 30 })]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    const proteinRow = screen.getByText('Protein (g)').closest('tr')!;
    expect(proteinRow).not.toHaveTextContent('👑');
  });

  it('does not show crown when the highest value does not pass the positive threshold', () => {
    const products = [
      makeProduct({ code: '111', product_name: 'A', protein: 5 }),
      makeProduct({ code: '222', product_name: 'B', protein: 10 }),
    ];
    render(<NutritionTable products={products} onDismiss={vi.fn()} onClearAll={vi.fn()} />);
    const proteinRow = screen.getByText('Protein (g)').closest('tr')!;
    expect(proteinRow).not.toHaveTextContent('👑');
  });

  it('sorts products high to low on first click of a row label', () => {
    const products = [
      makeProduct({ code: '111', product_name: 'A', protein: 10 }),
      makeProduct({ code: '222', product_name: 'B', protein: 30 }),
      makeProduct({ code: '333', product_name: 'C', protein: 20 }),
    ];
    render(<NutritionTable products={products} onDismiss={vi.fn()} onClearAll={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /protein/i }));
    const proteinRow = screen.getByText('Protein (g)').closest('tr')!;
    const cells = proteinRow.querySelectorAll('td');
    // cells[0] = label, then sorted: 30, 20, 10
    expect(cells[1]).toHaveTextContent('30');
    expect(cells[2]).toHaveTextContent('20');
    expect(cells[3]).toHaveTextContent('10');
  });

  it('sorts products low to high on second click of a row label', () => {
    const products = [
      makeProduct({ code: '111', product_name: 'A', protein: 10 }),
      makeProduct({ code: '222', product_name: 'B', protein: 30 }),
      makeProduct({ code: '333', product_name: 'C', protein: 20 }),
    ];
    render(<NutritionTable products={products} onDismiss={vi.fn()} onClearAll={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /protein/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    const proteinRow = screen.getByText('Protein (g)').closest('tr')!;
    const cells = proteinRow.querySelectorAll('td');
    // sorted: 10, 20, 30
    expect(cells[1]).toHaveTextContent('10');
    expect(cells[2]).toHaveTextContent('20');
    expect(cells[3]).toHaveTextContent('30');
  });

  it('shows sort arrow and highlights label when a row is active', () => {
    render(
      <NutritionTable
        products={[
          makeProduct({ code: '111', product_name: 'A' }),
          makeProduct({ code: '222', product_name: 'B' }),
        ]}
        onDismiss={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    const btn = screen.getByRole('button', { name: /protein/i });
    expect(btn).not.toHaveClass('font-semibold');
    fireEvent.click(btn);
    expect(btn).toHaveClass('font-semibold');
  });

  it('pushes products with undefined values to the end when sorting', () => {
    const products = [
      makeProduct({ code: '111', product_name: 'A', protein: undefined }),
      makeProduct({ code: '222', product_name: 'B', protein: 30 }),
    ];
    render(<NutritionTable products={products} onDismiss={vi.fn()} onClearAll={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /protein/i }));
    const proteinRow = screen.getByText('Protein (g)').closest('tr')!;
    const cells = proteinRow.querySelectorAll('td');
    expect(cells[1]).toHaveTextContent('30');
    expect(cells[2]).toHaveTextContent('—');
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
