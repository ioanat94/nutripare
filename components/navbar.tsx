'use client';

import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className='flex items-center justify-end border-b px-4 py-2'>
      <Button variant='ghost' size='icon' onClick={toggleTheme}>
        {theme === 'dark' ? <Moon /> : <Sun />}
        <span className='sr-only'>Toggle theme</span>
      </Button>
    </nav>
  );
}
