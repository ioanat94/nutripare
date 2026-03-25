import {
  ArrowLeftRight,
  ArrowUpDown,
  Bookmark,
  FolderHeart,
  Gauge,
  ScanBarcode,
  SlidersHorizontal,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { HomeDemo } from '@/components/home-demo';
import { RulesetDemo } from '@/components/ruleset-demo';
import Link from 'next/link';

const features = [
  {
    icon: ScanBarcode,
    title: 'Scan or type a barcode',
    description:
      'Enter an EAN code or scan a product barcode to instantly pull up its full nutritional breakdown.',
  },
  {
    icon: Gauge,
    title: 'See what matters at a glance',
    description:
      'Key nutrients are flagged as good or bad so you know immediately what to watch out for.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Compare products side by side',
    description:
      'Add multiple products and see how they stack up against each other across every nutrient.',
  },
  {
    icon: ArrowUpDown,
    title: 'Sort by any nutrient',
    description:
      'Rank your comparison by protein, sugar, calories, or any other factor that matters to you.',
  },
];

const accountBenefits = [
  {
    icon: Bookmark,
    title: 'Save products',
    description:
      'Bookmark products you scan so you can find them again without re-entering the barcode.',
  },
  {
    icon: FolderHeart,
    title: 'Save comparisons',
    description:
      'Keep your comparison groups saved so you can revisit them any time.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Choose your nutrients',
    description:
      'Decide which nutrients are highlighted — focus on what actually matters to your diet.',
  },
  {
    icon: Gauge,
    title: 'Build nutrition profiles',
    description:
      'Create named rulesets that define what matters to your diet — switch between them per comparison.',
  },
];


export default function Home() {
  return (
    <main className='mx-auto max-w-5xl px-6 py-20'>
      {/* Hero */}
      <section className='flex flex-col items-center gap-6 text-center'>
        <h1 className='text-5xl font-bold tracking-tight sm:text-7xl'>
          Know what you&apos;re eating.
          <br />
          <span className='text-primary'>Actually.</span>
        </h1>
        <p className='max-w-xl text-lg text-muted-foreground'>
          Scan or enter a barcode and get clear nutritional info in seconds.
          Compare products, spot what matters, and make better choices — no
          guesswork.
        </p>
        <Button
          size='lg'
          className='mt-2 px-6 text-base'
          nativeButton={false}
          render={<Link href='/compare' />}
        >
          Start comparing →
        </Button>
        <HomeDemo />
      </section>

      {/* Features */}
      <section className='mt-24'>
        <h2 className='mb-2 text-3xl font-bold tracking-tight'>What it does</h2>
        <p className='mb-8 text-muted-foreground'>
          Everything you need to make sense of a nutrition label, fast.
        </p>
        <div
          className='grid grid-cols-1 gap-4 sm:grid-cols-2'
          data-testid='features-grid'
        >
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className='rounded-xl border border-border bg-card p-6'
              data-testid='feature-card'
            >
              <Icon className='mb-4 size-9 text-primary' aria-hidden='true' />
              <h3 className='mb-1 font-semibold'>{title}</h3>
              <p className='text-sm text-muted-foreground'>{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Account benefits */}
      <section className='mt-24'>
        <h2 className='mb-2 text-3xl font-bold tracking-tight'>
          Even better with an account
        </h2>
        <p className='mb-8 text-muted-foreground'>
          Nutripare is free to use — no credit card, no catch.
        </p>
        <div
          className='grid grid-cols-1 gap-4 sm:grid-cols-2'
          data-testid='benefits-grid'
        >
          {accountBenefits.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className='rounded-xl border border-border bg-card p-6'
              data-testid='benefit-card'
            >
              <Icon className='mb-4 size-9 text-primary' aria-hidden='true' />
              <h3 className='mb-1 font-semibold'>{title}</h3>
              <p className='text-sm text-muted-foreground'>{description}</p>
            </div>
          ))}
        </div>
        <div className='mt-6'>
          <RulesetDemo />
        </div>
      </section>
    </main>
  );
}
