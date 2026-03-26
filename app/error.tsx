'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function Error() {
  return (
    <main className='flex flex-1 flex-col items-center justify-center gap-4 text-center'>
      <h1 className='text-2xl font-bold'>Something went wrong</h1>
      <p className='text-muted-foreground'>An unexpected error occurred.</p>
      <Link href='/' className={buttonVariants()}>Go home</Link>
    </main>
  );
}
