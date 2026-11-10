"use server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { createServiceClient } from "@/lib/supabase/service";

export type AdminPriceAlertRow = {
  id: string;
  user_id: string | null;
  product_id: string;
  variant_id: string | null;
  email: string | null;
  phone: string | null;
  target_price: number | null;
  alert_type: string;
  status: string;
  created_at: string;
  notified_at: string | null;
  product_name?: string | null;
};

export async function adminListPriceAlertsAction(opts?: {
  status?: "all" | "pending" | "notified" | "cancelled";
  limit?: number;
}) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return { ok: false as const, error: gate.error, items: [] as AdminPriceAlertRow[] };
  }
  try {
    const service = createServiceClient();
    const limit = Math.min(200, Math.max(1, opts?.limit ?? 100));
    let q = service
      .from("price_alerts" as never)
      .select(
        "id, user_id, product_id, variant_id, email, phone, target_price, alert_type, status, created_at, notified_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    const st = opts?.status;
    if (st && st !== "all") q = q.eq("status", st);
    const { data, error } = await q;
    if (error) throw error;

    const rows = (data ?? []) as AdminPriceAlertRow[];
    const productIds = [...new Set(rows.map((r) => r.product_id).filter(Boolean))];
    if (!productIds.length) return { ok: true as const, items: rows };

    const { data: products } = await service
      .from("products")
      .select("id, name")
      .in("id", productIds);
    const nameMap = new Map(
      (products ?? []).map((p) => [p.id as string, (p as { name?: string }).name ?? null]),
    );

    return {
      ok: true as const,
      items: rows.map((r) => ({
        ...r,
        product_name: nameMap.get(r.product_id) ?? null,
      })),
    };
  } catch (e) {
    console.error("[adminListPriceAlerts]", e);
    return { ok: false as const, error: "server" as const, items: [] as AdminPriceAlertRow[] };
  }
}

export async function adminSetPriceAlertStatusAction(
  id: string,
  status: "pending" | "notified" | "cancelled",
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  if (!id?.trim()) return { ok: false as const, error: "id_required" };
  try {
    const service = createServiceClient();
    const patch: Record<string, unknown> = { status };
    if (status === "notified") patch.notified_at = new Date().toISOString();
    const { error } = await service
      .from("price_alerts" as never)
      .update(patch as never)
      .eq("id", id);
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[adminSetPriceAlertStatus]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function adminArchivePriceAlertsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = [...new Set((ids || []).map((x) => String(x).trim()).filter(Boolean))];
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("price_alerts" as never)
      .update({ status: "cancelled" } as never)
      .in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminArchivePriceAlerts]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function adminHardDeletePriceAlertsAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = [...new Set((ids || []).map((x) => String(x).trim()).filter(Boolean))];
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("price_alerts" as never)
      .delete()
      .in("id", list);
    if (error) throw error;
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminHardDeletePriceAlerts]", e);
    return { ok: false as const, error: "server" as const };
  }
}
