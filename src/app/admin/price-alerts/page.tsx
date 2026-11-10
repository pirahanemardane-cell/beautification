"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminBulkBar } from "@/components/admin/bulk-bar";
import {
  adminArchivePriceAlertsAction,
  adminHardDeletePriceAlertsAction,
  adminListPriceAlertsAction,
  adminSetPriceAlertStatusAction,
  type AdminPriceAlertRow,
} from "@/app/admin/actions/price-alerts";
import { LumaSpin } from "@/components/ui/luma-spin";
import { formatJalaliDateTime } from "@/lib/dates/jalali";

const STATUSES = ["all", "pending", "notified", "cancelled"] as const;
const STATUS_FA: Record<string, string> = {
  all: "همه",
  pending: "در انتظار",
  notified: "اطلاع داده شد",
  cancelled: "لغو",
};
const TYPE_FA: Record<string, string> = {
  price_drop: "کاهش قیمت",
  discount: "تخفیف",
};

export default function AdminPriceAlertsPage() {
  const [items, setItems] = useState<AdminPriceAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  function toggleSelectAll(ids: string[]) {
    setSelected((prev) => (prev.length === ids.length ? [] : ids));
  }
  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminListPriceAlertsAction({ status });
    setLoading(false);
    if (!res.ok) {
      setError(
        res.error === "login_required"
          ? "ورود لازم است"
          : res.error === "forbidden"
            ? "دسترسی ادمین ندارید"
            : "خطا در بارگذاری",
      );
      setItems([]);
      return;
    }
    setItems(res.items ?? []);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runBulkArchive() {
    if (!selected.length) return;
    if (!confirm("آرشیو (لغو) موارد انتخاب‌شده؟")) return;
    setBulkBusy(true);
    const res = await adminArchivePriceAlertsAction(selected);
    setBulkBusy(false);
    if (!res.ok) {
      setError("آرشیو ناموفق");
      return;
    }
    setSelected([]);
    void load();
  }

  async function runBulkHardDelete() {
    if (!selected.length) return;
    if (!confirm("حذف دائمی موارد انتخاب‌شده؟ برگشت‌ناپذیر است.")) return;
    setBulkBusy(true);
    const res = await adminHardDeletePriceAlertsAction(selected);
    setBulkBusy(false);
    if (!res.ok) {
      setError("حذف دائمی ناموفق");
      return;
    }
    setSelected([]);
    void load();
  }

  async function setRowStatus(id: string, next: "pending" | "notified" | "cancelled") {
    setBusyId(id);
    const res = await adminSetPriceAlertStatusAction(id, next);
    setBusyId(null);
    if (!res.ok) {
      setError("تغییر وضعیت ناموفق");
      return;
    }
    void load();
  }

  return (
    <div className="space-y-4 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">هشدار قیمت / تخفیف</h1>
          <p className="text-muted-foreground text-sm">
            اشتراک‌های کاهش قیمت و تخفیف مشتریان
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="border-input bg-background rounded-xl border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_FA[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="border-border rounded-xl border px-4 py-2 text-sm"
          >
            تازه‌سازی
          </button>
          <Link href="/admin/stock-alerts" className="border-border rounded-xl border px-4 py-2 text-sm">
            لیست موجودی
          </Link>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <AdminBulkBar
        total={items.length}
        onSelectAll={() => toggleSelectAll(items.map((x) => x.id))}
        count={selected.length}
        busy={bulkBusy}
        onArchive={() => void runBulkArchive()}
        onHardDelete={() => void runBulkHardDelete()}
        onClear={() => setSelected([])}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <LumaSpin />
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">موردی نیست.</p>
      ) : (
        <div className="table-scroll border-border overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-right font-medium">محصول</th>
                <th className="p-3 text-right font-medium">نوع</th>
                <th className="p-3 text-right font-medium">هدف</th>
                <th className="p-3 text-right font-medium">تماس</th>
                <th className="p-3 text-right font-medium">وضعیت</th>
                <th className="p-3 text-right font-medium">زمان</th>
                <th className="p-3 text-right font-medium">اقدام</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-3 text-xs">
                    <input
                      type="checkbox"
                      className="ml-2 align-middle"
                      checked={selected.includes(r.id)}
                      onChange={() => toggleSelect(r.id)}
                    />
                    <Link
                      href={`/admin/products/${r.product_id}`}
                      className="text-primary hover:underline"
                    >
                      {r.product_name || r.product_id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="p-3 text-xs">{TYPE_FA[r.alert_type] ?? r.alert_type}</td>
                  <td className="p-3 tabular-nums text-xs">
                    {r.target_price != null
                      ? `${Number(r.target_price).toLocaleString("fa-IR")} تومان`
                      : "—"}
                  </td>
                  <td className="p-3 font-mono text-xs" dir="ltr">
                    {r.email || r.phone || (r.user_id ? "user" : "—")}
                  </td>
                  <td className="p-3 text-xs">{STATUS_FA[r.status] ?? r.status}</td>
                  <td className="text-muted-foreground whitespace-nowrap p-3 text-xs">
                    {formatJalaliDateTime(r.created_at)}
                  </td>
                  <td className="p-3">
                    {r.status === "pending" ? (
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          className="border-border rounded-lg border px-2 py-1 text-xs"
                          onClick={() => void setRowStatus(r.id, "notified")}
                        >
                          اطلاع شد
                        </button>
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          className="border-border rounded-lg border px-2 py-1 text-xs"
                          onClick={() => void setRowStatus(r.id, "cancelled")}
                        >
                          لغو
                        </button>
                      </div>
                    ) : null}
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
