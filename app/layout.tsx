import './globals.css';

import { Geist, Geist_Mono } from 'next/font/google';

import { Footer } from '@/components/footer';
import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Providers } from '@/app/providers';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/utils/tailwind';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Nutripare',
  description: 'Make healthier food choices',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={cn(geistSans.variable, geistMono.variable)}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('nutripare-theme');if(t==='light')document.documentElement.classList.remove('dark');else document.documentElement.classList.add('dark');}catch(e){console.error('Error reading theme');}`,
          }}
        />
      </head>
      <body className='flex min-h-dvh flex-col antialiased'>
        <Providers>
          <Navbar />
          {children}
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
