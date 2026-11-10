"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type MyStockAlertRow = {
  id: string;
  product_id: string | null;
  variant_id: string;
  status: string;
  created_at: string;
  phone: string | null;
  email: string | null;
  product_name?: string | null;
  product_slug?: string | null;
  size?: string | null;
  color_name?: string | null;
};

export type MyPriceAlertRow = {
  id: string;
  product_id: string;
  variant_id: string | null;
  alert_type: string;
  status: string;
  target_price: number | null;
  created_at: string;
  email: string | null;
  phone: string | null;
  product_name?: string | null;
  product_slug?: string | null;
};

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function listMyStockAlertsAction() {
  try {
    const userId = await requireUserId();
    if (!userId) return { ok: false as const, error: "login_required" as const, items: [] as MyStockAlertRow[] };

    const service = createServiceClient();
    const { data, error } = await service
      .from("stock_alerts")
      .select("id, product_id, variant_id, status, created_at, phone, email")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    const rows = (data ?? []) as MyStockAlertRow[];
    const variantIds = [...new Set(rows.map((r) => r.variant_id).filter(Boolean))];
    const productIds = [...new Set(rows.map((r) => r.product_id).filter(Boolean))] as string[];

    const [{ data: variants }, { data: products }] = await Promise.all([
      variantIds.length
        ? service
            .from("product_variants")
            .select("id, size, color_name, product_id")
            .in("id", variantIds)
        : Promise.resolve({ data: [] as unknown[] }),
      productIds.length
        ? service.from("products").select("id, name, slug").in("id", productIds)
        : Promise.resolve({ data: [] as unknown[] }),
    ]);

    const vMap = new Map(
      ((variants ?? []) as { id: string; size?: string; color_name?: string; product_id?: string }[]).map(
        (v) => [v.id, v],
      ),
    );
    const pMap = new Map(
      ((products ?? []) as { id: string; name?: string; slug?: string }[]).map((p) => [p.id, p]),
    );

    // hydrate product ids from variants when missing
    const missingPids = [
      ...new Set(
        rows
          .filter((r) => !r.product_id)
          .map((r) => vMap.get(r.variant_id)?.product_id)
          .filter(Boolean) as string[],
      ),
    ];
    if (missingPids.length) {
      const { data: more } = await service
        .from("products")
        .select("id, name, slug")
        .in("id", missingPids);
      for (const p of more ?? []) {
        pMap.set(p.id as string, p as { id: string; name?: string; slug?: string });
      }
    }

    const items = rows.map((r) => {
      const v = vMap.get(r.variant_id);
      const pid = r.product_id || v?.product_id || null;
      const p = pid ? pMap.get(pid) : null;
      return {
        ...r,
        product_id: pid,
        product_name: p?.name ?? null,
        product_slug: p?.slug ?? null,
        size: v?.size ?? null,
        color_name: v?.color_name ?? null,
      };
    });

    return { ok: true as const, items };
  } catch (e) {
    console.error("[listMyStockAlerts]", e);
    return { ok: false as const, error: "server" as const, items: [] as MyStockAlertRow[] };
  }
}

export async function listMyPriceAlertsAction() {
  try {
    const userId = await requireUserId();
    if (!userId) return { ok: false as const, error: "login_required" as const, items: [] as MyPriceAlertRow[] };

    const service = createServiceClient();
    const { data, error } = await service
      .from("price_alerts" as never)
      .select(
        "id, product_id, variant_id, alert_type, status, target_price, created_at, email, phone",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      if (
        String(error.message || "").includes("price_alerts") ||
        String(error.message || "").includes("does not exist")
      ) {
        return { ok: true as const, items: [] as MyPriceAlertRow[], unsupported: true as const };
      }
      throw error;
    }

    const rows = (data ?? []) as MyPriceAlertRow[];
    const productIds = [...new Set(rows.map((r) => r.product_id).filter(Boolean))];
    if (!productIds.length) return { ok: true as const, items: rows };

    const { data: products } = await service
      .from("products")
      .select("id, name, slug")
      .in("id", productIds);
    const pMap = new Map(
      ((products ?? []) as { id: string; name?: string; slug?: string }[]).map((p) => [p.id, p]),
    );

    return {
      ok: true as const,
      items: rows.map((r) => ({
        ...r,
        product_name: pMap.get(r.product_id)?.name ?? null,
        product_slug: pMap.get(r.product_id)?.slug ?? null,
      })),
    };
  } catch (e) {
    console.error("[listMyPriceAlerts]", e);
    return { ok: false as const, error: "server" as const, items: [] as MyPriceAlertRow[] };
  }
}

export async function cancelMyStockAlertAction(id: string) {
  try {
    const userId = await requireUserId();
    if (!userId) return { ok: false as const, error: "login_required" as const };
    if (!id?.trim()) return { ok: false as const, error: "invalid" as const };
    const service = createServiceClient();
    const { error } = await service
      .from("stock_alerts")
      .update({ status: "cancelled" } as never)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[cancelMyStockAlert]", e);
    return { ok: false as const, error: "server" as const };
  }
}

export async function cancelMyPriceAlertAction(id: string) {
  try {
    const userId = await requireUserId();
    if (!userId) return { ok: false as const, error: "login_required" as const };
    if (!id?.trim()) return { ok: false as const, error: "invalid" as const };
    const service = createServiceClient();
    const { error } = await service
      .from("price_alerts" as never)
      .update({ status: "cancelled" } as never)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[cancelMyPriceAlert]", e);
    return { ok: false as const, error: "server" as const };
  }
}
