'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className='flex flex-1 flex-col items-center justify-center gap-4 text-center'>
      <h1 className='text-2xl font-bold'>Something went wrong</h1>
      <p className='text-muted-foreground'>An unexpected error occurred.</p>
      <div className='flex gap-2'>
        <button onClick={reset} className={buttonVariants()}>
          Try again
        </button>
        <Link href='/' className={buttonVariants({ variant: 'outline' })}>
          Go home
        </Link>
      </div>
    </main>
  );
}
