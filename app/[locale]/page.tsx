import {
  ArrowLeftRight,
  ArrowUpDown,
  Bookmark,
  FolderHeart,
  Gauge,
  Layers,
  ScanBarcode,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { HomeDemo } from "@/components/home-demo";
import { Link } from "@/i18n/navigation";
import { RulesetDemo } from "@/components/ruleset-demo";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("HomePage");

  const features = [
    {
      icon: ScanBarcode,
      title: t("features.items.scan.title"),
      description: t("features.items.scan.description"),
    },
    {
      icon: Gauge,
      title: t("features.items.glance.title"),
      description: t("features.items.glance.description"),
    },
    {
      icon: ArrowLeftRight,
      title: t("features.items.compare.title"),
      description: t("features.items.compare.description"),
    },
    {
      icon: ArrowUpDown,
      title: t("features.items.sort.title"),
      description: t("features.items.sort.description"),
    },
  ];

  const accountBenefits = [
    {
      icon: Bookmark,
      title: t("benefits.items.saveProducts.title"),
      description: t("benefits.items.saveProducts.description"),
    },
    {
      icon: FolderHeart,
      title: t("benefits.items.saveComparisons.title"),
      description: t("benefits.items.saveComparisons.description"),
    },
    {
      icon: SlidersHorizontal,
      title: t("benefits.items.chooseNutrients.title"),
      description: t("benefits.items.chooseNutrients.description"),
    },
    {
      icon: Layers,
      title: t("benefits.items.buildProfiles.title"),
      description: t("benefits.items.buildProfiles.description"),
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
          {t("hero.title1")}{" "}
          <span className="text-primary">{t("hero.title2")}</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          {t("hero.description")}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            className="px-6 text-base"
            nativeButton={false}
            render={<Link href="/compare" />}
          >
            {t("hero.startComparing")}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="px-6 text-base dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
            nativeButton={false}
            render={<Link href="/help" />}
          >
            {t("hero.howItWorks")}
          </Button>
        </div>
        <HomeDemo />
      </section>

      {/* Features */}
      <section className="mt-24">
        <h2 className="mb-2 text-3xl font-bold tracking-tight">
          {t("features.title")}
        </h2>
        <p className="mb-8 text-muted-foreground">{t("features.subtitle")}</p>
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          data-testid="features-grid"
        >
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-6"
              data-testid="feature-card"
            >
              <Icon className="mb-4 size-9 text-primary" aria-hidden="true" />
              <h3 className="mb-1 font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Account benefits */}
      <section className="mt-24">
        <h2 className="mb-2 text-3xl font-bold tracking-tight">
          {t("benefits.title")}
        </h2>
        <p className="mb-8 text-muted-foreground">{t("benefits.subtitle")}</p>
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
          data-testid="benefits-grid"
        >
          {accountBenefits.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-6"
              data-testid="benefit-card"
            >
              <Icon className="mb-4 size-9 text-primary" aria-hidden="true" />
              <h3 className="mb-1 font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <RulesetDemo />
        </div>
      </section>
    </main>
  );
}
