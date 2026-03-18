'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { GoogleSignInButton } from '@firebase-oss/ui-react';
import { useAuth } from '@/contexts/auth-context';
import { AuthScreen } from '@/components/auth-screen';
import { AuthForm } from '@/components/auth-form';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const redirect = searchParams.get('redirect') ?? '/';
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');

  useEffect(() => {
    if (user) {
      router.replace(redirect);
    }
  }, [user, redirect, router]);

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <AuthScreen
        title={mode === 'signIn' ? 'Sign In' : 'Sign Up'}
        description={
          mode === 'signIn' ? 'Sign in to your account' : 'Create a new account'
        }
        onAuthenticated={() => router.push(redirect)}
        form={
          <AuthForm
            mode={mode}
            onModeToggle={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
          />
        }
      >
        <GoogleSignInButton />
      </AuthScreen>
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
