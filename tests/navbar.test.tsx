import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { Navbar } from '@/components/navbar';
import type { FirestoreUser } from '@/types/firestore';

const mockPush = vi.fn();
const mockUseAuth = vi.fn();
let mockPathname = '/';

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => mockPathname,
}));

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
  mockPush.mockClear();
  mockPathname = '/';
  mockUseAuth.mockReturnValue({ user: null, loading: false });
});

const mockUser: FirestoreUser = {
  id: '123',
  displayName: 'Test User',
  products: [],
  comparisons: [],
};

describe('Navbar', () => {
  it('renders without crashing', () => {
    render(<Navbar />);
  });

  it('has a theme toggle button', () => {
    render(<Navbar />);
    expect(
      screen.getByRole('button', { name: /toggle theme/i })
    ).toBeInTheDocument();
  });

  it('applies dark theme by default when no localStorage value is set', async () => {
    render(<Navbar />);
    await Promise.resolve();
    expect(document.documentElement).toHaveClass('dark');
  });

  it('applies light theme on mount when localStorage is set to light', async () => {
    localStorage.setItem('nutripare-theme', 'light');
    render(<Navbar />);
    await Promise.resolve();
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('clicking toggle switches from dark to light', async () => {
    render(<Navbar />);
    await Promise.resolve();
    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('clicking toggle twice switches back to dark', async () => {
    render(<Navbar />);
    await Promise.resolve();
    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));
    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));
    expect(document.documentElement).toHaveClass('dark');
  });

  it('writes the new theme to localStorage on toggle', async () => {
    render(<Navbar />);
    await Promise.resolve();
    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));
    expect(localStorage.getItem('nutripare-theme')).toBe('light');
  });

  it('renders a user icon button', () => {
    render(<Navbar />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('user icon has text-foreground class when logged out', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(<Navbar />);
    const btn = screen.getByRole('button', { name: /sign in/i });
    expect(btn.querySelector('svg')).toHaveClass('text-foreground');
  });

  it('user icon has text-primary class when logged in', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    render(<Navbar />);
    const btn = screen.getByRole('button', { name: /account settings/i });
    expect(btn.querySelector('svg')).toHaveClass('text-primary');
  });

  it('clicking user icon while logged out navigates to /login with redirect param', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(<Navbar />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2F');
  });

  it('clicking user icon while logged out on /login redirects to / after sign-in', () => {
    mockPathname = '/login';
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(<Navbar />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2F');
  });

  it('clicking user icon while logged in navigates to /settings', () => {
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    render(<Navbar />);
    fireEvent.click(screen.getByRole('button', { name: /account settings/i }));
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });
});
