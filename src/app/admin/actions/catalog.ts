"use server";

import { requireAdmin } from "@/lib/admin/require-admin";

function slugify(input: string): string {
 return input
 .trim()
 .toLowerCase()
 .replace(/\s+/g, "-")
 .replace(/[^\w\u0600-\u06FF-]+/g, "")
 .replace(/-+/g, "-")
 .replace(/^-|-$/g, "");
}

/** اسلاگ یکتا بساز؛ اگر تکراری بود -2، -3، ... */
async function uniqueSlug(
 supabase: { from: (t: string) => any },
 table: "categories" | "brands",
 base: string,
 excludeId?: string | null,
): Promise<string> {
 let candidate = (base || "item").trim() || "item";
 for (let i = 0; i < 50; i++) {
 const trySlug = i === 0 ? candidate : `${candidate}-${i + 1}`;
 let q = supabase.from(table).select("id").eq("slug", trySlug).limit(1);
 if (excludeId) q = q.neq("id", excludeId);
 const { data } = await q.maybeSingle();
 if (!data) return trySlug;
 }
 return `${candidate}-${Date.now()}`;
}

function isUniqueViolation(err: unknown): boolean {
 const e = err as { code?: string; message?: string };
 return (
 String(e?.code) === "23505" ||
 /duplicate key|unique constraint/i.test(String(e?.message || ""))
 );
}

/* ─── Categories ─── */
/* Live: no short_description. meta_title/meta_description OK. image_url OK. */

export async function adminListCategoriesAction() {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
 try {
 const { data, error } = await gate.supabase
 .from("categories")
 .select(
 "id, name, slug, parent_id, sort_order, is_active, image_url, description, created_at",
 )
 .order("sort_order", { ascending: true })
 .order("name", { ascending: true });
 if (error) throw error;
 return { ok: true as const, items: data ?? [] };
 } catch (e) {
 console.error("[adminListCategories]", e);
 return { ok: false as const, error: "server", items: [] };
 }
}

export async function adminCreateCategoryAction(input: {
 name: string;
 slug?: string;
 sort_order?: number;
 parent_id?: string | null;
 image_url?: string | null;
 short_description?: string | null;
 description?: string | null;
 is_active?: boolean;
 meta_title?: string | null;
 meta_description?: string | null;
 focus_keyphrases?: string[];
 og_title?: string | null;
 og_description?: string | null;
 og_image_url?: string | null;
 twitter_title?: string | null;
 twitter_description?: string | null;
 robots_index?: boolean;
 robots_follow?: boolean;
 is_cornerstone?: boolean;
 canonical_url?: string | null;
}) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };

 const name = (input.name || "").trim();
 if (name.length < 2) return { ok: false as const, error: "bad_name" };
 const baseSlug = (input.slug || slugify(name)).trim();
 if (!baseSlug) return { ok: false as const, error: "bad_slug" };

 const slug = await uniqueSlug(gate.supabase, "categories", baseSlug);

 try {
 const { data, error } = await gate.supabase
 .from("categories")
 .insert({
 name,
 slug,
 sort_order: input.sort_order ?? 0,
 is_active: input.is_active !== false,
 parent_id: input.parent_id || null,
 image_url: (input.image_url || "").trim() || null,
 short_description: (input.short_description || "").trim() || null,
 description: (input.description || "").trim() || null,
 meta_title: (input.meta_title || "").trim() || null,
 meta_description: (input.meta_description || "").trim() || null,
 } as never)
 .select("id")
 .single();
 if (error) throw error;
 return { ok: true as const, id: data.id as string };
 } catch (e) {
 console.error("[adminCreateCategory]", e);
 if (isUniqueViolation(e)) return { ok: false as const, error: "slug_taken" as const };
 return { ok: false as const, error: "server" };
 }
}

export async function adminUpdateCategoryAction(
 id: string,
 patch: {
 name?: string;
 slug?: string;
 is_active?: boolean;
 sort_order?: number;
 parent_id?: string | null;
 image_url?: string | null;
 short_description?: string | null;
 description?: string | null;
 meta_title?: string | null;
 meta_description?: string | null;
 },
) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };
 try {
 const body: Record<string, unknown> = {};
 if (patch.name !== undefined) body.name = patch.name.trim();
 if (patch.slug !== undefined) {
 const s = patch.slug.trim();
 body.slug = s ? await uniqueSlug(gate.supabase, "categories", s, id) : s;
 }
 if (patch.is_active !== undefined) body.is_active = patch.is_active;
 if (patch.sort_order !== undefined) body.sort_order = patch.sort_order;
 if (patch.parent_id !== undefined) body.parent_id = patch.parent_id || null;
 if (patch.image_url !== undefined) body.image_url = (patch.image_url || "").trim() || null;
 if (patch.short_description !== undefined)
 body.short_description = (patch.short_description || "").trim() || null;
 if (patch.description !== undefined)
 body.description = (patch.description || "").trim() || null;
 if (patch.meta_title !== undefined)
 body.meta_title = (patch.meta_title || "").trim() || null;
 if (patch.meta_description !== undefined)
 body.meta_description = (patch.meta_description || "").trim() || null;
 if (!Object.keys(body).length) return { ok: true as const };

 const { error } = await gate.supabase
 .from("categories")
 .update(body as never)
 .eq("id", id);
 if (error) throw error;
 return { ok: true as const };
 } catch (e) {
 console.error("[adminUpdateCategory]", e);
 if (isUniqueViolation(e)) return { ok: false as const, error: "slug_taken" as const };
 return { ok: false as const, error: "server" };
 }
}

/* ─── Brands ─── */
/* Prefer logo_url; also keep image_url/short_description/SEO in sync when present (post-062). */

export async function adminListBrandsAction() {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
 try {
 const full =
 "id, name, slug, is_active, logo_url, image_url, short_description, description, meta_title, meta_description, created_at";
 const basic = "id, name, slug, is_active, logo_url, description, created_at";
 const primary = await gate.supabase
 .from("brands")
 .select(full)
 .order("name", { ascending: true });
 let rows = primary.data;
 if (
 primary.error &&
 (String(primary.error.message || "").includes("42703") ||
 String(primary.error.message || "").includes("does not exist"))
 ) {
 const fallback = await gate.supabase
 .from("brands")
 .select(basic)
 .order("name", { ascending: true });
 if (fallback.error) throw fallback.error;
 rows = fallback.data;
 } else if (primary.error) {
 throw primary.error;
 }
 const items = (rows ?? []).map((row) => {
 const r = row as { logo_url?: string | null; image_url?: string | null };
 return { ...row, image_url: r.image_url ?? r.logo_url ?? null };
 });
 return { ok: true as const, items };
 } catch (e) {
 console.error("[adminListBrands]", e);
 return { ok: false as const, error: "server", items: [] };
 }
}

export async function adminCreateBrandAction(input: {
 name: string;
 slug?: string;
 image_url?: string | null;
 logo_url?: string | null;
 short_description?: string | null;
 description?: string | null;
 is_active?: boolean;
 meta_title?: string | null;
 meta_description?: string | null;
 focus_keyphrases?: string[];
 og_title?: string | null;
 og_description?: string | null;
 og_image_url?: string | null;
 robots_index?: boolean;
 robots_follow?: boolean;
 canonical_url?: string | null;
}) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };

 const name = (input.name || "").trim();
 if (name.length < 2) return { ok: false as const, error: "bad_name" };
 const baseSlug = (input.slug || slugify(name)).trim();
 if (!baseSlug) return { ok: false as const, error: "bad_slug" };

 const slug = await uniqueSlug(gate.supabase, "brands", baseSlug);
 // Wizard sends image_url; live column is logo_url
 const logo =
 (input.logo_url || input.image_url || "").trim() || null;

 try {
 const full = {
 name,
 slug,
 is_active: input.is_active !== false,
 logo_url: logo,
 image_url: logo,
 short_description: (input.short_description || "").trim() || null,
 description: (input.description || "").trim() || null,
 meta_title: (input.meta_title || "").trim() || null,
 meta_description: (input.meta_description || "").trim() || null,
 };
 const ins = await gate.supabase
 .from("brands")
 .insert(full as never)
 .select("id")
 .single();
 if (
 ins.error &&
 (String(ins.error.message || "").includes("42703") ||
 String(ins.error.message || "").includes("does not exist"))
 ) {
 const { data, error } = await gate.supabase
 .from("brands")
 .insert({
 name,
 slug,
 is_active: input.is_active !== false,
 logo_url: logo,
 description: (input.description || "").trim() || null,
 } as never)
 .select("id")
 .single();
 if (error) throw error;
 return { ok: true as const, id: data.id as string };
 }
 if (ins.error) throw ins.error;
 return { ok: true as const, id: ins.data!.id as string };
 } catch (e) {
 console.error("[adminCreateBrand]", e);
 if (isUniqueViolation(e)) return { ok: false as const, error: "slug_taken" as const };
 return { ok: false as const, error: "server" };
 }
}

export async function adminUpdateBrandAction(
 id: string,
 patch: {
 name?: string;
 slug?: string;
 is_active?: boolean;
 image_url?: string | null;
 logo_url?: string | null;
 short_description?: string | null;
 description?: string | null;
 meta_title?: string | null;
 meta_description?: string | null;
 },
) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };
 try {
 const body: Record<string, unknown> = {};
 if (patch.name !== undefined) body.name = patch.name.trim();
 if (patch.slug !== undefined) {
 const s = patch.slug.trim();
 body.slug = s ? await uniqueSlug(gate.supabase, "brands", s, id) : s;
 }
 if (patch.is_active !== undefined) body.is_active = patch.is_active;
 if (patch.logo_url !== undefined || patch.image_url !== undefined) {
 const raw =
 patch.logo_url !== undefined ? patch.logo_url : patch.image_url;
 const logo = (raw || "").trim() || null;
 body.logo_url = logo;
 body.image_url = logo;
 }
 if (patch.short_description !== undefined)
 body.short_description = (patch.short_description || "").trim() || null;
 if (patch.description !== undefined)
 body.description = (patch.description || "").trim() || null;
 if (patch.meta_title !== undefined)
 body.meta_title = (patch.meta_title || "").trim() || null;
 if (patch.meta_description !== undefined)
 body.meta_description = (patch.meta_description || "").trim() || null;
 if (!Object.keys(body).length) return { ok: true as const };

 const { error } = await gate.supabase
 .from("brands")
 .update(body as never)
 .eq("id", id);
 if (
 error &&
 (String(error.message || "").includes("42703") ||
 String(error.message || "").includes("does not exist"))
 ) {
 const basic: Record<string, unknown> = {};
 for (const k of ["name", "slug", "is_active", "logo_url", "description"] as const) {
 if (body[k] !== undefined) basic[k] = body[k];
 }
 const retry = await gate.supabase
 .from("brands")
 .update(basic as never)
 .eq("id", id);
 if (retry.error) throw retry.error;
 return { ok: true as const };
 }
 if (error) throw error;
 return { ok: true as const };
 } catch (e) {
 console.error("[adminUpdateBrand]", e);
 if (isUniqueViolation(e)) return { ok: false as const, error: "slug_taken" as const };
 return { ok: false as const, error: "server" };
 }
}

export async function adminGetCategoryAction(id: string) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };
 try {
 const { data, error } = await gate.supabase
 .from("categories")
 .select(
 "id, name, slug, parent_id, sort_order, is_active, image_url, description, meta_title, meta_description",
 )
 .eq("id", id)
 .maybeSingle();
 if (error) throw error;
 if (!data) return { ok: false as const, error: "not_found" as const };
 return { ok: true as const, item: data };
 } catch (e) {
 console.error("[adminGetCategory]", e);
 return { ok: false as const, error: "server" as const };
 }
}

export async function adminGetBrandAction(id: string) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };
 try {
 const { data, error } = await gate.supabase
 .from("brands")
 .select("id, name, slug, is_active, logo_url, description")
 .eq("id", id)
 .maybeSingle();
 if (error) throw error;
 if (!data) return { ok: false as const, error: "not_found" as const };
 const row = data as { logo_url?: string | null };
 // Expose as image_url so catalog-wizard keeps working
 return {
 ok: true as const,
 item: { ...data, image_url: row.logo_url ?? null },
 };
 } catch (e) {
 console.error("[adminGetBrand]", e);
 return { ok: false as const, error: "server" as const };
 }
}
