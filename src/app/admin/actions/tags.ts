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

export async function adminListProductTagsAction() {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
 try {
 const full =
 "id, name, slug, is_active, created_at, image_url, short_description, description, meta_title, meta_description";
 const basic = "id, name, slug, is_active, created_at";
 const primary = await gate.supabase.from("product_tags").select(full).order("name");
 if (
 primary.error &&
 (String(primary.error.message || "").includes("42703") ||
 String(primary.error.message || "").includes("does not exist"))
 ) {
 const fallback = await gate.supabase.from("product_tags").select(basic).order("name");
 if (fallback.error) throw fallback.error;
 return { ok: true as const, items: fallback.data ?? [] };
 }
 if (primary.error) throw primary.error;
 return { ok: true as const, items: primary.data ?? [] };
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
 const full = {
 name,
 slug,
 is_active: input.is_active !== false,
 image_url: (input.image_url || "").trim() || null,
 short_description: (input.short_description || "").trim() || null,
 description: (input.description || "").trim() || null,
 meta_title: (input.meta_title || "").trim() || null,
 meta_description: (input.meta_description || "").trim() || null,
 focus_keyphrases: input.focus_keyphrases ?? [],
 robots_index: input.robots_index !== false,
 robots_follow: input.robots_follow !== false,
 };
 const ins = await gate.supabase
 .from("product_tags")
 .insert(full as never)
 .select("id")
 .single();
 if (
 ins.error &&
 (String(ins.error.message || "").includes("42703") ||
 String(ins.error.message || "").includes("does not exist"))
 ) {
 const { data, error } = await gate.supabase
 .from("product_tags")
 .insert({ name, slug, is_active: input.is_active !== false })
 .select("id")
 .single();
 if (error) throw error;
 return { ok: true as const, id: data.id };
 }
 if (ins.error) throw ins.error;
 return { ok: true as const, id: ins.data!.id };
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
 if (patch.image_url !== undefined) body.image_url = (patch.image_url || "").trim() || null;
 if (patch.short_description !== undefined)
 body.short_description = (patch.short_description || "").trim() || null;
 if (patch.description !== undefined)
 body.description = (patch.description || "").trim() || null;
 if (patch.meta_title !== undefined)
 body.meta_title = (patch.meta_title || "").trim() || null;
 if (patch.meta_description !== undefined)
 body.meta_description = (patch.meta_description || "").trim() || null;
 if (patch.focus_keyphrases !== undefined)
 body.focus_keyphrases = patch.focus_keyphrases ?? [];
 if (patch.robots_index !== undefined) body.robots_index = !!patch.robots_index;
 if (patch.robots_follow !== undefined) body.robots_follow = !!patch.robots_follow;
 if (!Object.keys(body).length) return { ok: true as const };
 const { error } = await gate.supabase
 .from("product_tags")
 .update(body as never)
 .eq("id", id);
 if (
 error &&
 (String(error.message || "").includes("42703") ||
 String(error.message || "").includes("does not exist"))
 ) {
 const basic: Record<string, unknown> = {};
 for (const k of ["name", "slug", "is_active"] as const) {
 if (body[k] !== undefined) basic[k] = body[k];
 }
 if (!Object.keys(basic).length) return { ok: true as const };
 const retry = await gate.supabase
 .from("product_tags")
 .update(basic as never)
 .eq("id", id);
 if (retry.error) throw retry.error;
 return { ok: true as const };
 }
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
