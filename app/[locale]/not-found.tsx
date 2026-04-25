import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button-variants";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("NotFoundPage");
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <Link href="/" className={buttonVariants()}>
        {t("goHome")}
      </Link>
    </main>
  );
}
