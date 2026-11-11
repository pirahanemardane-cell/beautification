"use server";

import { createPublicClient } from "@/lib/supabase/public";

export async function listPublishedPostsAction(limit = 20) {
 try {
 const supabase = createPublicClient();
 const { data, error } = await supabase
 .from("blog_posts")
 .select(
 "id, title, slug, excerpt, cover_url, published_at, category:blog_categories(name, slug)",
 )
 .eq("status", "published")
 .order("published_at", { ascending: false })
 .limit(limit);
 if (error) throw error;
 return { ok: true as const, items: data ?? [] };
 } catch (e) {
 const msg = e instanceof Error ? e.message : String(e);
 // Preview/CI often use placeholder.supabase.co — avoid scary stack dumps
 if (/ENOTFOUND|fetch failed|placeholder\.supabase/i.test(msg)) {
 console.warn("[listPublishedPosts] skipped (supabase unreachable)");
 } else {
 console.error("[listPublishedPosts]", msg);
 }
 return { ok: false as const, items: [] };
 }
}

export async function getPublishedPostBySlugAction(slug: string) {
 try {
 const supabase = createPublicClient();
 const { data, error } = await supabase
 .from("blog_posts")
 .select(
 "id, title, slug, excerpt, body, cover_url, published_at, meta_title, meta_description, og_title, og_description, og_image_url, robots_index, robots_follow, canonical_url, category:blog_categories(name, slug)",
 )
 .eq("slug", slug)
 .eq("status", "published")
 .maybeSingle();
 if (error) throw error;
 if (!data) return { ok: false as const, post: null, error: "not_found" };
 // cast: generated DB types may lag behind real columns (robots_*, og_*)
 return { ok: true as const, post: data as Record<string, unknown> };
 } catch (e) {
 const msg = e instanceof Error ? e.message : String(e);
 if (/ENOTFOUND|fetch failed|placeholder\.supabase/i.test(msg)) {
 console.warn("[getPublishedPost] skipped (supabase unreachable)");
 } else {
 console.error("[getPublishedPost]", msg);
 }
 return { ok: false as const, post: null, error: "server" };
 }
}
