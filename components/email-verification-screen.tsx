'use client';

import { useState } from 'react';
import { sendEmailVerification, signOut } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { auth } from '@/lib/firebase';

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
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);

  async function handleCheckAgain() {
    await auth.currentUser?.reload();
    if (auth.currentUser?.emailVerified) {
      onVerified();
    } else {
      setCheckMessage('Not verified yet.');
    }
  }

  async function handleResend() {
    try {
      await sendEmailVerification(auth.currentUser!);
      setResendMessage('Verification email sent.');
      setResendDisabled(true);
      setTimeout(() => setResendDisabled(false), 30000);
    } catch {
      setResendMessage('Failed to send. Please try again later.');
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
              <span className='font-medium text-foreground'>{email}</span>. Click
              the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-3 px-10'>
            <Button onClick={handleCheckAgain} className='w-full'>
              Check again
            </Button>
            {checkMessage && (
              <p className='text-center text-sm text-muted-foreground'>
                {checkMessage}
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
            {resendMessage && (
              <p className='text-center text-sm text-muted-foreground'>
                {resendMessage}
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
