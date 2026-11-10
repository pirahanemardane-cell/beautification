"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminListGiftOrdersAction,
  type AdminGiftOrderRow,
} from "@/app/admin/actions/gift-orders";
import { LumaSpin } from "@/components/ui/luma-spin";
import { formatJalaliDate, formatJalaliDateTime } from "@/lib/dates/jalali";

const STATUS_FA: Record<string, string> = {
  pending: "در انتظار",
  paid: "پرداخت‌شده",
  processing: "در حال آماده‌سازی",
  shipped: "ارسال‌شده",
  delivered: "تحویل‌شده",
  cancelled: "لغو",
};

export default function AdminGiftOrdersPage() {
  const [items, setItems] = useState<AdminGiftOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminListGiftOrdersAction();
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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">سفارش‌های هدیه</h1>
          <p className="text-muted-foreground text-sm">
            بسته‌بندی هدیه، کارت پیام و زمان‌بندی تحویل
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="border-border rounded-xl border px-4 py-2 text-sm"
          >
            تازه‌سازی
          </button>
          <Link href="/admin/orders" className="border-border rounded-xl border px-4 py-2 text-sm">
            همه سفارش‌ها
          </Link>
        </div>
      </div>

      {unsupported ? (
        <p className="text-destructive text-sm">
          فیلدهای هدیه در دیتابیس موجود نیست — migration 066 را اجرا کنید.
        </p>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <LumaSpin />
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          سفارش هدیه‌ای ثبت نشده.
        </p>
      ) : (
        <div className="table-scroll border-border overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-right font-medium">سفارش</th>
                <th className="p-3 text-right font-medium">گیرنده</th>
                <th className="p-3 text-right font-medium">بسته هدیه</th>
                <th className="p-3 text-right font-medium">پیام</th>
                <th className="p-3 text-right font-medium">زمان تحویل</th>
                <th className="p-3 text-right font-medium">وضعیت</th>
                <th className="p-3 text-right font-medium">مبلغ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} className="border-t align-top">
                  <td className="p-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-primary font-mono text-xs hover:underline"
                      dir="ltr"
                    >
                      {o.id.slice(0, 8)}…
                    </Link>
                    <p className="text-muted-foreground text-[11px]">
                      {formatJalaliDateTime(o.created_at)}
                    </p>
                  </td>
                  <td className="p-3 text-xs">
                    {o.shipping_name || "—"}
                    <br />
                    <span className="font-mono" dir="ltr">
                      {o.shipping_phone || ""}
                    </span>
                  </td>
                  <td className="p-3 text-xs">{o.gift_packaging ? "بله" : "خیر"}</td>
                  <td className="max-w-[14rem] p-3 text-xs whitespace-pre-wrap">
                    {o.gift_message?.trim() || "—"}
                  </td>
                  <td className="p-3 text-xs">
                    {o.scheduled_delivery_date
                      ? formatJalaliDate(o.scheduled_delivery_date)
                      : "—"}
                  </td>
                  <td className="p-3 text-xs">{STATUS_FA[o.status] ?? o.status}</td>
                  <td className="p-3 tabular-nums text-xs">
                    {Number(o.total_amount || 0).toLocaleString("fa-IR")}
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
