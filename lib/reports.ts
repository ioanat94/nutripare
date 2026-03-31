import type { ReportReason } from '@/types/firestore';

export async function submitReport(
  code: string,
  reason: ReportReason,
): Promise<void> {
  await fetch('/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, reason }),
  });
}
