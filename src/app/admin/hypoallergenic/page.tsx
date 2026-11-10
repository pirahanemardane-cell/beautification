"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminListHypoallergenicProductsAction,
  adminSetHypoallergenicAction,
  type AdminHypoallergenicRow,
} from "@/app/admin/actions/hypoallergenic";
import { LumaSpin } from "@/components/ui/luma-spin";

export default function AdminHypoallergenicPage() {
  const [items, setItems] = useState<AdminHypoallergenicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState(false);
  const [filter, setFilter] = useState<"all" | "yes" | "no">("all");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminListHypoallergenicProductsAction({ filter, q });
    setLoading(false);
    if (!res.ok) {
      setError(
        res.error === "forbidden" ? "دسترسی ادمین ندارید" : "خطا در بارگذاری",
      );
      setItems([]);
      return;
    }
    setUnsupported(!!(res as { unsupported?: boolean }).unsupported);
    setItems(res.items ?? []);
  }, [filter, q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(id: string, next: boolean) {
    setBusyId(id);
    const res = await adminSetHypoallergenicAction(id, next);
    setBusyId(null);
    if (!res.ok) {
      setError("ذخیره ناموفق");
      return;
    }
    void load();
  }

  return (
    <div className="space-y-4 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">ضد حساسیت</h1>
          <p className="text-muted-foreground text-sm">
            مدیریت نشان ضد حساسیت محصولات
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            className="border-input bg-background rounded-xl border px-3 py-2 text-sm"
            placeholder="جستجو…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="border-input bg-background rounded-xl border px-3 py-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "yes" | "no")}
          >
            <option value="all">همه</option>
            <option value="yes">فقط ضد حساسیت</option>
            <option value="no">بدون نشان</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="border-border rounded-xl border px-4 py-2 text-sm"
          >
            تازه‌سازی
          </button>
        </div>
      </div>

      {unsupported ? (
        <p className="text-destructive text-sm">
          ستون is_hypoallergenic در دیتابیس موجود نیست — migration 066 را اجرا کنید.
        </p>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <LumaSpin />
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">محصولی نیست.</p>
      ) : (
        <div className="table-scroll border-border overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-right font-medium">محصول</th>
                <th className="p-3 text-right font-medium">وضعیت</th>
                <th className="p-3 text-right font-medium">ضد حساسیت</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    <Link
                      href={`/admin/products/${r.id}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {r.name}
                    </Link>
                    <p className="text-muted-foreground font-mono text-[11px]" dir="ltr">
                      {r.slug}
                    </p>
                  </td>
                  <td className="p-3 text-xs">{r.status}</td>
                  <td className="p-3">
                    <label className="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        disabled={busyId === r.id}
                        checked={!!r.is_hypoallergenic}
                        onChange={(e) => void toggle(r.id, e.target.checked)}
                      />
                      {r.is_hypoallergenic ? "فعال" : "غیرفعال"}
                    </label>
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
