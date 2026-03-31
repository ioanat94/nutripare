import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { NextResponse } from 'next/server';
import type { ReportReason } from '@/types/firestore';
import { db } from '@/lib/firebase';

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT = 25;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 10_000;

function getIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    if (rateLimitMap.size >= MAX_ENTRIES) {
      rateLimitMap.delete(rateLimitMap.keys().next().value!);
    }
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

export async function POST(req: Request) {
  const ip = getIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ success: true });
  }

  let body: { code?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: true });
  }

  const { code, reason } = body;
  if (
    typeof code !== 'string' ||
    !/^\d{8}(\d{5})?$/.test(code) ||
    (reason !== 'incorrect data' && reason !== 'missing product')
  ) {
    return NextResponse.json({ success: true });
  }

  try {
    const ref = doc(db, 'reports', code);
    const snap = await getDoc(ref);

    const status = snap.exists() ? snap.data().status : null;
    const shouldWrite =
      status === null || status === 'solved' || status === 'dismissed';

    if (shouldWrite) {
      await setDoc(ref, {
        code,
        date: serverTimestamp(),
        reason: reason as ReportReason,
        status: 'open',
      });
    }
  } catch {
    // silently fail — don't expose errors to client
  }

  return NextResponse.json({ success: true });
}
