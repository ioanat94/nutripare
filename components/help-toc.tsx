'use client';

import { useEffect, useState } from 'react';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/tailwind';

interface Section {
  id: string;
  label: string;
}

interface HelpTocProps {
  sections: Section[];
}

export function HelpToc({ sections }: HelpTocProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );

    const elements = sections
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    elements.forEach((el) => observer.observe(el));
    return () => elements.forEach((el) => observer.unobserve(el));
  }, [sections]);

  return (
    <aside className='hidden lg:block w-56 shrink-0'>
      <nav className='sticky top-24 space-y-1' aria-label='Page sections'>
        <p className='mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
          On this page
        </p>
        {sections.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className={
              activeId === id
                ? 'block rounded-md bg-primary/15 px-2 py-1 text-sm font-semibold text-primary transition-colors'
                : 'block rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            }
          >
            {label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

export function HelpTocMobile({ sections }: HelpTocProps) {
  const [open, setOpen] = useState(false);

  return (
    <nav className='lg:hidden' aria-label='Page sections'>
      <div className='rounded-xl border border-border bg-card overflow-hidden'>
        <button
          onClick={() => setOpen((o) => !o)}
          className='flex w-full items-center justify-between px-4 py-3 text-left'
          aria-expanded={open}
          aria-controls='help-toc-mobile-list'
        >
          <span className='flex items-center gap-2'>
            <span className='text-sm font-semibold text-foreground'>
              On this page
            </span>
            <span className='text-xs text-muted-foreground'>
              · {sections.length} sections
            </span>
          </span>
          <ChevronDown
            className={cn(
              'size-4 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180',
            )}
            aria-hidden='true'
          />
        </button>

        {open && (
          <div
            id='help-toc-mobile-list'
            className='border-t border-border px-4 py-3'
          >
            <ul className='space-y-1'>
              {sections.map(({ id, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={() => setOpen(false)}
                    className='block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
