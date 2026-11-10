"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { assertNoLinkOrImage } from "@/lib/sanitize-user-text";
import { processProductImageSizes } from "@/lib/process-product-image";
import { r2PutObject } from "@/lib/r2";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function listProductReviewsAction(productId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select(
        "id, rating, title, body, admin_reply, is_verified, created_at, user:profiles(full_name)",
      )
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;

    const ids = (data ?? []).map((r) => r.id);
    let imagesByReview = new Map<string, { url: string; alt_text: string | null }[]>();
    if (ids.length) {
      const { data: imgs } = await supabase
        .from("review_images" as never)
        .select("review_id, url, alt_text, sort_order")
        .in("review_id", ids)
        .order("sort_order", { ascending: true });
      for (const img of (imgs ?? []) as Array<{
        review_id: string;
        url: string;
        alt_text: string | null;
      }>) {
        const list = imagesByReview.get(img.review_id) ?? [];
        list.push({ url: img.url, alt_text: img.alt_text });
        imagesByReview.set(img.review_id, list);
      }
    }

    const items = (data ?? []).map((r) => ({
      ...r,
      images: imagesByReview.get(r.id) ?? [],
    }));
    return { ok: true as const, items };
  } catch (e) {
    console.error("[listProductReviews]", e);
    return { ok: false as const, items: [] };
  }
}

export async function createProductReviewAction(input: {
  productId: string;
  rating: number;
  title?: string;
  body: string;
  imageUrls?: string[];
}) {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };

    const rating = Number(input.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return { ok: false as const, error: "rating_invalid" };
    }

    const bodyOk = assertNoLinkOrImage(input.body, "متن نظر");
    if (!bodyOk.ok) return { ok: false as const, error: bodyOk.error };
    if (!bodyOk.text || bodyOk.text.length < 3) {
      return { ok: false as const, error: "body_short" };
    }

    let title: string | null = null;
    if (input.title?.trim()) {
      const tOk = assertNoLinkOrImage(input.title, "عنوان نظر");
      if (!tOk.ok) return { ok: false as const, error: tOk.error };
      title = tOk.text || null;
    }

    const supabase = await createClient();

    const { data: orders } = await supabase
      .from("orders")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["paid", "processing", "shipped", "delivered"]);
    const orderIds = (orders ?? []).map((o: { id: string }) => o.id);
    if (!orderIds.length) {
      return { ok: false as const, error: "not_purchased" };
    }
    const { data: items } = await supabase
      .from("order_items")
      .select("id")
      .eq("product_id", input.productId)
      .in("order_id", orderIds)
      .limit(1);
    if (!items?.length) {
      return { ok: false as const, error: "not_purchased" };
    }

    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        product_id: input.productId,
        user_id: user.id,
        rating,
        title,
        body: bodyOk.text,
        is_approved: false,
        is_verified: true,
      })
      .select("id")
      .single();

    if (error) {
      if (
        String(error.message || "").includes("duplicate") ||
        error.code === "23505"
      ) {
        return { ok: false as const, error: "already_reviewed" };
      }
      throw error;
    }

    const urls = (input.imageUrls ?? [])
      .map((u) => String(u || "").trim())
      .filter((u) => /^https?:\/\//i.test(u))
      .slice(0, 4);

    if (urls.length && review?.id) {
      const service = createServiceClient();
      await (service.from("review_images" as never) as ReturnType<
        typeof service.from
      >).insert(
        urls.map((url, i) => ({
          review_id: review.id,
          url,
          sort_order: i,
        })) as never,
      );
    }

    return { ok: true as const };
  } catch (e) {
    console.error("[createProductReview]", e);
    return { ok: false as const, error: "server" };
  }
}

/** Upload review photo to R2 (purchaser session). Returns public URL. */
export async function uploadReviewImageAction(formData: FormData) {
  try {
    const user = await requireUser();
    if (!user) return { ok: false as const, error: "login_required" };

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false as const, error: "no_file" };
    }
    if (file.size > 8 * 1024 * 1024) {
      return { ok: false as const, error: "too_large" };
    }
    const mime = (file.type || "").toLowerCase();
    if (!mime.startsWith("image/")) {
      return { ok: false as const, error: "not_image" };
    }

    const input = Buffer.from(await file.arrayBuffer());
    const buffers = await processProductImageSizes(input);
    const id = randomUUID();
    const key = `reviews/${user.id}/${id}.webp`;
    const url = await r2PutObject({
      key,
      body: buffers.medium || buffers.large,
      contentType: "image/webp",
    });
    return { ok: true as const, url };
  } catch (e) {
    console.error("[uploadReviewImage]", e);
    return { ok: false as const, error: "upload_failed" };
  }
}
