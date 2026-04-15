"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Report, ReportReason, ReportStatus } from "@/types/firestore";
import { getAllReports, updateReportStatus } from "@/lib/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/tailwind";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from "next-intl";

const PAGE_SIZE = 25;

type Filter = ReportStatus | "all";
type ReasonFilter = ReportReason | "all";

const STATUS_CLASSES: Record<ReportStatus, string> = {
  open: "bg-warning/15 text-warning",
  solved: "bg-positive/15 text-positive",
  dismissed: "bg-muted text-muted-foreground",
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("AdminPage");

  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<Filter>("open");
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>("all");
  const [page, setPage] = useState(1);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    getAllReports()
      .then((data) => {
        setReports(data);
        setDataLoading(false);
      })
      .catch(() => {
        router.replace("/");
      });
  }, [authLoading, user, router]);

  async function handleStatusChange(code: string, status: ReportStatus) {
    await updateReportStatus(code, status);
    setReports((prev) =>
      prev.map((r) => (r.code === code ? { ...r, status } : r)),
    );
  }

  function handleSelectRow(code: string, checked: boolean) {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });
  }

  function handleSelectAll(checked: boolean) {
    setSelectedCodes(
      checked ? new Set(paginated.map((r) => r.code)) : new Set(),
    );
  }

  async function handleBulkStatusChange(status: ReportStatus) {
    const codes = Array.from(selectedCodes);
    await Promise.all(codes.map((code) => updateReportStatus(code, status)));
    setReports((prev) =>
      prev.map((r) => (selectedCodes.has(r.code) ? { ...r, status } : r)),
    );
    setSelectedCodes(new Set());
  }

  const byStatus =
    statusFilter === "all"
      ? reports
      : reports.filter((r) => r.status === statusFilter);
  const byReason =
    reasonFilter === "all"
      ? reports
      : reports.filter((r) => r.reason === reasonFilter);

  const filtered = reports
    .filter((r) => statusFilter === "all" || r.status === statusFilter)
    .filter((r) => reasonFilter === "all" || r.reason === reasonFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allOnPageSelected =
    paginated.length > 0 && paginated.every((r) => selectedCodes.has(r.code));
  const someOnPageSelected =
    !allOnPageSelected && paginated.some((r) => selectedCodes.has(r.code));

  const statusCounts: Record<Filter, number> = {
    all: byReason.length,
    open: byReason.filter((r) => r.status === "open").length,
    solved: byReason.filter((r) => r.status === "solved").length,
    dismissed: byReason.filter((r) => r.status === "dismissed").length,
  };

  const reasons: ReasonFilter[] = ["all", "incorrect data", "missing product"];
  const reasonCounts: Record<ReasonFilter, number> = {
    all: byStatus.length,
    "incorrect data": byStatus.filter((r) => r.reason === "incorrect data")
      .length,
    "missing product": byStatus.filter((r) => r.reason === "missing product")
      .length,
  };

  if (authLoading || dataLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="flex justify-center text-muted-foreground text-sm">
          {t("loading")}
        </div>
      </main>
    );
  }

  const filters: Filter[] = ["all", "open", "solved", "dismissed"];

  function statusLabel(f: Filter): string {
    if (f === "all") return t("allStatuses");
    return t(`status.${f}` as Parameters<typeof t>[0]);
  }

  function reasonLabel(r: ReasonFilter): string {
    if (r === "all") return t("allReasons");
    if (r === "incorrect data") return t("reason.incorrectData");
    return t("reason.missingProduct");
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      </div>

      {/* Filter rows */}
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex gap-2">
          {filters.map((f) => (
            <Button
              key={f}
              variant={statusFilter === f ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(f);
                setPage(1);
                setSelectedCodes(new Set());
              }}
            >
              {statusLabel(f)}
              <span className="ml-1 tabular-nums text-xs opacity-70">
                ({statusCounts[f]})
              </span>
            </Button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {reasons.map((r) => (
              <Button
                key={r}
                variant={reasonFilter === r ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setReasonFilter(r);
                  setPage(1);
                  setSelectedCodes(new Set());
                }}
              >
                {reasonLabel(r)}
                <span className="ml-1 tabular-nums text-xs opacity-70">
                  ({reasonCounts[r]})
                </span>
              </Button>
            ))}
          </div>
          {selectedCodes.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {t("selected", { count: selectedCodes.size })}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                  )}
                >
                  {t("changeStatus")}
                  <ChevronDown className="ml-1 size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleBulkStatusChange("open")}
                  >
                    {t("status.open")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkStatusChange("solved")}
                  >
                    {t("status.solved")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkStatusChange("dismissed")}
                  >
                    {t("status.dismissed")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  aria-label={t("selectAll")}
                  checked={allOnPageSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someOnPageSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="cursor-pointer accent-primary"
                />
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                {t("columns.code")}
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                {t("columns.date")}
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                {t("columns.reason")}
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                {t("columns.status")}
              </th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                {t("columns.action")}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {t("noReports")}
                </td>
              </tr>
            ) : (
              paginated.map((r) => (
                <tr
                  key={r.code}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={t("selectRow", { code: r.code })}
                      checked={selectedCodes.has(r.code)}
                      onChange={(e) =>
                        handleSelectRow(r.code, e.target.checked)
                      }
                      className="cursor-pointer accent-primary"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono">{r.code}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.date.toDate().toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{r.reason}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        STATUS_CLASSES[r.status],
                      )}
                    >
                      {t(`status.${r.status}` as Parameters<typeof t>[0])}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={t("actionsFor", { code: r.code })}
                        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ml-auto"
                      >
                        <MoreHorizontal className="size-4" aria-hidden="true" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            {t("changeStatus")}
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(r.code, "open")}
                            >
                              {t("status.open")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(r.code, "solved")
                              }
                            >
                              {t("status.solved")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(r.code, "dismissed")
                              }
                            >
                              {t("status.dismissed")}
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              setSelectedCodes(new Set());
            }}
            disabled={page === 1}
          >
            <ChevronLeft className="size-4" />
            {t("previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("page", { page, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPage((p) => Math.min(totalPages, p + 1));
              setSelectedCodes(new Set());
            }}
            disabled={page === totalPages}
          >
            {t("next")}
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </main>
  );
}
