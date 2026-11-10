"use server";

import { createClient } from "@/lib/supabase/server";
import { getProductSpecRows } from "@/lib/product-specs";

export async function getCompareMatrixAction(productIds: string[]) {
  try {
    const ids = [...new Set(productIds.map((id) => String(id || "").trim()).filter(Boolean))].slice(
      0,
      4,
    );
    if (!ids.length) return { ok: true as const, rows: [] };

    const supabase = await createClient();
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, slug, is_hypoallergenic")
      .in("id", ids)
      .eq("status", "published")
      .is("deleted_at", null);

    let list = products;
    if (
      error &&
      (String(error.message || "").includes("is_hypoallergenic") ||
        String(error.message || "").includes("42703"))
    ) {
      const fallback = await supabase
        .from("products")
        .select("id, name, slug")
        .in("id", ids)
        .eq("status", "published")
        .is("deleted_at", null);
      list = (fallback.data ?? []).map((p) => ({
        ...p,
        is_hypoallergenic: false,
      }));
    } else if (error) {
      throw error;
    }

    const [{ data: images }, { data: variants }] = await Promise.all([
      supabase
        .from("product_images")
        .select("product_id, url, is_primary")
        .in("product_id", ids),
      supabase
        .from("product_variants")
        .select("product_id, price, stock_quantity, is_active")
        .in("product_id", ids),
    ]);

    const imgMap = new Map<string, string>();
    for (const img of images ?? []) {
      if (img.is_primary && !imgMap.has(img.product_id)) {
        imgMap.set(img.product_id, img.url);
      }
    }
    for (const img of images ?? []) {
      if (!imgMap.has(img.product_id)) imgMap.set(img.product_id, img.url);
    }

    const priceMap = new Map<string, number>();
    const stockMap = new Map<string, boolean>();
    for (const v of variants ?? []) {
      if (v.is_active === false) continue;
      const pid = v.product_id as string;
      const price = Number(v.price);
      if (!priceMap.has(pid) && Number.isFinite(price)) priceMap.set(pid, price);
      if (Number(v.stock_quantity ?? 0) > 0) stockMap.set(pid, true);
    }

    const order = new Map(ids.map((id, i) => [id, i]));
    const sorted = [...(list ?? [])].sort(
      (a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99),
    );

    const rows = await Promise.all(
      sorted.map(async (p) => {
        const specs = await getProductSpecRows(p.id);
        return {
          productId: p.id,
          title: p.name,
          href: `/محصولات/${p.slug}`,
          image: imgMap.get(p.id) ?? null,
          price: priceMap.get(p.id) ?? null,
          inStock: stockMap.get(p.id) === true,
          isHypoallergenic: Boolean(
            (p as { is_hypoallergenic?: boolean }).is_hypoallergenic,
          ),
          specs,
        };
      }),
    );

    return { ok: true as const, rows };
  } catch (e) {
    console.error("[getCompareMatrix]", e);
    return { ok: false as const, rows: [] };
  }
}
