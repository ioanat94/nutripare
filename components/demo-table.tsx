import { MoreHorizontal } from 'lucide-react';
import { PRODUCTS } from '@/utils/constants';
import { ReactNode } from 'react';
import { RowData } from '@/types/table';
import { cn } from '@/utils/tailwind';

interface DemoTableProps {
  rows: RowData[];
  toolbar?: ReactNode;
  tableTopPadding?: boolean;
}

export function DemoTable({
  rows,
  toolbar,
  tableTopPadding = false,
}: DemoTableProps) {
  return (
    <div
      className='w-full max-w-[calc(100vw-3rem)] overflow-hidden rounded-xl border border-border shadow-lg'
      aria-hidden='true'
    >
      {/* Browser chrome */}
      <div className='flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2.5'>
        <div className='flex gap-1.5'>
          <span className='size-2.5 rounded-full bg-[#ff5f57]' />
          <span className='size-2.5 rounded-full bg-[#febc2e]' />
          <span className='size-2.5 rounded-full bg-[#28c840]' />
        </div>
        <span className='flex-1 pr-10 text-center text-xs text-muted-foreground/60'>
          nutripare.eu/compare
        </span>
      </div>

      {toolbar}

      {/* Table area */}
      <div
        className={cn(
          'overflow-x-auto bg-background',
          tableTopPadding && 'pt-3',
        )}
      >
        <table
          style={{
            width: '100%',
            minWidth: 'calc(8rem + 3 * 14rem)',
            tableLayout: 'fixed',
            borderCollapse: 'separate',
            borderSpacing: 0,
          }}
        >
          <thead>
            <tr>
              <th className='sticky left-0 z-10 w-32 bg-background px-4 pb-1 text-right align-bottom text-xs font-normal text-muted-foreground border-r border-r-border/40 border-b border-b-border'>
                per 100g
              </th>
              {PRODUCTS.map((p, idx) => (
                <th
                  key={p.code}
                  className={cn(
                    'w-48 px-4 pb-1 align-top text-left border-b border-b-border',
                    idx > 0 && 'border-l border-l-border/40',
                  )}
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0 flex-1'>
                      <span className='block truncate text-sm font-semibold text-foreground'>
                        {p.name}
                      </span>
                      <span className='font-mono text-xs text-muted-foreground'>
                        {p.code}
                      </span>
                    </div>
                    <MoreHorizontal className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.label}
                className={cn(i % 2 === 0 && 'bg-muted/30')}
                style={{ height: '45px' }}
              >
                <td
                  className={cn(
                    'sticky left-0 z-10 w-32 py-0 pl-4 text-left border-r border-border/40',
                    i < rows.length - 1 && 'border-b border-border/40',
                    i % 2 === 0 ? 'bg-table-stripe' : 'bg-background',
                  )}
                >
                  <span className='text-sm font-medium text-muted-foreground'>
                    {row.label}
                  </span>
                </td>
                {row.cells.map((cell, j) => (
                  <td
                    key={j}
                    className={cn(
                      'py-0 text-sm font-medium tabular-nums',
                      i < rows.length - 1 && 'border-b border-border/40',
                      j > 0 && 'border-l border-border/40',
                      cell.className,
                    )}
                  >
                    <div className='grid grid-cols-[1.25rem_min-content_1.25rem] items-center justify-center gap-3'>
                      <span className='text-center text-base leading-none'>
                        {cell.emoji}
                      </span>
                      <span className='text-center'>{cell.value}</span>
                      <span />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
