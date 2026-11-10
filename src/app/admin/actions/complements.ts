"use server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { createServiceClient } from "@/lib/supabase/service";
import { adminSetProductComplementsAction } from "@/app/admin/actions/products";

export type AdminComplementRow = {
  id: string;
  product_id: string;
  complement_product_id: string;
  kind: "buy_with" | "set";
  sort_order: number;
  created_at: string;
  product_name?: string | null;
  complement_name?: string | null;
  product_slug?: string | null;
  complement_slug?: string | null;
};

export async function adminListComplementsAction(opts?: {
  kind?: "all" | "buy_with" | "set";
  productId?: string;
  limit?: number;
}) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return { ok: false as const, error: gate.error, items: [] as AdminComplementRow[] };
  }
  try {
    const service = createServiceClient();
    const limit = Math.min(300, Math.max(1, opts?.limit ?? 150));
    let q = service
      .from("product_complements" as never)
      .select("id, product_id, complement_product_id, kind, sort_order, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (opts?.kind && opts.kind !== "all") q = q.eq("kind", opts.kind);
    if (opts?.productId?.trim()) q = q.eq("product_id", opts.productId.trim());
    const { data, error } = await q;
    if (error) throw error;

    const rows = (data ?? []) as AdminComplementRow[];
    const ids = [
      ...new Set(
        rows.flatMap((r) => [r.product_id, r.complement_product_id]).filter(Boolean),
      ),
    ];
    if (!ids.length) return { ok: true as const, items: rows };

    const { data: products } = await service
      .from("products")
      .select("id, name, slug")
      .in("id", ids);
    const map = new Map(
      (products ?? []).map((p) => [
        p.id as string,
        {
          name: (p as { name?: string }).name ?? null,
          slug: (p as { slug?: string }).slug ?? null,
        },
      ]),
    );

    return {
      ok: true as const,
      items: rows.map((r) => ({
        ...r,
        product_name: map.get(r.product_id)?.name ?? null,
        product_slug: map.get(r.product_id)?.slug ?? null,
        complement_name: map.get(r.complement_product_id)?.name ?? null,
        complement_slug: map.get(r.complement_product_id)?.slug ?? null,
      })),
    };
  } catch (e) {
    console.error("[adminListComplements]", e);
    return { ok: false as const, error: "server" as const, items: [] as AdminComplementRow[] };
  }
}

export async function adminGetProductComplementIdsAction(
  productId: string,
  kind: "buy_with" | "set",
) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error, ids: [] as string[] };
  const pid = (productId || "").trim();
  if (!pid) return { ok: false as const, error: "invalid" as const, ids: [] as string[] };
  try {
    const { data, error } = await gate.supabase
      .from("product_complements" as never)
      .select("complement_product_id, sort_order")
      .eq("product_id", pid)
      .eq("kind", kind)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    const ids = ((data ?? []) as { complement_product_id: string }[]).map(
      (r) => r.complement_product_id,
    );
    return { ok: true as const, ids };
  } catch (e) {
    console.error("[adminGetProductComplementIds]", e);
    return { ok: false as const, error: "server" as const, ids: [] as string[] };
  }
}

export async function adminSaveProductComplementsAction(input: {
  productId: string;
  kind: "buy_with" | "set";
  complementProductIds: string[];
}) {
  return adminSetProductComplementsAction(input);
}

export async function adminDeleteComplementRowAction(id: string) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  if (!id?.trim()) return { ok: false as const, error: "invalid" as const };
  try {
    const { error } = await gate.supabase
      .from("product_complements" as never)
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[adminDeleteComplementRow]", e);
    return { ok: false as const, error: "server" as const };
  }
}
