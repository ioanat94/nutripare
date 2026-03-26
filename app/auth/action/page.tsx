'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode } from 'firebase/auth';

import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Status = 'loading' | 'success' | 'error';

function ActionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  const [status, setStatus] = useState<Status>(
    mode === 'verifyEmail' && !!oobCode ? 'loading' : 'error',
  );

  useEffect(() => {
    if (!oobCode || mode !== 'verifyEmail') return;
    applyActionCode(auth, oobCode)
      .then(() => auth.currentUser?.reload())
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [mode, oobCode]);

  return (
    <div className='flex flex-1 items-center justify-center'>
      <div className='mx-auto w-full max-w-sm'>
        <Card className='gap-6 bg-transparent py-10'>
          {status === 'loading' && (
            <CardHeader className='px-10 text-center'>
              <CardTitle className='text-xl font-bold'>Verifying…</CardTitle>
              <CardDescription>
                Just a moment while we confirm your email address.
              </CardDescription>
            </CardHeader>
          )}
          {status === 'success' && (
            <>
              <CardHeader className='px-10 text-center'>
                <CardTitle className='text-xl font-bold'>
                  Email verified
                </CardTitle>
                <CardDescription>
                  Your email address has been confirmed. You&apos;re all set.
                </CardDescription>
              </CardHeader>
              <CardContent className='px-10'>
                <Button
                  className='w-full'
                  onClick={() => router.push('/')}
                >
                  Go to app
                </Button>
              </CardContent>
            </>
          )}
          {status === 'error' && (
            <>
              <CardHeader className='px-10 text-center'>
                <CardTitle className='text-xl font-bold'>
                  Link invalid
                </CardTitle>
                <CardDescription>
                  This verification link has expired or already been used. Sign
                  in and request a new one from the verification screen.
                </CardDescription>
              </CardHeader>
              <CardContent className='px-10'>
                <Button
                  variant='outline'
                  className='w-full'
                  onClick={() => router.push('/login')}
                >
                  Go to sign in
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={null}>
      <ActionContent />
    </Suspense>
  );
}
