"use server";

import { requireAdmin } from "@/lib/admin/require-admin";

export type AdminHypoallergenicRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  is_hypoallergenic: boolean;
  updated_at: string | null;
};

export async function adminListHypoallergenicProductsAction(opts?: {
  filter?: "all" | "yes" | "no";
  q?: string;
  limit?: number;
}) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return { ok: false as const, error: gate.error, items: [] as AdminHypoallergenicRow[] };
  }
  try {
    const limit = Math.min(200, Math.max(1, opts?.limit ?? 100));
    let q = gate.supabase
      .from("products")
      .select("id, name, slug, status, is_hypoallergenic, updated_at")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(limit);

    const filter = opts?.filter ?? "all";
    if (filter === "yes") q = q.eq("is_hypoallergenic", true);
    if (filter === "no") q = q.eq("is_hypoallergenic", false);

    const search = (opts?.q || "").trim();
    if (search) {
      q = q.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data, error } = await q;
    if (error) {
      if (
        String(error.message || "").includes("is_hypoallergenic") ||
        String(error.message || "").includes("42703") ||
        String(error.message || "").includes("column")
      ) {
        return {
          ok: true as const,
          items: [] as AdminHypoallergenicRow[],
          unsupported: true as const,
        };
      }
      throw error;
    }
    return { ok: true as const, items: (data ?? []) as AdminHypoallergenicRow[] };
  } catch (e) {
    console.error("[adminListHypoallergenicProducts]", e);
    return { ok: false as const, error: "server" as const, items: [] as AdminHypoallergenicRow[] };
  }
}

export async function adminSetHypoallergenicAction(id: string, value: boolean) {
  const gate = await requireAdmin();
  if (!gate.ok) return { ok: false as const, error: gate.error };
  if (!id?.trim()) return { ok: false as const, error: "invalid" as const };
  try {
    const { error } = await gate.supabase
      .from("products")
      .update({ is_hypoallergenic: !!value } as never)
      .eq("id", id);
    if (error) throw error;
    return { ok: true as const };
  } catch (e) {
    console.error("[adminSetHypoallergenic]", e);
    return { ok: false as const, error: "server" as const };
  }
}
