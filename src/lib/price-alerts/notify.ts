import { createServiceClient } from "@/lib/supabase/service";
import { emailPriceAlert } from "@/lib/email/send";
import { sendPatternSms } from "@/lib/sms/transactional";

type PriceAlertRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  target_price: number | null;
  alert_type: string;
};

/** Notify pending price/discount alerts when current price is at/below target (or any drop if target null). */
export async function notifyPriceAlertsForProduct(
  productId: string,
  currentPrice: number,
): Promise<{ notified: number }> {
  if (!productId || !Number.isFinite(currentPrice)) return { notified: 0 };
  const service = createServiceClient();

  const { data: product } = await service
    .from("products")
    .select("id, name, slug")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return { notified: 0 };

  const { data: alertsRaw } = await service
    .from("price_alerts" as never)
    .select("id, user_id, email, phone, target_price, alert_type")
    .eq("product_id", productId)
    .eq("status", "pending")
    .limit(500);

  const alerts = (alertsRaw ?? []) as PriceAlertRow[];
  if (!alerts.length) return { notified: 0 };

  const label = product.name;
  const link = product.slug ? `/products/${product.slug}` : "/products";
  let n = 0;

  for (const a of alerts) {
    const target = a.target_price != null ? Number(a.target_price) : null;
    if (target != null && currentPrice > target) continue;

    try {
      if (a.user_id) {
        await service.from("notifications").insert({
          user_id: a.user_id,
          title: a.alert_type === "discount" ? "تخفیف فعال شد" : "کاهش قیمت",
          body: `${label} — قیمت فعلی: ${currentPrice.toLocaleString("fa-IR")} تومان`,
          type: "price_alert",
          link,
        });
      }

      if (a.email) {
        await emailPriceAlert({
          to: a.email,
          productLabel: label,
          link,
          kind: a.alert_type === "discount" ? "discount" : "price_drop",
        });
      }

      if (a.phone) {
        const sms = await sendPatternSms("PRICE_ALERT", a.phone, [
          "مشتری",
          label,
        ]);
        if (!sms.ok) {
          await service.from("sms_outbox").insert({
            phone: a.phone,
            body: `تغییر قیمت/تخفیف: ${label}`,
            status: "queued",
            meta: { product_id: productId, alert_id: a.id },
          } as never);
        }
      }

      await service
        .from("price_alerts" as never)
        .update({
          status: "notified",
          notified_at: new Date().toISOString(),
        } as never)
        .eq("id", a.id)
        .eq("status", "pending");
      n += 1;
    } catch (e) {
      console.error("[notifyPriceAlerts row]", e);
    }
  }

  return { notified: n };
}
