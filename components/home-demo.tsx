import { DEFAULT_ROWS } from "@/utils/constants";
import { DemoTable } from "@/components/demo-table";
import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

export function HomeDemo() {
  const tNutrients = useTranslations("nutrients");
  const tTable = useTranslations("NutritionTable");

  const rows = DEFAULT_ROWS.map((row) => ({
    ...row,
    label: row.key
      ? tNutrients(row.key as Parameters<typeof tNutrients>[0])
      : row.label,
  }));

  return (
    <DemoTable
      rows={rows}
      toolbar={
        <div className="flex items-center justify-between bg-background px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {tTable("productCount_other", { count: 3 })}
          </p>
          <MoreHorizontal
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      }
    />
  );
}
