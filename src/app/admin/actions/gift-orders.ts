"use server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { createServiceClient } from "@/lib/supabase/service";

export type AdminGiftOrderRow = {
  id: string;
  status: string;
  total_amount: number;
  shipping_name: string | null;
  shipping_phone: string | null;
  gift_packaging: boolean;
  gift_message: string | null;
  scheduled_delivery_date: string | null;
  created_at: string;
};

export async function adminListGiftOrdersAction(opts?: { limit?: number }) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return { ok: false as const, error: gate.error, items: [] as AdminGiftOrderRow[] };
  }
  try {
    const service = createServiceClient();
    const limit = Math.min(200, Math.max(1, opts?.limit ?? 100));
    const { data, error } = await service
      .from("orders")
      .select(
        "id, status, total_amount, shipping_name, shipping_phone, gift_packaging, gift_message, scheduled_delivery_date, created_at",
      )
      .or(
        "gift_packaging.eq.true,gift_message.not.is.null,scheduled_delivery_date.not.is.null",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      // Column missing on older DBs before migration 066
      if (
        String(error.message || "").includes("42703") ||
        String(error.message || "").includes("does not exist") ||
        String(error.message || "").includes("column")
      ) {
        return { ok: true as const, items: [] as AdminGiftOrderRow[], unsupported: true as const };
      }
      throw error;
    }

    const items = ((data ?? []) as AdminGiftOrderRow[]).filter(
      (o) =>
        o.gift_packaging ||
        (o.gift_message && String(o.gift_message).trim()) ||
        o.scheduled_delivery_date,
    );
    return { ok: true as const, items };
  } catch (e) {
    console.error("[adminListGiftOrders]", e);
    return { ok: false as const, error: "server" as const, items: [] as AdminGiftOrderRow[] };
  }
}
