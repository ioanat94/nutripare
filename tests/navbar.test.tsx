import { fireEvent, render } from '@testing-library/react';

import { Navbar } from '@/components/navbar';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('Navbar', () => {
  it('renders without crashing', () => {
    render(<Navbar />);
  });

  it('has a theme toggle button', () => {
    const { getByRole } = render(<Navbar />);
    expect(getByRole('button')).toBeInTheDocument();
  });

  it('applies dark theme by default when no localStorage value is set', async () => {
    render(<Navbar />);
    // useEffect runs after render — wait a tick
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
    const { getByRole } = render(<Navbar />);
    await Promise.resolve();
    fireEvent.click(getByRole('button'));
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('clicking toggle twice switches back to dark', async () => {
    const { getByRole } = render(<Navbar />);
    await Promise.resolve();
    fireEvent.click(getByRole('button'));
    fireEvent.click(getByRole('button'));
    expect(document.documentElement).toHaveClass('dark');
  });

  it('writes the new theme to localStorage on toggle', async () => {
    const { getByRole } = render(<Navbar />);
    await Promise.resolve();
    fireEvent.click(getByRole('button'));
    expect(localStorage.getItem('nutripare-theme')).toBe('light');
  });
});
