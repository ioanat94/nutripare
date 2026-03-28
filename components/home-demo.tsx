import { DEFAULT_ROWS, DemoTable } from '@/components/demo-table';

import { MoreHorizontal } from 'lucide-react';

export function HomeDemo() {
  return (
    <DemoTable
      rows={DEFAULT_ROWS}
      toolbar={
        <div className='flex items-center justify-between bg-background px-4 py-3'>
          <p className='text-sm text-muted-foreground'>3 products</p>
          <MoreHorizontal
            className='size-4 text-muted-foreground'
            aria-hidden='true'
          />
        </div>
      }
    />
  );
}
