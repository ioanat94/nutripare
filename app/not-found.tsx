'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className='flex flex-1 flex-col items-center justify-center gap-4 text-center'>
      <h1 className='text-2xl font-bold'>Page not found</h1>
      <p className='text-muted-foreground'>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href='/' className={buttonVariants()}>
        Go home
      </Link>
    </main>
  );
}
