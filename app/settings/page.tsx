'use client';

import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';

import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const router = useRouter();

  async function handleLogout() {
    await signOut(getAuth());
    router.push('/');
  }

  return (
    <div>
      <h2>Settings</h2>
      <Button variant='destructive' onClick={handleLogout}>
        Log out
      </Button>
    </div>
  );
}
