"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function useLocaleToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startPending] = useTransition();

  function toggleLocale() {
    const next = locale === "en" ? "fi" : "en";
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
    try {
      localStorage.setItem("nutripare-locale", next);
    } catch {
      // ignore storage errors
    }
    startPending(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return { locale, toggleLocale, isPending };
}
