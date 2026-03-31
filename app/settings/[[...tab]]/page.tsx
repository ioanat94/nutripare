'use client';

import { Loader2, LogOut } from 'lucide-react';
import { use, useEffect } from 'react';

import { AccountTab } from '@/components/settings/account-tab';
import { Button } from '@/components/ui/button';
import { ComparisonsTab } from '@/components/settings/comparisons-tab';
import Link from 'next/link';
import { NutritionTab } from '@/components/settings/nutrition-tab';
import { ProductsTab } from '@/components/settings/products-tab';
import { auth } from '@/lib/firebase';
import { cn } from '@/utils/tailwind';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

type Tab = 'account' | 'nutrition' | 'products' | 'comparisons';

const TABS: Tab[] = ['account', 'nutrition', 'products', 'comparisons'];

export default function SettingsPage({
  params,
}: {
  params: Promise<{ tab?: string[] }>;
}) {
  const { tab: tabSegment } = use(params);
  const rawTab = tabSegment?.[0];
  const isValidTab = (TABS as string[]).includes(rawTab ?? '');
  const activeTab: Tab = isValidTab ? (rawTab as Tab) : 'account';

  const { user, loading, emailVerified } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !emailVerified)) {
      router.push('/login?redirect=/settings');
    } else if (!loading && rawTab && !isValidTab) {
      router.replace('/settings/account');
    }
  }, [loading, user, emailVerified, router, rawTab, isValidTab]);

  async function handleLogout() {
    try {
      await signOut(auth);
      router.push('/');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }

  if (loading || !user || !emailVerified) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <Loader2 className='size-6 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <main className='mx-auto w-full max-w-5xl px-6 py-12'>
      <div className='mb-8 flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight'>Settings</h1>
        <Button
          variant='destructive'
          size='sm'
          className='sm:hidden'
          onClick={handleLogout}
        >
          <LogOut className='size-4' />
        </Button>
      </div>

      {/* Mobile: horizontal tab strip */}
      <nav className='mb-6 flex border-b border-border sm:hidden'>
        {TABS.map((tab) => (
          <Link
            key={tab}
            href={`/settings/${tab}`}
            className={cn(
              'flex-1 border-b-2 px-2 pb-3 text-center text-sm font-medium capitalize transition-colors',
              activeTab === tab
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab}
          </Link>
        ))}
      </nav>

      <div className='flex gap-8'>
        {/* Desktop: sidebar */}
        <nav className='hidden w-44 shrink-0 flex-col sm:flex'>
          <div className='flex flex-col gap-1'>
            {TABS.map((tab) => (
              <Link
                key={tab}
                href={`/settings/${tab}`}
                className={cn(
                  'rounded-md px-3 py-2 text-left text-sm font-medium capitalize transition-colors',
                  activeTab === tab
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab}
              </Link>
            ))}
          </div>
          <div className='mt-8'>
            <Button
              variant='destructive'
              className='justify-start'
              onClick={handleLogout}
            >
              <LogOut className='mr-2 size-4' />
              Log out
            </Button>
          </div>
        </nav>

        {/* Content */}
        <section className='min-w-0 flex-1'>
          <h2 className='mb-6 text-xl font-semibold capitalize'>{activeTab}</h2>
          {activeTab === 'account' && (
            <AccountTab userId={user.id} displayName={user.displayName} />
          )}
          {activeTab === 'nutrition' && <NutritionTab userId={user.id} />}
          {activeTab === 'products' && <ProductsTab userId={user.id} />}
          {activeTab === 'comparisons' && <ComparisonsTab userId={user.id} />}
        </section>
      </div>
    </main>
  );
}
