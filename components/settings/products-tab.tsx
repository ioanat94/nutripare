"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Eye, GitCompareArrows, Loader2, SaveOff, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteProduct, getSavedProducts } from "@/lib/firestore";
import { useEffect, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import type { SavedProduct } from "@/types/firestore";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function ProductsTab({ userId }: { userId: string }) {
  const t = useTranslations("ProductsTab");
  const [products, setProducts] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    getSavedProducts(userId)
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error(t("toast.loadFailed"));
        setLoading(false);
      });
  }, [userId, t]);

  function toggleSelected(ean: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(ean);
      } else {
        next.delete(ean);
      }
      return next;
    });
  }

  async function handleUnsave(ean: string) {
    try {
      await deleteProduct(userId, ean);
      setProducts((prev) => prev.filter((p) => p.ean !== ean));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(ean);
        return next;
      });
      toast.success(t("toast.unsaved"));
    } catch {
      toast.error(t("toast.unsaveFailed"));
    }
  }

  const compareUrl = `/compare?codes=${[...selected].join(",")}`;

  if (loading) {
    return <Loader2 className="size-5 animate-spin text-muted-foreground" />;
  }

  if (products.length === 0) {
    return <p className="text-muted-foreground">{t("noProducts")}</p>;
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.ean.includes(search),
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>
      {filtered.length === 0 && search ? (
        <p className="text-muted-foreground">{t("noResults")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead className="w-[42%]">{t("name")}</TableHead>
              <TableHead className="w-[42%]">{t("ean")}</TableHead>
              <TableHead className="w-[10%]">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(product.ean)}
                    onCheckedChange={(c) => toggleSelected(product.ean, !!c)}
                    aria-label={t("selectProduct", { name: product.name })}
                  />
                </TableCell>
                <TableCell className="max-w-48 whitespace-normal">
                  {product.name}
                </TableCell>
                <TableCell className="max-w-48 whitespace-normal font-mono">
                  {product.ean}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Link
                      href={`/compare?codes=${product.ean}`}
                      target="_blank"
                      aria-label={t("viewProduct", { name: product.name })}
                      className={
                        buttonVariants({ variant: "ghost", size: "icon" }) +
                        " hover:text-info hover:bg-info/10"
                      }
                    >
                      <Eye className="size-4" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("unsaveProduct", { name: product.name })}
                      className="hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleUnsave(product.ean)}
                    >
                      <SaveOff className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {selected.size >= 2 && (
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm text-muted-foreground">
            {t("selectedCount", { count: selected.size })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              {t("clearSelection")}
            </Button>
            <Link
              href={compareUrl}
              target="_blank"
              className={buttonVariants({ size: "sm" })}
            >
              <GitCompareArrows className="size-4" />
              {t("compareSelected")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
