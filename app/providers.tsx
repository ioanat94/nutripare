'use client';

import { type ReactNode } from 'react';

import { FirebaseUIProvider } from '@firebase-oss/ui-react';

import { AuthProvider } from '@/contexts/auth-context';
import { ui } from '@/lib/firebase';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <FirebaseUIProvider ui={ui}>{children}</FirebaseUIProvider>
    </AuthProvider>
  );
}
