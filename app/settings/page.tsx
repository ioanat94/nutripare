'use client';

import { useEffect, useState } from 'react';

import { AccountTab } from '@/components/settings/account-tab';
import { Button } from '@/components/ui/button';
import { ComparisonsTab } from '@/components/settings/comparisons-tab';
import { LogOut } from 'lucide-react';
import { NutritionTab } from '@/components/settings/nutrition-tab';
import { ProductsTab } from '@/components/settings/products-tab';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

type Tab = 'account' | 'nutrition' | 'products' | 'comparisons';

const TABS: Tab[] = ['account', 'nutrition', 'products', 'comparisons'];

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('account');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/settings');
    }
  }, [loading, user, router]);

  async function handleLogout() {
    await signOut(auth);
    router.push('/');
  }

  if (loading || !user) return null;

  return (
    <main className='mx-auto w-full max-w-5xl px-6 py-12'>
      <h1 className='mb-8 text-3xl font-bold tracking-tight'>Settings</h1>
      <div className='flex gap-8'>
        {/* Sidebar */}
        <nav className='flex w-44 shrink-0 flex-col'>
          <div className='flex flex-col gap-1'>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer rounded-md px-3 py-2 text-left text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
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
          {activeTab === 'nutrition' && <NutritionTab />}
          {activeTab === 'products' && <ProductsTab userId={user.id} />}
          {activeTab === 'comparisons' && <ComparisonsTab userId={user.id} />}
        </section>
      </div>
    </main>
  );
}
