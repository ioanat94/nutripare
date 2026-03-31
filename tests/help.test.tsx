import { render, screen } from '@testing-library/react';

import HelpPage from '@/app/help/page';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/help',
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

// HelpToc uses IntersectionObserver — stub it so jsdom doesn't throw
const observeMock = vi.fn();
const unobserveMock = vi.fn();
class MockIntersectionObserver {
  observe = observeMock;
  unobserve = unobserveMock;
  disconnect = vi.fn();
  constructor() {}
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

describe('Help page', () => {
  it('renders without error (smoke test)', () => {
    render(<HelpPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders the page title', () => {
    render(<HelpPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: /user guide/i }),
    ).toBeInTheDocument();
  });

  const sectionHeadings = [
    /overview/i,
    /searching for products/i,
    /the nutrition table/i,
    /table actions/i,
    /saving products and comparisons/i,
    /settings.*account/i,
    /settings.*nutrition/i,
    /settings.*products/i,
    /settings.*comparisons/i,
    /signed-in vs\. signed-out/i,
  ];

  it.each(sectionHeadings)('renders section heading: %s', (pattern) => {
    render(<HelpPage />);
    expect(
      screen.getAllByRole('heading', { name: pattern }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders table of contents with buttons for all 10 sections', () => {
    render(<HelpPage />);
    const expectedLabels = [
      'Overview',
      'Searching for Products',
      'The Nutrition Table',
      'Table Actions',
      'Saving Products and Comparisons',
      'Settings \u2014 Account',
      'Settings \u2014 Nutrition',
      'Settings \u2014 Products',
      'Settings \u2014 Comparisons',
      'Signed-in vs. Signed-out',
    ];
    // Two ToC navs exist (desktop sidebar + mobile inline); verify at least one button per section
    for (const label of expectedLabels) {
      const buttons = screen.getAllByRole('button', { name: label });
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('is accessible to unauthenticated users — no redirect', () => {
    // If the page tried to redirect or gate access, rendering would throw or show a redirect element
    render(<HelpPage />);
    expect(screen.queryByText(/sign in/i)).toBeNull();
    expect(screen.queryByText(/log in/i)).toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
