'use client';

import { Moon, Sun, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  function handleUserIconClick() {
    if (user) {
      router.push('/settings');
    } else {
      router.push('/login?redirect=' + encodeURIComponent(pathname));
    }
  }

  const userIconClass = loading
    ? 'text-muted-foreground'
    : user
      ? 'text-primary'
      : 'text-foreground';

  return (
    <nav className='flex items-center justify-end border-b px-4 py-2'>
      <Button variant='ghost' size='icon' onClick={handleUserIconClick}>
        <User className={userIconClass} />
        <span className='sr-only'>{user ? 'Account settings' : 'Sign in'}</span>
      </Button>
      <Button variant='ghost' size='icon' onClick={toggleTheme}>
        {theme === 'dark' ? <Moon /> : <Sun />}
        <span className='sr-only'>Toggle theme</span>
      </Button>
    </nav>
  );
}
