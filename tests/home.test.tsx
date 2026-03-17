import { render, screen } from '@testing-library/react';

import Home from '@/app/page';

describe('Home page', () => {
  it('renders an h1 heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders a CTA pointing to /compare', () => {
    render(<Home />);
    const cta = screen.getByRole('button', { name: /start comparing/i });
    expect(cta).toHaveAttribute('href', '/compare');
  });

  it('renders exactly 4 feature cards', () => {
    render(<Home />);
    expect(screen.getAllByTestId('feature-card')).toHaveLength(4);
  });

  it('renders an svg icon in each feature card', () => {
    render(<Home />);
    const grid = screen.getByTestId('features-grid');
    const svgs = grid.querySelectorAll('svg');
    expect(svgs).toHaveLength(4);
  });

  it('renders exactly 4 account benefit cards', () => {
    render(<Home />);
    expect(screen.getAllByTestId('benefit-card')).toHaveLength(4);
  });

  it('has a main landmark', () => {
    render(<Home />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('has at least one h2 heading below the h1', () => {
    render(<Home />);
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(1);
  });
});
