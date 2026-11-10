"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeIranMobile } from "@/lib/numbers";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function subscribePriceAlertAction(input: {
  productId: string;
  variantId?: string;
  email?: string;
  phone?: string;
  targetPrice?: number;
  alertType?: "price_drop" | "discount";
}) {
  try {
    const productId = (input.productId || "").trim();
    if (!productId) return { ok: false as const, error: "product_required" };

    const alertType = input.alertType === "discount" ? "discount" : "price_drop";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const emailRaw = (input.email || "").trim().toLowerCase();
    const email = emailRaw && isEmail(emailRaw) ? emailRaw : null;
    const phoneRaw = (input.phone || "").trim();
    const phone = phoneRaw ? normalizeIranMobile(phoneRaw) : null;

    if (!user && !email) {
      return { ok: false as const, error: "auth_or_email_required" };
    }
    if (emailRaw && !email) return { ok: false as const, error: "invalid_email" };
    if (phoneRaw && !phone) return { ok: false as const, error: "invalid_phone" };

    const service = createServiceClient();

    const table = () => service.from("price_alerts" as never);

    if (user) {
      const { data: existing } = await table()
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .eq("alert_type", alertType)
        .eq("status", "pending")
        .maybeSingle();
      if (existing) return { ok: true as const, already: true as const };

      const { error } = await table().insert({
        user_id: user.id,
        product_id: productId,
        variant_id: input.variantId || null,
        email: email || user.email || null,
        phone,
        target_price:
          input.targetPrice != null && Number.isFinite(input.targetPrice)
            ? Number(input.targetPrice)
            : null,
        alert_type: alertType,
        status: "pending",
      } as never);
      if (error) throw error;
      return { ok: true as const };
    }

    const { data: existingEm } = await table()
      .select("id")
      .eq("product_id", productId)
      .eq("email", email!)
      .eq("alert_type", alertType)
      .eq("status", "pending")
      .maybeSingle();
    if (existingEm) return { ok: true as const, already: true as const };

    const { error } = await table().insert({
      user_id: null,
      product_id: productId,
      variant_id: input.variantId || null,
      email: email!,
      phone,
      target_price:
        input.targetPrice != null && Number.isFinite(input.targetPrice)
          ? Number(input.targetPrice)
          : null,
      alert_type: alertType,
      status: "pending",
    } as never);
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[subscribePriceAlert]", e);
    return { ok: false as const, error: "server" };
  }
}
