"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createServiceClient } from "@/lib/supabase/service";

export type AdminReviewImageRow = {
  id: string;
  review_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
  review_approved?: boolean | null;
  review_title?: string | null;
  review_body?: string | null;
  rating?: number | null;
  product_id?: string | null;
  product_name?: string | null;
  user_name?: string | null;
};

export async function adminListReviewImagesAction(opts?: {
  approved?: "all" | "pending" | "approved";
  limit?: number;
}) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return { ok: false as const, error: gate.error, items: [] as AdminReviewImageRow[] };
  }
  try {
    const service = createServiceClient();
    const limit = Math.min(200, Math.max(1, opts?.limit ?? 100));
    const { data, error } = await service
      .from("review_images" as never)
      .select("id, review_id, url, alt_text, sort_order, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    const rows = (data ?? []) as AdminReviewImageRow[];
    const reviewIds = [...new Set(rows.map((r) => r.review_id).filter(Boolean))];
    if (!reviewIds.length) return { ok: true as const, items: rows };

    const { data: reviews } = await service
      .from("reviews")
      .select(
        "id, title, body, rating, is_approved, product_id, user_id, product:products(name), user:profiles(full_name)",
      )
      .in("id", reviewIds);

    const reviewMap = new Map<
      string,
      {
        is_approved?: boolean;
        title?: string | null;
        body?: string | null;
        rating?: number | null;
        product_id?: string | null;
        product_name?: string | null;
        user_name?: string | null;
      }
    >();
    for (const rev of reviews ?? []) {
      const r = rev as {
        id: string;
        title?: string | null;
        body?: string | null;
        rating?: number | null;
        is_approved?: boolean;
        product_id?: string | null;
        product?: { name?: string } | null;
        user?: { full_name?: string } | null;
      };
      reviewMap.set(r.id, {
        is_approved: r.is_approved,
        title: r.title ?? null,
        body: r.body ?? null,
        rating: r.rating ?? null,
        product_id: r.product_id ?? null,
        product_name: r.product?.name ?? null,
        user_name: r.user?.full_name ?? null,
      });
    }

    let items = rows.map((img) => {
      const rev = reviewMap.get(img.review_id);
      return {
        ...img,
        review_approved: rev?.is_approved ?? null,
        review_title: rev?.title ?? null,
        review_body: rev?.body ?? null,
        rating: rev?.rating ?? null,
        product_id: rev?.product_id ?? null,
        product_name: rev?.product_name ?? null,
        user_name: rev?.user_name ?? null,
      };
    });

    const filter = opts?.approved ?? "all";
    if (filter === "pending") {
      items = items.filter((x) => x.review_approved === false);
    } else if (filter === "approved") {
      items = items.filter((x) => x.review_approved === true);
    }

    return { ok: true as const, items };
  } catch (e) {
    console.error("[adminListReviewImages]", e);
    return { ok: false as const, error: "server" as const, items: [] as AdminReviewImageRow[] };
  }
}

export async function adminDeleteReviewImagesAction(ids: string[]) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  const list = [...new Set((ids || []).map((x) => String(x).trim()).filter(Boolean))];
  if (!list.length) return { ok: false as const, error: "empty" as const };
  try {
    const { error } = await gate.supabase
      .from("review_images" as never)
      .delete()
      .in("id", list);
    if (error) throw error;
    revalidatePath("/admin/review-images");
    revalidatePath("/admin/reviews");
    return { ok: true as const, count: list.length };
  } catch (e) {
    console.error("[adminDeleteReviewImages]", e);
    return { ok: false as const, error: "server" as const };
  }
}
