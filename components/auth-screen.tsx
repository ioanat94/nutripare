'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import type { ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';
import type { User } from 'firebase/auth';
import { useOnUserAuthenticated } from '@firebase-oss/ui-react';

interface AuthScreenProps {
  title: string;
  description: string;
  onAuthenticated?: (user: User) => void;
  form: ReactNode;
  children?: ReactNode;
}

export function AuthScreen({
  title,
  description,
  onAuthenticated,
  form,
  children,
}: AuthScreenProps) {
  useOnUserAuthenticated(onAuthenticated);

  return (
    <div className='w-full max-w-sm mx-auto'>
      <Card className='py-10 gap-6 bg-transparent'>
        <CardHeader className='text-center px-10'>
          <CardTitle className='text-xl font-bold'>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className='px-10'>
          {form}
          {children ? (
            <>
              <div className='relative my-4 flex items-center'>
                <Separator className='flex-1' />
                <span className='mx-3 text-xs text-muted-foreground'>or</span>
                <Separator className='flex-1' />
              </div>
              <div className='space-y-2'>{children}</div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
