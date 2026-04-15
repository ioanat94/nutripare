import "./globals.css";

import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/utils/tailwind";
import { getLocale } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={cn(geistSans.variable, geistMono.variable, "dark")}
      suppressHydrationWarning
    >
      <head>
        {/* Inline script runs synchronously before first paint to apply the correct theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('nutripare-theme');if(t==='light')document.documentElement.classList.remove('dark');}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">{children}</body>
    </html>
  );
}
