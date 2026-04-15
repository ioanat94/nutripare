import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BUILTIN_RULESETS, HELP_SECTIONS } from "@/utils/constants";
import { BackToTop, HelpToc, HelpTocMobile } from "@/components/help-toc";
import {
  Check,
  ExternalLink,
  Maximize2,
  MoreHorizontal,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Link } from "@/i18n/navigation";
import { cn } from "@/utils/tailwind";
import { useTranslations } from "next-intl";

export default function HelpPage() {
  const t = useTranslations("HelpPage");
  const tNutrients = useTranslations("nutrients");
  const tRulesets = useTranslations("rulesets");
  const tRatings = useTranslations("ratings");

  const ratingDot: Record<string, string> = {
    positive: "bg-[var(--positive)]",
    info: "bg-[var(--info)]",
    warning: "bg-[var(--warning)]",
    negative: "bg-destructive",
  };

  const toDisplayRow = (rule: {
    nutrient: string;
    direction: string;
    value: number;
    rating: string;
  }) => ({
    nutrient:
      tNutrients(rule.nutrient as Parameters<typeof tNutrients>[0]) ??
      rule.nutrient,
    threshold: rule.direction,
    value: `${rule.value}g`,
    rating: rule.rating,
  });

  const defaultThresholds = BUILTIN_RULESETS.find(
    (r) => r.id === "default",
  )!.rules.map(toDisplayRow);

  const builtinRulesets = BUILTIN_RULESETS.filter(
    (r) => r.id !== "default",
  ).map((r) => ({
    id: r.id,
    name: tRulesets(`${r.id}.name` as Parameters<typeof tRulesets>[0]),
    description: tRulesets(
      `${r.id}.description` as Parameters<typeof tRulesets>[0],
    ),
    rules: r.rules.map(toDisplayRow),
  }));

  const tocSections = HELP_SECTIONS.map((s) => ({
    id: s.id,
    label: t(
      `sections.${s.id === "nutrition-table" ? "nutritionTable" : s.id === "table-actions" ? "tableActions" : s.id === "settings-account" ? "settingsAccount" : s.id === "settings-nutrition" ? "settingsNutrition" : s.id === "settings-products" ? "settingsProducts" : s.id === "settings-comparisons" ? "settingsComparisons" : s.id === "account-features" ? "accountFeatures" : s.id}.title` as Parameters<
        typeof t
      >[0],
    ),
  }));

  const accountFeatureRows = [
    { key: "searchCompare", out: true, in: true },
    { key: "colorCoded", out: true, in: true },
    { key: "sorting", out: true, in: true },
    { key: "share", out: true, in: true },
    { key: "saveProducts", out: false, in: true },
    { key: "saveComparisons", out: false, in: true },
    { key: "createRulesets", out: false, in: true },
    { key: "controlRows", out: false, in: true },
    { key: "toggleIndicators", out: false, in: true },
    { key: "switchRulesets", out: false, in: true },
    { key: "syncSettings", out: false, in: true },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="mb-10 text-3xl font-bold tracking-tight">{t("title")}</h1>
      <div className="flex gap-12">
        <HelpToc sections={tocSections} />

        <div className="min-w-0 flex-1">
          {/* Mobile ToC */}
          <HelpTocMobile sections={tocSections} />

          <div className="mt-10 space-y-16 lg:mt-0">
            {/* 1. Overview */}
            <section id="overview">
              <h2 className="mb-4 text-2xl font-semibold">
                {t("sections.overview.title")}
              </h2>
              <div className="space-y-3 text-base text-muted-foreground">
                <p>{t("sections.overview.p1")}</p>
                <p>
                  {t.rich("sections.overview.p2", {
                    link: (chunks) => (
                      <a
                        href="https://world.openfoodfacts.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4 hover:text-primary"
                      >
                        {chunks}
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                      </a>
                    ),
                  })}
                </p>
              </div>
            </section>

            {/* 2. Searching for Products */}
            <section id="searching">
              <h2 className="mb-4 text-2xl font-semibold">
                {t("sections.searching.title")}
              </h2>
              <div className="space-y-3 text-base text-muted-foreground">
                <p>{t("sections.searching.p1")}</p>
                <p>
                  {t.rich("sections.searching.p2", {
                    example: (chunks) => (
                      <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                        {chunks}
                      </code>
                    ),
                  })}
                </p>
                <p>
                  {t("sections.searching.p3Pre")}
                  <span className="text-foreground font-medium">
                    {t("sections.searching.p3Mid")}
                  </span>
                  {t("sections.searching.p3Post")}
                </p>
                <p>{t("sections.searching.errors")}</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <span className="text-foreground">
                      {t("sections.searching.invalidFormat")}
                    </span>{" "}
                    — {t("sections.searching.invalidFormatDesc")}
                  </li>
                  <li>
                    <span className="text-foreground">
                      {t("sections.searching.notFound")}
                    </span>{" "}
                    — {t("sections.searching.notFoundDesc")}
                  </li>
                </ul>
              </div>
            </section>

            {/* 3. The Nutrition Table */}
            <section id="nutrition-table">
              <h2 className="mb-4 text-2xl font-semibold">
                {t("sections.nutritionTable.title")}
              </h2>
              <div className="space-y-3 text-base text-muted-foreground">
                <p>{t("sections.nutritionTable.p1")}</p>

                <h3 className="text-base font-semibold text-foreground pt-2">
                  {t("sections.nutritionTable.colorCoding")}
                </h3>
                <ul className="space-y-1.5 pl-1">
                  {(["green", "blue", "amber", "red"] as const).map((color) => {
                    const dotMap = {
                      green: "bg-[var(--positive)]",
                      blue: "bg-[var(--info)]",
                      amber: "bg-[var(--warning)]",
                      red: "bg-destructive",
                    };
                    return (
                      <li key={color} className="flex items-start gap-2">
                        <span
                          className={cn(
                            "mt-1.5 size-2 shrink-0 rounded-full",
                            dotMap[color],
                          )}
                        />
                        <span>
                          <span className="text-foreground font-medium">
                            {t(
                              `sections.nutritionTable.colors.${color}.label` as Parameters<
                                typeof t
                              >[0],
                            )}
                          </span>{" "}
                          —{" "}
                          {t(
                            `sections.nutritionTable.colors.${color}.desc` as Parameters<
                              typeof t
                            >[0],
                          )}
                        </span>
                      </li>
                    );
                  })}
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-border" />
                    <span>
                      <span className="text-foreground font-medium">
                        {t("sections.nutritionTable.colors.none.label")}
                      </span>{" "}
                      — {t("sections.nutritionTable.colors.none.desc")}
                    </span>
                  </li>
                </ul>

                <h3 className="text-base font-semibold text-foreground pt-2">
                  {t("sections.nutritionTable.emojis")}
                </h3>
                <ul className="space-y-1.5 pl-1">
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.nutritionTable.crown")}
                    </span>{" "}
                    — {t("sections.nutritionTable.crownDesc")}
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.nutritionTable.flag")}
                    </span>{" "}
                    — {t("sections.nutritionTable.flagDesc")}
                  </li>
                </ul>
                <p>{t("sections.nutritionTable.emojiNote")}</p>

                <h3 className="text-base font-semibold text-foreground pt-2">
                  {t("sections.nutritionTable.defaultThresholds")}
                </h3>
                <p>
                  {t.rich("sections.nutritionTable.defaultThresholdsDesc", {
                    highlight: (chunks) => (
                      <span className="text-foreground font-medium">
                        {chunks}
                      </span>
                    ),
                  })}
                </p>
                <div className="overflow-x-auto rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          {t("sections.nutritionTable.tableHeaders.nutrient")}
                        </TableHead>
                        <TableHead>
                          {t("sections.nutritionTable.tableHeaders.threshold")}
                        </TableHead>
                        <TableHead>
                          {t("sections.nutritionTable.tableHeaders.value")}
                        </TableHead>
                        <TableHead>
                          {t("sections.nutritionTable.tableHeaders.rating")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {defaultThresholds.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.nutrient}</TableCell>
                          <TableCell>{row.threshold}</TableCell>
                          <TableCell>{row.value}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "size-2 shrink-0 rounded-full",
                                  ratingDot[row.rating] ?? "bg-muted",
                                )}
                              />
                              {tRatings(
                                row.rating as Parameters<typeof tRatings>[0],
                              )}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <h3 className="text-base font-semibold text-foreground pt-2">
                  {t("sections.nutritionTable.builtinRulesets")}
                </h3>
                <p>{t("sections.nutritionTable.builtinRulesetsDesc")}</p>
                {builtinRulesets.map((ruleset) => (
                  <div key={ruleset.id}>
                    <h4 className="text-sm font-semibold text-foreground pt-2 pb-1">
                      {ruleset.name}
                    </h4>
                    <p>{ruleset.description}</p>
                    <div className="overflow-x-auto rounded-md border border-border mt-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              {t(
                                "sections.nutritionTable.tableHeaders.nutrient",
                              )}
                            </TableHead>
                            <TableHead>
                              {t(
                                "sections.nutritionTable.tableHeaders.threshold",
                              )}
                            </TableHead>
                            <TableHead>
                              {t("sections.nutritionTable.tableHeaders.value")}
                            </TableHead>
                            <TableHead>
                              {t("sections.nutritionTable.tableHeaders.rating")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ruleset.rules.map((row, i) => (
                            <TableRow key={i}>
                              <TableCell>{row.nutrient}</TableCell>
                              <TableCell>{row.threshold}</TableCell>
                              <TableCell>{row.value}</TableCell>
                              <TableCell>
                                <span className="flex items-center gap-1.5">
                                  <span
                                    className={cn(
                                      "size-2 shrink-0 rounded-full",
                                      ratingDot[row.rating] ?? "bg-muted",
                                    )}
                                  />
                                  {tRatings(
                                    row.rating as Parameters<
                                      typeof tRatings
                                    >[0],
                                  )}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}

                <h3 className="text-base font-semibold text-foreground pt-2">
                  {t("sections.nutritionTable.sorting")}
                </h3>
                <p>{t("sections.nutritionTable.sortingDesc")}</p>

                <h3 className="text-base font-semibold text-foreground pt-2">
                  {t("sections.nutritionTable.computedScore")}
                </h3>
                <p>{t("sections.nutritionTable.computedScoreDesc")}</p>
                <p>{t("sections.nutritionTable.scoreFormula")}</p>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>{t("sections.nutritionTable.scoreStep1")}</li>
                  <li>
                    {t.rich("sections.nutritionTable.scoreStep2", {
                      formula: (chunks) => (
                        <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                          {chunks}
                        </code>
                      ),
                      distance: (chunks) => (
                        <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                          {chunks}
                        </code>
                      ),
                    })}
                  </li>
                  <li>
                    {t.rich("sections.nutritionTable.scoreStep3", {
                      formula: (chunks) => (
                        <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                          {chunks}
                        </code>
                      ),
                    })}
                  </li>
                </ol>
                <p>{t("sections.nutritionTable.scoreNote")}</p>
              </div>
            </section>

            {/* 4. Table Actions */}
            <section id="table-actions">
              <h2 className="mb-4 text-2xl font-semibold">
                {t("sections.tableActions.title")}
              </h2>
              <div className="space-y-3 text-base text-muted-foreground">
                <p>
                  {t.rich("sections.tableActions.expandDesc", {
                    icon: () => (
                      <Maximize2
                        className="mb-0.5 inline size-4 align-middle"
                        aria-hidden="true"
                      />
                    ),
                  })}
                </p>
                <p>
                  {t.rich("sections.tableActions.menuDesc", {
                    icon: () => (
                      <MoreHorizontal
                        className="mb-0.5 inline size-4 align-middle"
                        aria-hidden="true"
                      />
                    ),
                  })}
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.tableActions.switchRuleset")}
                    </span>{" "}
                    {t("sections.tableActions.switchRulesetDesc")}
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.tableActions.saveUpdate")}
                    </span>{" "}
                    {t("sections.tableActions.saveUpdateDesc")}
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.tableActions.shareAction")}
                    </span>{" "}
                    — {t("sections.tableActions.shareActionDesc")}
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.tableActions.clearAllAction")}
                    </span>{" "}
                    — {t("sections.tableActions.clearAllActionDesc")}
                  </li>
                </ul>
                <p>
                  {t.rich("sections.tableActions.perColumnMenu", {
                    icon: () => (
                      <MoreHorizontal
                        className="mb-0.5 inline size-4 align-middle"
                        aria-hidden="true"
                      />
                    ),
                  })}
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.tableActions.saveProductAction")}
                    </span>{" "}
                    {t("sections.tableActions.saveProductDesc")}
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.tableActions.pinAction")}
                    </span>{" "}
                    — {t("sections.tableActions.pinDesc")}
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.tableActions.shareColumn")}
                    </span>{" "}
                    — {t("sections.tableActions.shareColumnDesc")}
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.tableActions.removeAction")}
                    </span>{" "}
                    — {t("sections.tableActions.removeDesc")}
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.tableActions.reportAction")}
                    </span>{" "}
                    — {t("sections.tableActions.reportDesc")}
                  </li>
                </ul>
              </div>
            </section>

            {/* 5. Saving */}
            <section id="saving">
              <h2 className="mb-4 text-2xl font-semibold">
                {t("sections.saving.title")}
              </h2>
              <div className="space-y-3 text-base text-muted-foreground">
                <p>{t("sections.saving.p1")}</p>
                <p>{t("sections.saving.p2")}</p>
                <p>
                  {t.rich("sections.saving.p3", {
                    icon: () => (
                      <MoreHorizontal
                        className="mb-0.5 inline size-4 align-middle"
                        aria-hidden="true"
                      />
                    ),
                    update: (chunks) => (
                      <span className="text-foreground font-medium">
                        {chunks}
                      </span>
                    ),
                    saveAsNew: (chunks) => (
                      <span className="text-foreground font-medium">
                        {chunks}
                      </span>
                    ),
                  })}
                </p>
                <p>
                  {t.rich("sections.saving.p4", {
                    icon: () => (
                      <MoreHorizontal
                        className="mb-0.5 inline size-4 align-middle"
                        aria-hidden="true"
                      />
                    ),
                    delete: (chunks) => (
                      <span className="text-foreground font-medium">
                        {chunks}
                      </span>
                    ),
                    unsave: (chunks) => (
                      <span className="text-foreground font-medium">
                        {chunks}
                      </span>
                    ),
                  })}
                </p>
              </div>
            </section>

            {/* 6. Settings — Account */}
            <section id="settings-account">
              <h2 className="mb-4 text-2xl font-semibold">
                {t("sections.settingsAccount.title")}
              </h2>
              <p className="text-base text-muted-foreground">
                {t("sections.settingsAccount.content")}
              </p>
            </section>

            {/* 7. Settings — Nutrition */}
            <section id="settings-nutrition">
              <h2 className="mb-4 text-2xl font-semibold">
                {t("sections.settingsNutrition.title")}
              </h2>
              <div className="space-y-3 text-base text-muted-foreground">
                <p>
                  <span className="text-foreground font-medium">
                    {t("sections.settingsNutrition.visibleRows")}
                  </span>{" "}
                  — {t("sections.settingsNutrition.visibleRowsDesc")}
                </p>
                <p>
                  <span className="text-foreground font-medium">
                    {t("sections.settingsNutrition.highlights")}
                  </span>{" "}
                  — {t("sections.settingsNutrition.highlightsDesc")}
                </p>
                <p>
                  <span className="text-foreground font-medium">
                    {t("sections.settingsNutrition.rulesets")}
                  </span>{" "}
                  — {t("sections.settingsNutrition.rulesetsDesc")}
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    {t.rich("sections.settingsNutrition.eyeIconDesc", {
                      icon: (chunks) => (
                        <span className="text-foreground font-medium">
                          {chunks}
                        </span>
                      ),
                    })}
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.settingsNutrition.trashIcon")}
                    </span>{" "}
                    {t("sections.settingsNutrition.trashIconDesc")}
                  </li>
                  <li>
                    {t.rich("sections.settingsNutrition.addRulesetDesc", {
                      newRuleset: (chunks) => (
                        <span className="text-foreground font-medium">
                          {chunks}
                        </span>
                      ),
                      fromTemplate: (chunks) => (
                        <span className="text-foreground font-medium">
                          {chunks}
                        </span>
                      ),
                    })}
                  </li>
                </ul>
                <p>{t("sections.settingsNutrition.editorTitle")}</p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    {t("sections.settingsNutrition.editorItems.editName")}
                  </li>
                  <li>
                    {t("sections.settingsNutrition.editorItems.ruleFields")}
                  </li>
                  <li>{t("sections.settingsNutrition.editorItems.reorder")}</li>
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.settingsNutrition.editorItems.addRule")}
                    </span>{" "}
                    {t("sections.settingsNutrition.editorItems.addRuleDesc")}
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.settingsNutrition.editorItems.save")}
                    </span>{" "}
                    {t("sections.settingsNutrition.editorItems.saveDesc")}
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      {t(
                        "sections.settingsNutrition.editorItems.deleteRuleset",
                      )}
                    </span>{" "}
                    {t(
                      "sections.settingsNutrition.editorItems.deleteRulesetDesc",
                    )}
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.settingsNutrition.editorItems.cancel")}
                    </span>{" "}
                    {t("sections.settingsNutrition.editorItems.cancelDesc")}
                  </li>
                </ul>
                <p>
                  {t.rich("sections.settingsNutrition.saveNote", {
                    save: (chunks) => (
                      <span className="text-foreground font-medium">
                        {chunks}
                      </span>
                    ),
                    reset: (chunks) => (
                      <span className="text-foreground font-medium">
                        {chunks}
                      </span>
                    ),
                  })}
                </p>
              </div>
            </section>

            {/* 8. Settings — Products */}
            <section id="settings-products">
              <h2 className="mb-4 text-2xl font-semibold">
                {t("sections.settingsProducts.title")}
              </h2>
              <div className="space-y-3 text-base text-muted-foreground">
                <p>{t("sections.settingsProducts.p1")}</p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.settingsProducts.viewButton")}
                    </span>{" "}
                    — {t("sections.settingsProducts.viewButtonDesc")}
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.settingsProducts.unsaveButton")}
                    </span>{" "}
                    — {t("sections.settingsProducts.unsaveButtonDesc")}
                  </li>
                </ul>
                <p>
                  {t.rich("sections.settingsProducts.compareNote", {
                    compare: (chunks) => (
                      <span className="text-foreground font-medium">
                        {chunks}
                      </span>
                    ),
                  })}
                </p>
              </div>
            </section>

            {/* 9. Settings — Comparisons */}
            <section id="settings-comparisons">
              <h2 className="mb-4 text-2xl font-semibold">
                {t("sections.settingsComparisons.title")}
              </h2>
              <div className="space-y-3 text-base text-muted-foreground">
                <p>{t("sections.settingsComparisons.p1")}</p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.settingsComparisons.pencilIcon")}
                    </span>{" "}
                    — {t("sections.settingsComparisons.pencilIconDesc")}
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.settingsComparisons.viewButton")}
                    </span>{" "}
                    — {t("sections.settingsComparisons.viewButtonDesc")}
                  </li>
                  <li>
                    <span className="text-foreground font-medium">
                      {t("sections.settingsComparisons.unsaveButton")}
                    </span>{" "}
                    — {t("sections.settingsComparisons.unsaveButtonDesc")}
                  </li>
                </ul>
              </div>
            </section>

            {/* 10. Signed-in vs. Signed-out */}
            <section id="account-features">
              <h2 className="mb-4 text-2xl font-semibold">
                {t("sections.accountFeatures.title")}
              </h2>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-base">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground w-full" />
                      <th
                        aria-label={t("sections.accountFeatures.signedOut")}
                        className="px-4 py-3 text-center min-w-16 sm:min-w-24"
                      >
                        <UserX
                          className="mx-auto size-5 text-muted-foreground"
                          aria-hidden="true"
                        />
                      </th>
                      <th
                        aria-label={t("sections.accountFeatures.signedIn")}
                        className="w-16 px-4 py-3 text-center bg-primary/5 sm:w-24"
                      >
                        <UserCheck
                          className="mx-auto size-5 text-primary"
                          aria-hidden="true"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountFeatureRows.map((row, i) => (
                      <tr
                        key={row.key}
                        className={
                          i % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                        }
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {t(
                            `sections.accountFeatures.features.${row.key}` as Parameters<
                              typeof t
                            >[0],
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.out ? (
                            <Check
                              className="mx-auto size-4 text-positive"
                              aria-label="Yes"
                            />
                          ) : (
                            <X
                              className="mx-auto size-4 text-destructive/40"
                              aria-label="No"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center bg-primary/5 min-w-16 sm:min-w-24">
                          {row.in ? (
                            <Check
                              className="mx-auto size-4 text-positive"
                              aria-label="Yes"
                            />
                          ) : (
                            <X
                              className="mx-auto size-4 text-destructive/40"
                              aria-label="No"
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* FAQ */}
            <section id="faq">
              <h2 className="mb-8 text-2xl font-semibold">
                {t("sections.faq.title")}
              </h2>
              <div className="space-y-10">
                {/* Scanning & Products */}
                <div>
                  <h3 className="mb-3 text-base font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("sections.faq.scanning")}
                  </h3>
                  <Accordion multiple className="w-full">
                    <AccordionItem value="barcode-not-recognized">
                      <AccordionTrigger>
                        {t("sections.faq.questions.barcodeNotRecognized.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t.rich(
                          "sections.faq.questions.barcodeNotRecognized.a",
                          {
                            link: (chunks) => (
                              <a
                                href="https://world.openfoodfacts.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1"
                              >
                                {chunks}
                                <ExternalLink
                                  className="size-3"
                                  aria-hidden="true"
                                />
                              </a>
                            ),
                          },
                        )}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data-source">
                      <AccordionTrigger>
                        {t("sections.faq.questions.dataSource.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t.rich("sections.faq.questions.dataSource.a", {
                          link: (chunks) => (
                            <a
                              href="https://world.openfoodfacts.org"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1"
                            >
                              {chunks}
                              <ExternalLink
                                className="size-3"
                                aria-hidden="true"
                              />
                            </a>
                          ),
                        })}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="missing-product">
                      <AccordionTrigger>
                        {t("sections.faq.questions.missingProduct.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t("sections.faq.questions.missingProduct.a")}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="store-barcodes">
                      <AccordionTrigger>
                        {t("sections.faq.questions.storeBarcodes.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t("sections.faq.questions.storeBarcodes.a")}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="inaccurate-data">
                      <AccordionTrigger>
                        {t("sections.faq.questions.inaccurateData.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t("sections.faq.questions.inaccurateData.a")}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Scoring */}
                <div>
                  <h3 className="mb-3 text-base font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("sections.faq.scoring")}
                  </h3>
                  <Accordion multiple className="w-full">
                    <AccordionItem value="score-meaning">
                      <AccordionTrigger>
                        {t("sections.faq.scoringQuestions.scoreMeaning.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t("sections.faq.scoringQuestions.scoreMeaning.a")}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="low-score">
                      <AccordionTrigger>
                        {t("sections.faq.scoringQuestions.lowScore.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t("sections.faq.scoringQuestions.lowScore.a")}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="similar-scores">
                      <AccordionTrigger>
                        {t("sections.faq.scoringQuestions.similarScores.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t("sections.faq.scoringQuestions.similarScores.a")}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Comparisons & Settings */}
                <div>
                  <h3 className="mb-3 text-base font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("sections.faq.comparisons")}
                  </h3>
                  <Accordion multiple className="w-full">
                    <AccordionItem value="compare-limit">
                      <AccordionTrigger>
                        {t("sections.faq.comparisonsQuestions.compareLimit.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t("sections.faq.comparisonsQuestions.compareLimit.a")}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="save-difference">
                      <AccordionTrigger>
                        {t(
                          "sections.faq.comparisonsQuestions.saveDifference.q",
                        )}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t(
                          "sections.faq.comparisonsQuestions.saveDifference.a",
                        )}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="rules-update">
                      <AccordionTrigger>
                        {t("sections.faq.comparisonsQuestions.rulesUpdate.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t("sections.faq.comparisonsQuestions.rulesUpdate.a")}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="reset-settings">
                      <AccordionTrigger>
                        {t("sections.faq.comparisonsQuestions.resetSettings.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t("sections.faq.comparisonsQuestions.resetSettings.a")}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Account */}
                <div>
                  <h3 className="mb-3 text-base font-semibold text-muted-foreground uppercase tracking-wide">
                    {t("sections.faq.account")}
                  </h3>
                  <Accordion multiple className="w-full">
                    <AccordionItem value="need-account">
                      <AccordionTrigger>
                        {t("sections.faq.accountQuestions.needAccount.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t("sections.faq.accountQuestions.needAccount.a")}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="data-stored">
                      <AccordionTrigger>
                        {t("sections.faq.accountQuestions.dataStored.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t("sections.faq.accountQuestions.dataStored.a")}{" "}
                        <Link
                          href="/privacy"
                          className="underline underline-offset-4 hover:text-primary"
                        >
                          Privacy Policy
                        </Link>
                        .
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="multiple-devices">
                      <AccordionTrigger>
                        {t("sections.faq.accountQuestions.multipleDevices.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t("sections.faq.accountQuestions.multipleDevices.a")}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="delete-data">
                      <AccordionTrigger>
                        {t("sections.faq.accountQuestions.deleteData.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t("sections.faq.accountQuestions.deleteData.a")}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="export-data">
                      <AccordionTrigger>
                        {t("sections.faq.accountQuestions.exportData.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t("sections.faq.accountQuestions.exportData.a")}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="ruleset-lost">
                      <AccordionTrigger>
                        {t("sections.faq.accountQuestions.rulesetLost.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t("sections.faq.accountQuestions.rulesetLost.a")}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="google-account">
                      <AccordionTrigger>
                        {t("sections.faq.accountQuestions.googleAccount.q")}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {t("sections.faq.accountQuestions.googleAccount.a")}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      <BackToTop />
    </main>
  );
}
