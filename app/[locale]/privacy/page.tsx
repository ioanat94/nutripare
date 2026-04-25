import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("PrivacyPage");

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mb-10 text-sm text-muted-foreground">{t("lastUpdated")}</p>

      <div className="space-y-10 text-base text-muted-foreground">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            {t("sections.responsible.title")}
          </h2>
          <p>
            {t.rich("sections.responsible.content", {
              email: (chunks) => (
                <a
                  href="mailto:ioanatiplea94@gmail.com"
                  className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            {t("sections.collected.title")}
          </h2>
          <div className="space-y-3">
            <p>{t("sections.collected.noAccount")}</p>
            <p>{t("sections.collected.withAccount")}</p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <span className="font-medium text-foreground">
                  {t("sections.collected.items.emailAndName.label")}
                </span>{" "}
                — {t("sections.collected.items.emailAndName.description")}
              </li>
              <li>
                <span className="font-medium text-foreground">
                  {t("sections.collected.items.savedData.label")}
                </span>{" "}
                — {t("sections.collected.items.savedData.description")}
              </li>
              <li>
                <span className="font-medium text-foreground">
                  {t("sections.collected.items.nutritionSettings.label")}
                </span>{" "}
                — {t("sections.collected.items.nutritionSettings.description")}
              </li>
            </ul>
            <p>{t("sections.collected.noTracking")}</p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            {t("sections.storage.title")}
          </h2>
          <p>
            {t.rich("sections.storage.content", {
              link: (chunks) => (
                <a
                  href="https://firebase.google.com/support/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            {t("sections.retention.title")}
          </h2>
          <p>{t("sections.retention.content")}</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            {t("sections.rights.title")}
          </h2>
          <div className="space-y-3">
            <p>{t("sections.rights.intro")}</p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <span className="font-medium text-foreground">
                  {t("sections.rights.items.download.label")}
                </span>{" "}
                — {t("sections.rights.items.download.description")}
              </li>
              <li>
                <span className="font-medium text-foreground">
                  {t("sections.rights.items.update.label")}
                </span>{" "}
                — {t("sections.rights.items.update.description")}
              </li>
              <li>
                <span className="font-medium text-foreground">
                  {t("sections.rights.items.delete.label")}
                </span>{" "}
                — {t("sections.rights.items.delete.description")}
              </li>
            </ul>
            <p>
              {t.rich("sections.rights.contact", {
                email: (chunks) => (
                  <a
                    href="mailto:ioanatiplea94@gmail.com"
                    className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            {t("sections.cookies.title")}
          </h2>
          <p>{t("sections.cookies.content")}</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-foreground">
            {t("sections.changes.title")}
          </h2>
          <p>{t("sections.changes.content")}</p>
        </section>
      </div>
    </main>
  );
}
