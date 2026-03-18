'use client';

import { Suspense, useEffect } from 'react';

import { GoogleSignInButton, SignInAuthScreen } from '@firebase-oss/ui-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@/contexts/auth-context';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const redirect = searchParams.get('redirect') ?? '/';

  useEffect(() => {
    if (user) {
      router.replace(redirect);
    }
  }, [user, redirect, router]);

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <SignInAuthScreen onSignIn={() => router.push(redirect)}>
        <GoogleSignInButton />
      </SignInAuthScreen>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
