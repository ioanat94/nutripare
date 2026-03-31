'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { CircleHelp, House, Moon, Scale, Sun, User } from 'lucide-react';

import Link from 'next/link';
import { cn } from '@/utils/tailwind';
import { useAuth } from '@/contexts/auth-context';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/use-theme';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const userHref = user
    ? '/settings/account'
    : '/login?redirect=' +
      encodeURIComponent(pathname === '/login' ? '/' : pathname);

  const userIconClass = loading
    ? 'text-muted-foreground'
    : user
      ? 'text-primary'
      : 'text-foreground';

  return (
    <nav className='sticky top-0 z-50 flex items-center justify-end border-b bg-background px-4 py-2'>
      <Link
        href='/'
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'mr-auto',
        )}
      >
        <House />
        <span className='sr-only'>Home</span>
      </Link>
      <Link
        href='/compare'
        className={buttonVariants({ variant: 'ghost', size: 'icon' })}
      >
        <Scale />
        <span className='sr-only'>Compare</span>
      </Link>
      <Link
        href='/help'
        className={buttonVariants({ variant: 'ghost', size: 'icon' })}
      >
        <CircleHelp />
        <span className='sr-only'>Help</span>
      </Link>
      <Link
        href={userHref}
        className={buttonVariants({ variant: 'ghost', size: 'icon' })}
      >
        <User className={userIconClass} />
        <span className='sr-only'>{user ? 'Account settings' : 'Sign in'}</span>
      </Link>
      <Button variant='ghost' size='icon' onClick={toggleTheme}>
        {theme === 'dark' ? <Moon /> : <Sun />}
        <span className='sr-only'>Toggle theme</span>
      </Button>
    </nav>
  );
}
