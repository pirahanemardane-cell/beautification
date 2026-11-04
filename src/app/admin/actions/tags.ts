"use server";

import { requireAdmin } from "@/lib/admin/require-admin";

function slugify(input: string): string {
 return (
 input
 .trim()
 .toLowerCase()
 .replace(/\s+/g, "-")
 .replace(/[^\u0600-\u06FFa-z0-9\-]+/gi, "")
 .replace(/\-+/g, "-")
 .replace(/^\-|\-$/g, "") || `tag-${Date.now()}`
 );
}

/* ── product tags ── */
/* Live product_tags columns: id, name, slug, is_active, created_at only */

export async function adminListProductTagsAction() {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
 try {
 const { data, error } = await gate.supabase
 .from("product_tags")
 .select("id, name, slug, is_active, created_at")
 .order("name");
 if (error) throw error;
 return { ok: true as const, items: data ?? [] };
 } catch (e) {
 console.error("[adminListProductTags]", e);
 return { ok: false as const, error: "server", items: [] };
 }
}

export async function adminCreateProductTagAction(input: {
 name: string;
 slug?: string;
 image_url?: string | null;
 short_description?: string | null;
 description?: string | null;
 is_active?: boolean;
 meta_title?: string | null;
 meta_description?: string | null;
 focus_keyphrases?: string[];
 robots_index?: boolean;
 robots_follow?: boolean;
}) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };
 const name = (input.name || "").trim();
 if (!name) return { ok: false as const, error: "name_required" };
 const slug = (input.slug || "").trim() || slugify(name);
 try {
 // Live-safe columns only — ignore image/desc/SEO from wizard until migration
 const { data, error } = await gate.supabase
 .from("product_tags")
 .insert({
 name,
 slug,
 is_active: input.is_active !== false,
 })
 .select("id")
 .single();
 if (error) throw error;
 return { ok: true as const, id: data.id };
 } catch (e) {
 console.error("[adminCreateProductTag]", e);
 return { ok: false as const, error: "server" };
 }
}

export async function adminToggleProductTagAction(id: string, is_active: boolean) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };
 try {
 const { error } = await gate.supabase
 .from("product_tags")
 .update({ is_active })
 .eq("id", id);
 if (error) throw error;
 return { ok: true as const };
 } catch {
 return { ok: false as const, error: "server" };
 }
}


export async function adminUpdateProductTagAction(
 id: string,
 patch: {
 name?: string;
 slug?: string;
 is_active?: boolean;
 image_url?: string | null;
 short_description?: string | null;
 description?: string | null;
 meta_title?: string | null;
 meta_description?: string | null;
 focus_keyphrases?: string[];
 robots_index?: boolean;
 robots_follow?: boolean;
 },
) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };
 try {
 const body: Record<string, unknown> = {};
 if (patch.name !== undefined) {
 const name = patch.name.trim();
 if (!name) return { ok: false as const, error: "name_required" };
 body.name = name;
 }
 if (patch.slug !== undefined) {
 const slug = patch.slug.trim();
 if (slug) body.slug = slug;
 }
 if (patch.is_active !== undefined) body.is_active = patch.is_active;
 // image/desc/SEO missing live — intentionally ignored
 if (!Object.keys(body).length) return { ok: true as const };
 const { error } = await gate.supabase.from("product_tags").update(body).eq("id", id);
 if (error) throw error;
 return { ok: true as const };
 } catch (e) {
 console.error("[adminUpdateProductTag]", e);
 return { ok: false as const, error: "server" };
 }
}

export async function adminDeleteProductTagAction(id: string) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };
 try {
 await gate.supabase.from("product_tag_map").delete().eq("tag_id", id);
 const { error } = await gate.supabase.from("product_tags").delete().eq("id", id);
 if (error) throw error;
 return { ok: true as const };
 } catch (e) {
 console.error("[adminDeleteProductTag]", e);
 return { ok: false as const, error: "server" };
 }
}

/* ── blog tags ── */

export async function adminListBlogTagsAction() {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
 try {
 const { data, error } = await gate.supabase
 .from("blog_tags")
 .select("id, name, slug, is_active, created_at")
 .order("name");
 if (error) throw error;
 return { ok: true as const, items: data ?? [] };
 } catch (e) {
 console.error("[adminListBlogTags]", e);
 return { ok: false as const, error: "server", items: [] };
 }
}

export async function adminCreateBlogTagAction(input: {
 name: string;
 slug?: string;
}) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };
 const name = (input.name || "").trim();
 if (!name) return { ok: false as const, error: "name_required" };
 const slug = (input.slug || "").trim() || slugify(name);
 try {
 const { data, error } = await gate.supabase
 .from("blog_tags")
 .insert({ name, slug })
 .select("id")
 .single();
 if (error) throw error;
 return { ok: true as const, id: data.id };
 } catch (e) {
 console.error("[adminCreateBlogTag]", e);
 return { ok: false as const, error: "server" };
 }
}

export async function adminToggleBlogTagAction(id: string, is_active: boolean) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };
 try {
 const { error } = await gate.supabase
 .from("blog_tags")
 .update({ is_active })
 .eq("id", id);
 if (error) throw error;
 return { ok: true as const };
 } catch {
 return { ok: false as const, error: "server" };
 }
}


export async function adminGetProductTagAction(id: string) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };
 try {
 const { data, error } = await gate.supabase
 .from("product_tags")
 .select("id, name, slug, is_active, created_at")
 .eq("id", id)
 .maybeSingle();
 if (error) throw error;
 if (!data) return { ok: false as const, error: "not_found" as const };
 return { ok: true as const, item: data };
 } catch (e) {
 console.error("[adminGetProductTag]", e);
 return { ok: false as const, error: "server" as const };
 }
}
