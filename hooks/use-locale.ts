"use client";

import { usePathname, useRouter } from "@/i18n/navigation";

import { useLocale } from "next-intl";
import { useTransition } from "react";

export function useLocaleToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startPending] = useTransition();

  function toggleLocale() {
    const next = locale === "en" ? "fi" : "en";
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
