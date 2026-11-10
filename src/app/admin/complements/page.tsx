"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminDeleteComplementRowAction,
  adminGetProductComplementIdsAction,
  adminListComplementsAction,
  adminSaveProductComplementsAction,
  type AdminComplementRow,
} from "@/app/admin/actions/complements";
import { adminListProductsAction } from "@/app/admin/actions/products";
import { LumaSpin } from "@/components/ui/luma-spin";
import { formatJalaliDateTime } from "@/lib/dates/jalali";

const KIND_FA: Record<string, string> = {
  buy_with: "با این بخر",
  set: "ست پیشنهادی",
};

type ProductOpt = { id: string; name: string; slug: string };

export default function AdminComplementsPage() {
  const [items, setItems] = useState<AdminComplementRow[]>([]);
  const [products, setProducts] = useState<ProductOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<"all" | "buy_with" | "set">("all");
  const [productId, setProductId] = useState("");
  const [editKind, setEditKind] = useState<"buy_with" | "set">("buy_with");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [listRes, prodRes] = await Promise.all([
      adminListComplementsAction({ kind: kindFilter }),
      adminListProductsAction(200, { status: "published" }),
    ]);
    setLoading(false);
    if (!listRes.ok) {
      setError(
        listRes.error === "forbidden" ? "دسترسی ادمین ندارید" : "خطا در بارگذاری",
      );
      setItems([]);
    } else {
      setItems(listRes.items ?? []);
    }
    if (prodRes.ok) {
      setProducts(
        (prodRes.items ?? []).map((p: { id: string; name: string; slug: string }) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
        })),
      );
    }
  }, [kindFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!productId) {
      setSelectedIds([]);
      return;
    }
    void (async () => {
      const res = await adminGetProductComplementIdsAction(productId, editKind);
      if (res.ok) setSelectedIds(res.ids);
    })();
  }, [productId, editKind]);

  function toggleComplement(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 12),
    );
  }

  async function save() {
    if (!productId) {
      setError("محصول اصلی را انتخاب کنید");
      return;
    }
    setBusy(true);
    setMsg(null);
    setError(null);
    const res = await adminSaveProductComplementsAction({
      productId,
      kind: editKind,
      complementProductIds: selectedIds,
    });
    setBusy(false);
    if (!res.ok) {
      setError("ذخیره ناموفق");
      return;
    }
    setMsg("مکمل‌ها ذخیره شد");
    void load();
  }

  async function removeRow(id: string) {
    if (!confirm("حذف این لینک مکمل؟")) return;
    setBusy(true);
    const res = await adminDeleteComplementRowAction(id);
    setBusy(false);
    if (!res.ok) {
      setError("حذف ناموفق");
      return;
    }
    void load();
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">مکمل‌ها و ست‌ها</h1>
          <p className="text-muted-foreground text-sm">
            مدیریت «با این بخر» و ست‌های پیشنهادی محصولات
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="border-border rounded-xl border px-4 py-2 text-sm"
        >
          تازه‌سازی
        </button>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}

      <div className="border-border bg-card space-y-4 rounded-2xl border p-4">
        <h2 className="font-semibold">ویرایش مکمل‌های یک محصول</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span>محصول اصلی</span>
            <select
              className="border-input bg-background w-full rounded-xl border px-3 py-2 text-sm"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">انتخاب…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span>نوع لینک</span>
            <select
              className="border-input bg-background w-full rounded-xl border px-3 py-2 text-sm"
              value={editKind}
              onChange={(e) => setEditKind(e.target.value as "buy_with" | "set")}
            >
              <option value="buy_with">با این بخر</option>
              <option value="set">ست پیشنهادی</option>
            </select>
          </label>
        </div>

        {productId ? (
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border p-2 text-sm">
            {products
              .filter((p) => p.id !== productId)
              .map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-2 px-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => toggleComplement(p.id)}
                  />
                  <span>{p.name}</span>
                </label>
              ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">ابتدا محصول اصلی را انتخاب کنید.</p>
        )}

        <button
          type="button"
          disabled={busy || !productId}
          onClick={() => void save()}
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm disabled:opacity-50"
        >
          {busy ? "…" : "ذخیره مکمل‌ها"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-sm">فیلتر لیست:</span>
        {(["all", "buy_with", "set"] as const).map((k) => (
          <button
            key={k}
            type="button"
            className={
              "rounded-lg border px-3 py-1.5 text-sm " +
              (kindFilter === k
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border")
            }
            onClick={() => setKindFilter(k)}
          >
            {k === "all" ? "همه" : KIND_FA[k]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <LumaSpin />
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          هنوز لینک مکملی ثبت نشده.
        </p>
      ) : (
        <div className="table-scroll border-border overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-right font-medium">محصول</th>
                <th className="p-3 text-right font-medium">مکمل</th>
                <th className="p-3 text-right font-medium">نوع</th>
                <th className="p-3 text-right font-medium">زمان</th>
                <th className="p-3 text-right font-medium">اقدام</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    <Link
                      href={`/admin/products/${r.product_id}`}
                      className="text-primary hover:underline"
                    >
                      {r.product_name || r.product_id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/products/${r.complement_product_id}`}
                      className="text-primary hover:underline"
                    >
                      {r.complement_name || r.complement_product_id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="p-3 text-xs">{KIND_FA[r.kind] ?? r.kind}</td>
                  <td className="text-muted-foreground whitespace-nowrap p-3 text-xs">
                    {formatJalaliDateTime(r.created_at)}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      disabled={busy}
                      className="text-destructive text-xs hover:underline"
                      onClick={() => void removeRow(r.id)}
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
