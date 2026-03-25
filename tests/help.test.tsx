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

  it('renders table of contents with anchor links for all 10 sections', () => {
    render(<HelpPage />);
    const expectedSections: [string, string][] = [
      ['#overview', 'Overview'],
      ['#searching', 'Searching for Products'],
      ['#nutrition-table', 'The Nutrition Table'],
      ['#table-actions', 'Table Actions'],
      ['#saving', 'Saving Products and Comparisons'],
      ['#settings-account', 'Settings \u2014 Account'],
      ['#settings-nutrition', 'Settings \u2014 Nutrition'],
      ['#settings-products', 'Settings \u2014 Products'],
      ['#settings-comparisons', 'Settings \u2014 Comparisons'],
      ['#account-features', 'Signed-in vs. Signed-out'],
    ];
    // Two ToC navs exist (desktop sidebar + mobile inline); verify at least one link per section
    for (const [href, label] of expectedSections) {
      const links = screen.getAllByRole('link', { name: label });
      expect(links.length).toBeGreaterThanOrEqual(1);
      expect(links[0]).toHaveAttribute('href', href);
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
