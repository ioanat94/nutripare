"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { CircleHelp, House, Moon, Scale, Sun, User } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

import { cn } from "@/utils/tailwind";
import { useAuth } from "@/contexts/auth-context";
import { useLocaleToggle } from "@/hooks/use-locale";
import { useTheme } from "@/hooks/use-theme";
import { useTranslations } from "next-intl";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const t = useTranslations("Navbar");
  const { locale, toggleLocale } = useLocaleToggle();

  const userHref = user
    ? "/settings/account"
    : "/login?redirect=" +
      encodeURIComponent(pathname === "/login" ? "/" : pathname);

  const userIconClass = loading
    ? "text-muted-foreground"
    : user
      ? "text-primary"
      : "text-foreground";

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-end border-b bg-background px-4 py-2">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "mr-auto",
        )}
      >
        <House />
        <span className="sr-only">{t("home")}</span>
      </Link>
      <Link
        href="/compare"
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <Scale />
        <span className="sr-only">{t("compare")}</span>
      </Link>
      <Link
        href="/help"
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <CircleHelp />
        <span className="sr-only">{t("help")}</span>
      </Link>
      <Link
        href={userHref}
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <User className={userIconClass} />
        <span className="sr-only">
          {user ? t("accountSettings") : t("signIn")}
        </span>
      </Link>
      <Button variant="ghost" size="icon" onClick={toggleTheme}>
        {theme === "dark" ? <Moon /> : <Sun />}
        <span className="sr-only">{t("toggleTheme")}</span>
      </Button>
      <Button variant="ghost" size="icon" onClick={toggleLocale}>
        <span className="text-xs font-semibold" aria-hidden="true">
          {locale.toUpperCase()}
        </span>
        <span className="sr-only">{t("toggleLocale")}</span>
      </Button>
    </nav>
  );
}
