"use client";

import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations("ErrorPage");
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <div className="flex gap-2">
        <button onClick={reset} className={buttonVariants()}>
          {t("tryAgain")}
        </button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          {t("goHome")}
        </Link>
      </div>
    </main>
  );
}
