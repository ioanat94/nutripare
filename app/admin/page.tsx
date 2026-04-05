'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Report, ReportReason, ReportStatus } from '@/types/firestore';
import { getAllReports, updateReportStatus } from '@/lib/firestore';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/tailwind';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 25;

type Filter = ReportStatus | 'all';
type ReasonFilter = ReportReason | 'all';

const STATUS_CLASSES: Record<ReportStatus, string> = {
  open: 'bg-warning/15 text-warning',
  solved: 'bg-positive/15 text-positive',
  dismissed: 'bg-muted text-muted-foreground',
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<Filter>('open');
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>('all');
  const [page, setPage] = useState(1);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    getAllReports()
      .then((data) => {
        setReports(data);
        setDataLoading(false);
      })
      .catch(() => {
        router.replace('/');
      });
  }, [authLoading, user, router]);

  async function handleStatusChange(code: string, status: ReportStatus) {
    await updateReportStatus(code, status);
    setReports((prev) =>
      prev.map((r) => (r.code === code ? { ...r, status } : r)),
    );
  }

  const byStatus =
    statusFilter === 'all'
      ? reports
      : reports.filter((r) => r.status === statusFilter);
  const byReason =
    reasonFilter === 'all'
      ? reports
      : reports.filter((r) => r.reason === reasonFilter);

  const filtered = reports
    .filter((r) => statusFilter === 'all' || r.status === statusFilter)
    .filter((r) => reasonFilter === 'all' || r.reason === reasonFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusCounts: Record<Filter, number> = {
    all: byReason.length,
    open: byReason.filter((r) => r.status === 'open').length,
    solved: byReason.filter((r) => r.status === 'solved').length,
    dismissed: byReason.filter((r) => r.status === 'dismissed').length,
  };

  const reasons: ReasonFilter[] = ['all', 'incorrect data', 'missing product'];
  const reasonCounts: Record<ReasonFilter, number> = {
    all: byStatus.length,
    'incorrect data': byStatus.filter((r) => r.reason === 'incorrect data')
      .length,
    'missing product': byStatus.filter((r) => r.reason === 'missing product')
      .length,
  };

  if (authLoading || dataLoading) {
    return (
      <main className='mx-auto w-full max-w-5xl px-6 py-12'>
        <div className='flex justify-center text-muted-foreground text-sm'>
          Loading…
        </div>
      </main>
    );
  }

  const filters: Filter[] = ['all', 'open', 'solved', 'dismissed'];

  return (
    <main className='mx-auto w-full max-w-5xl px-6 py-12'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>
          Admin — Product Reports
        </h1>
      </div>

      {/* Filter rows */}
      <div className='mb-4 flex flex-col gap-2'>
        <div className='flex gap-2'>
          {filters.map((f) => (
            <Button
              key={f}
              variant={statusFilter === f ? 'default' : 'outline'}
              size='sm'
              onClick={() => {
                setStatusFilter(f);
                setPage(1);
              }}
            >
              {f === 'all'
                ? 'All statuses'
                : f.charAt(0).toUpperCase() + f.slice(1)}
              <span className='ml-1 tabular-nums text-xs opacity-70'>
                ({statusCounts[f]})
              </span>
            </Button>
          ))}
        </div>
        <div className='flex gap-2'>
          {reasons.map((r) => (
            <Button
              key={r}
              variant={reasonFilter === r ? 'default' : 'outline'}
              size='sm'
              onClick={() => {
                setReasonFilter(r);
                setPage(1);
              }}
            >
              {r === 'all'
                ? 'All reasons'
                : r.charAt(0).toUpperCase() + r.slice(1)}
              <span className='ml-1 tabular-nums text-xs opacity-70'>
                ({reasonCounts[r]})
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className='rounded-lg border border-border overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b border-border bg-muted/40'>
              <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>
                Code
              </th>
              <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>
                Date
              </th>
              <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>
                Reason
              </th>
              <th className='px-4 py-2.5 text-left font-medium text-muted-foreground'>
                Status
              </th>
              <th className='px-4 py-2.5 text-right font-medium text-muted-foreground'>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className='px-4 py-8 text-center text-muted-foreground'
                >
                  No reports.
                </td>
              </tr>
            ) : (
              paginated.map((r) => (
                <tr
                  key={r.code}
                  className='border-b border-border last:border-0 hover:bg-muted/30 transition-colors'
                >
                  <td className='px-4 py-3 font-mono'>{r.code}</td>
                  <td className='px-4 py-3 text-muted-foreground'>
                    {r.date.toDate().toLocaleDateString()}
                  </td>
                  <td className='px-4 py-3'>{r.reason}</td>
                  <td className='px-4 py-3'>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        STATUS_CLASSES[r.status],
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Actions for ${r.code}`}
                        className='flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ml-auto'
                      >
                        <MoreHorizontal className='size-4' aria-hidden='true' />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='w-44'>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            Change status
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(r.code, 'open')}
                            >
                              Open
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(r.code, 'solved')
                              }
                            >
                              Solved
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(r.code, 'dismissed')
                              }
                            >
                              Dismissed
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='mt-4 flex items-center justify-end gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className='size-4' />
            Previous
          </Button>
          <span className='text-sm text-muted-foreground'>
            Page {page} of {totalPages}
          </span>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
            <ChevronRight className='size-4' />
          </Button>
        </div>
      )}
    </main>
  );
}
