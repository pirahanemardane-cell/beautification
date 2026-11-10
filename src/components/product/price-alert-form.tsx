"use client";

import { useState } from "react";
import { subscribePriceAlertAction } from "@/app/(shop)/actions/price-alerts";
import { toast } from "@/lib/toaster";

export function PriceAlertForm({
  productId,
  variantId,
}: {
  productId: string;
  variantId?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <div className="border-border space-y-2 rounded-xl border border-dashed p-3" dir="rtl">
      <p className="text-xs font-medium text-primary">خبر کاهش قیمت / تخفیف</p>
      <p className="text-muted-foreground text-[11px] leading-relaxed">
        با ایمیل خبر می‌دهیم (پیامک فقط اگر الگوی ملی‌پیامک تنظیم شده باشد).
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ایمیل (اگر وارد نیستید)"
        className="border-border bg-background w-full rounded-lg border px-3 py-2 text-sm"
        dir="ltr"
        disabled={done}
      />
      <button
        type="button"
        disabled={busy || done}
        className="bg-muted text-foreground w-full rounded-lg py-2 text-xs font-medium hover:bg-muted/80 disabled:opacity-60"
        onClick={() => {
          void (async () => {
            setBusy(true);
            try {
              const res = await subscribePriceAlertAction({
                productId,
                variantId: variantId || undefined,
                email: email.trim() || undefined,
                alertType: "price_drop",
              });
              if (!res.ok) {
                const map: Record<string, string> = {
                  auth_or_email_required: "وارد شوید یا ایمیل وارد کنید",
                  invalid_email: "ایمیل نامعتبر است",
                };
                toast.error(map[res.error] ?? "ثبت نشد");
                return;
              }
              setDone(true);
              toast.success(
                res.already ? "قبلاً ثبت شده‌اید" : "ثبت شد؛ با ایمیل خبر می‌دهیم",
              );
            } catch {
              toast.error("خطا در ثبت");
            } finally {
              setBusy(false);
            }
          })();
        }}
      >
        {done ? "در لیست خبر هستید" : busy ? "…" : "خبرم کن"}
      </button>
    </div>
  );
}
