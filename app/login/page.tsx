'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { AuthForm } from '@/components/auth-form';
import { AuthScreen } from '@/components/auth-screen';
import { EmailVerificationScreen } from '@/components/email-verification-screen';
import { GoogleSignInButton } from '@firebase-oss/ui-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/contexts/auth-context';

function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, emailVerified } = useAuth();
  const redirect = safeRedirect(searchParams.get('redirect'));
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');

  useEffect(() => {
    if (user && emailVerified) {
      router.replace(redirect);
    }
  }, [user, emailVerified, redirect, router]);

  if (user && !emailVerified) {
    return (
      <EmailVerificationScreen
        email={auth.currentUser?.email ?? ''}
        onSignOut={() => signOut(auth)}
        onVerified={() => { window.location.href = redirect; }}
      />
    );
  }

  return (
    <div className='flex flex-1 items-center justify-center'>
      <AuthScreen
        title={mode === 'signIn' ? 'Sign In' : 'Sign Up'}
        description={
          mode === 'signIn' ? 'Sign in to your account' : 'Create a new account'
        }
        onAuthenticated={() => {
          if (auth.currentUser?.emailVerified) {
            router.push(redirect);
          }
        }}
        form={
          <AuthForm
            mode={mode}
            onModeToggle={() =>
              setMode(mode === 'signIn' ? 'signUp' : 'signIn')
            }
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
