"use client";

import { DEFAULT_ROWS } from "@/utils/constants";
import { DemoTable } from "@/components/demo-table";
import { RowData } from "@/types/table";
import { cn } from "@/utils/tailwind";
import { useState } from "react";
import { useTranslations } from "next-intl";

type CellDef = { value: string; className: string; emoji: "👑" | "🚩" | null };

// Low Carb: only carbs and sugar
// carbs <20 → positive, <40 → info, >60 → warning, >75 → negative
// sugar <3 → positive, <10 → info, >10 → warning, >15 → negative
// Scores computed via computeScore(): CC=5, GF=55, MO=79
const LOW_CARB_CELLS: Record<string, CellDef[]> = {
  kcals: [
    { value: "381", className: "", emoji: null },
    { value: "336", className: "", emoji: null },
    { value: "379", className: "", emoji: null },
  ],
  protein: [
    { value: "5.8", className: "", emoji: null },
    { value: "11.0", className: "", emoji: null },
    { value: "13.0", className: "", emoji: null },
  ],
  carbohydrates: [
    { value: "84", className: "text-destructive", emoji: "🚩" }, // >75 negative, only one
    { value: "68", className: "text-warning", emoji: null }, // >60 warning
    { value: "66", className: "text-warning", emoji: null }, // >60 warning
  ],
  sugar: [
    { value: "36.0", className: "text-destructive", emoji: "🚩" }, // >15 negative, only one
    { value: "4.4", className: "text-info", emoji: null }, // <10 info
    { value: "1.1", className: "text-positive", emoji: "👑" }, // <3 positive, only one
  ],
  fat: [
    { value: "2.4", className: "", emoji: null },
    { value: "2.2", className: "", emoji: null },
    { value: "7.0", className: "", emoji: null },
  ],
  saturated_fat: [
    { value: "0.5", className: "", emoji: null },
    { value: "0.4", className: "", emoji: null },
    { value: "1.3", className: "", emoji: null },
  ],
  fiber: [
    { value: "2.9", className: "", emoji: null },
    { value: "10.0", className: "", emoji: null },
    { value: "8.0", className: "", emoji: null },
  ],
  salt: [
    { value: "0.5", className: "", emoji: null },
    { value: "0.4", className: "", emoji: null },
    { value: "0.1", className: "", emoji: null },
  ],
  computed_score: [
    { value: "5", className: "", emoji: null },
    { value: "55", className: "", emoji: null },
    { value: "79", className: "", emoji: null },
  ],
};

// High Protein: only protein
// protein >20 → positive, >10 → info, <10 → warning, <5 → negative
// Scores computed via computeScore(): CC=44, GF=52, MO=54
const HIGH_PROTEIN_CELLS: Record<string, CellDef[]> = {
  kcals: [
    { value: "381", className: "", emoji: null },
    { value: "336", className: "", emoji: null },
    { value: "379", className: "", emoji: null },
  ],
  protein: [
    { value: "5.8", className: "text-warning", emoji: null }, // <10 warning
    { value: "11.0", className: "text-info", emoji: null }, // >10 info
    { value: "13.0", className: "text-info", emoji: null }, // >10 info
  ],
  carbohydrates: [
    { value: "84", className: "", emoji: null },
    { value: "68", className: "", emoji: null },
    { value: "66", className: "", emoji: null },
  ],
  sugar: [
    { value: "36.0", className: "", emoji: null },
    { value: "4.4", className: "", emoji: null },
    { value: "1.1", className: "", emoji: null },
  ],
  fat: [
    { value: "2.4", className: "", emoji: null },
    { value: "2.2", className: "", emoji: null },
    { value: "7.0", className: "", emoji: null },
  ],
  saturated_fat: [
    { value: "0.5", className: "", emoji: null },
    { value: "0.4", className: "", emoji: null },
    { value: "1.3", className: "", emoji: null },
  ],
  fiber: [
    { value: "2.9", className: "", emoji: null },
    { value: "10.0", className: "", emoji: null },
    { value: "8.0", className: "", emoji: null },
  ],
  salt: [
    { value: "0.5", className: "", emoji: null },
    { value: "0.4", className: "", emoji: null },
    { value: "0.1", className: "", emoji: null },
  ],
  computed_score: [
    { value: "44", className: "", emoji: null },
    { value: "52", className: "", emoji: null },
    { value: "54", className: "", emoji: null },
  ],
};

// High Fiber: only fiber
// fiber >6 → positive, >3 → info, <3 → warning, <1.5 → negative
// Scores computed via computeScore(): CC=49, GF=86, MO=77
const HIGH_FIBER_CELLS: Record<string, CellDef[]> = {
  kcals: [
    { value: "381", className: "", emoji: null },
    { value: "336", className: "", emoji: null },
    { value: "379", className: "", emoji: null },
  ],
  protein: [
    { value: "5.8", className: "", emoji: null },
    { value: "11.0", className: "", emoji: null },
    { value: "13.0", className: "", emoji: null },
  ],
  carbohydrates: [
    { value: "84", className: "", emoji: null },
    { value: "68", className: "", emoji: null },
    { value: "66", className: "", emoji: null },
  ],
  sugar: [
    { value: "36.0", className: "", emoji: null },
    { value: "4.4", className: "", emoji: null },
    { value: "1.1", className: "", emoji: null },
  ],
  fat: [
    { value: "2.4", className: "", emoji: null },
    { value: "2.2", className: "", emoji: null },
    { value: "7.0", className: "", emoji: null },
  ],
  saturated_fat: [
    { value: "0.5", className: "", emoji: null },
    { value: "0.4", className: "", emoji: null },
    { value: "1.3", className: "", emoji: null },
  ],
  fiber: [
    { value: "2.9", className: "text-warning", emoji: null }, // <3 warning
    { value: "10.0", className: "text-positive", emoji: "👑" }, // >6 positive, highest
    { value: "8.0", className: "text-positive", emoji: null }, // >6 positive
  ],
  salt: [
    { value: "0.5", className: "", emoji: null },
    { value: "0.4", className: "", emoji: null },
    { value: "0.1", className: "", emoji: null },
  ],
  computed_score: [
    { value: "49", className: "", emoji: null },
    { value: "86", className: "", emoji: null },
    { value: "77", className: "", emoji: null },
  ],
};

// Low Fat: fat and saturated fat
// fat <3 → positive, <10 → info, >10 → warning, >17.5 → negative
// sat_fat <1.5 → positive, <3 → info, >3 → warning, >5 → negative
// Scores computed via computeScore(): CC=90, GF=91, MO=67
const LOW_FAT_CELLS: Record<string, CellDef[]> = {
  kcals: [
    { value: "381", className: "", emoji: null },
    { value: "336", className: "", emoji: null },
    { value: "379", className: "", emoji: null },
  ],
  protein: [
    { value: "5.8", className: "", emoji: null },
    { value: "11.0", className: "", emoji: null },
    { value: "13.0", className: "", emoji: null },
  ],
  carbohydrates: [
    { value: "84", className: "", emoji: null },
    { value: "68", className: "", emoji: null },
    { value: "66", className: "", emoji: null },
  ],
  sugar: [
    { value: "36.0", className: "", emoji: null },
    { value: "4.4", className: "", emoji: null },
    { value: "1.1", className: "", emoji: null },
  ],
  fat: [
    { value: "2.4", className: "text-positive", emoji: null }, // <3 positive
    { value: "2.2", className: "text-positive", emoji: "👑" }, // <3 positive, lowest
    { value: "7.0", className: "text-info", emoji: null }, // <10 info
  ],
  saturated_fat: [
    { value: "0.5", className: "text-positive", emoji: null }, // <1.5 positive
    { value: "0.4", className: "text-positive", emoji: "👑" }, // <1.5 positive, lowest
    { value: "1.3", className: "text-positive", emoji: null }, // <1.5 positive
  ],
  fiber: [
    { value: "2.9", className: "", emoji: null },
    { value: "10.0", className: "", emoji: null },
    { value: "8.0", className: "", emoji: null },
  ],
  salt: [
    { value: "0.5", className: "", emoji: null },
    { value: "0.4", className: "", emoji: null },
    { value: "0.1", className: "", emoji: null },
  ],
  computed_score: [
    { value: "90", className: "", emoji: null },
    { value: "91", className: "", emoji: null },
    { value: "67", className: "", emoji: null },
  ],
};

// Low Salt: only salt
// salt <0.3 → positive, <0.75 → info, >0.75 → warning, >1.5 → negative
// Scores computed via computeScore(): CC=55, GF=56, MO=81
const LOW_SALT_CELLS: Record<string, CellDef[]> = {
  kcals: [
    { value: "381", className: "", emoji: null },
    { value: "336", className: "", emoji: null },
    { value: "379", className: "", emoji: null },
  ],
  protein: [
    { value: "5.8", className: "", emoji: null },
    { value: "11.0", className: "", emoji: null },
    { value: "13.0", className: "", emoji: null },
  ],
  carbohydrates: [
    { value: "84", className: "", emoji: null },
    { value: "68", className: "", emoji: null },
    { value: "66", className: "", emoji: null },
  ],
  sugar: [
    { value: "36.0", className: "", emoji: null },
    { value: "4.4", className: "", emoji: null },
    { value: "1.1", className: "", emoji: null },
  ],
  fat: [
    { value: "2.4", className: "", emoji: null },
    { value: "2.2", className: "", emoji: null },
    { value: "7.0", className: "", emoji: null },
  ],
  saturated_fat: [
    { value: "0.5", className: "", emoji: null },
    { value: "0.4", className: "", emoji: null },
    { value: "1.3", className: "", emoji: null },
  ],
  fiber: [
    { value: "2.9", className: "", emoji: null },
    { value: "10.0", className: "", emoji: null },
    { value: "8.0", className: "", emoji: null },
  ],
  salt: [
    { value: "0.5", className: "text-info", emoji: null }, // <0.75 info
    { value: "0.4", className: "text-info", emoji: null }, // <0.75 info
    { value: "0.1", className: "text-positive", emoji: "👑" }, // <0.3 positive, lowest
  ],
  computed_score: [
    { value: "55", className: "", emoji: null },
    { value: "56", className: "", emoji: null },
    { value: "81", className: "", emoji: null },
  ],
};

const RULESET_CELLS = {
  default: null, // uses DEFAULT_ROWS
  "low-carb": LOW_CARB_CELLS,
  "high-protein": HIGH_PROTEIN_CELLS,
  "high-fiber": HIGH_FIBER_CELLS,
  "low-fat": LOW_FAT_CELLS,
  "low-salt": LOW_SALT_CELLS,
} as const;

const RULESET_IDS = [
  "default",
  "low-carb",
  "high-protein",
  "high-fiber",
  "low-fat",
  "low-salt",
] as const;

type RulesetId = (typeof RULESET_IDS)[number];

export function RulesetDemo() {
  const tNutrients = useTranslations("nutrients");
  const tTable = useTranslations("NutritionTable");
  const tRulesets = useTranslations("rulesets");
  const [activeId, setActiveId] = useState<RulesetId>("default");

  const baseRows = DEFAULT_ROWS.map((row) => ({
    ...row,
    label: row.key
      ? tNutrients(row.key as Parameters<typeof tNutrients>[0])
      : row.label,
  }));

  const cellMap = RULESET_CELLS[activeId];
  const rows: RowData[] =
    cellMap === null
      ? baseRows
      : baseRows.map((row) => ({
          ...row,
          cells: row.key && cellMap[row.key] ? cellMap[row.key] : row.cells,
        }));

  return (
    <DemoTable
      rows={rows}
      tableTopPadding
      toolbar={
        <div className="flex flex-col gap-2 border-b border-border bg-background px-4 py-3 sm:flex-row sm:items-center">
          <span className="text-xs text-muted-foreground">
            {tTable("rulesetLabel")}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {RULESET_IDS.map((id) => (
              <button
                key={id}
                onClick={() => setActiveId(id)}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  id === activeId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {tRulesets(`${id}.name` as Parameters<typeof tRulesets>[0])}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}
