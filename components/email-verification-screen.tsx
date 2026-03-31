'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { sendEmailVerification, signOut } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { useState } from 'react';

interface EmailVerificationScreenProps {
  email: string;
  onSignOut: () => void;
  onVerified: () => void;
}

export function EmailVerificationScreen({
  email,
  onSignOut,
  onVerified,
}: EmailVerificationScreenProps) {
  const [checkFeedback, setCheckFeedback] = useState<string | null>(null);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);

  async function handleCheckAgain() {
    await auth.currentUser?.reload();
    if (auth.currentUser?.emailVerified) {
      onVerified();
    } else {
      setCheckFeedback('Not verified yet.');
    }
  }

  async function handleResend() {
    if (!auth.currentUser) {
      setResendFeedback('Session expired. Please sign in again.');
      return;
    }
    try {
      await sendEmailVerification(auth.currentUser);
      setResendFeedback('Verification email sent.');
      setResendDisabled(true);
      setTimeout(() => setResendDisabled(false), 30000);
    } catch {
      setResendFeedback('Failed to send. Please try again later.');
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    onSignOut();
  }

  return (
    <div className='flex flex-1 items-center justify-center'>
      <div className='mx-auto w-full max-w-sm'>
        <Card className='gap-6 bg-transparent py-10'>
          <CardHeader className='px-10 text-center'>
            <CardTitle className='text-xl font-bold'>
              Check your inbox
            </CardTitle>
            <CardDescription>
              We sent a verification link to{' '}
              <span className='font-medium text-foreground'>{email}</span>.
              Click the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-3 px-10'>
            <Button onClick={handleCheckAgain} className='w-full'>
              Check again
            </Button>
            {checkFeedback && (
              <p className='text-center text-sm text-muted-foreground'>
                {checkFeedback}
              </p>
            )}
            <Button
              variant='outline'
              onClick={handleResend}
              disabled={resendDisabled}
              className='w-full'
            >
              Resend email
            </Button>
            {resendFeedback && (
              <p className='text-center text-sm text-muted-foreground'>
                {resendFeedback}
              </p>
            )}
            <Button
              variant='ghost'
              size='sm'
              onClick={handleSignOut}
              className='text-xs text-muted-foreground hover:text-muted-foreground'
            >
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
