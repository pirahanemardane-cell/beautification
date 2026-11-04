"use server";

import { requireAdmin } from "@/lib/admin/require-admin";

function isMissingColumnError(message: string): boolean {
 return (
 message.includes("42703") ||
 message.includes("does not exist") ||
 message.includes("column")
 );
}

const DISCOUNT_FULL_SELECT =
 "id, code, type, value, min_order_amount, max_uses, used_count, starts_at, ends_at, is_active, once_per_user, created_at, max_discount_amount, product_ids, category_ids";

const DISCOUNT_BASIC_SELECT =
 "id, code, type, value, min_order_amount, max_uses, used_count, starts_at, ends_at, is_active, created_at";

export async function adminListDiscountsAction(limit = 50) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
 try {
 const full = await gate.supabase
 .from("discounts")
 .select(DISCOUNT_FULL_SELECT)
 .order("created_at", { ascending: false })
 .limit(limit);
 if (full.error && isMissingColumnError(String(full.error.message || ""))) {
 const basic = await gate.supabase
 .from("discounts")
 .select(DISCOUNT_BASIC_SELECT)
 .order("created_at", { ascending: false })
 .limit(limit);
 if (basic.error) throw basic.error;
 return { ok: true as const, items: basic.data ?? [] };
 }
 if (full.error) throw full.error;
 return { ok: true as const, items: full.data ?? [] };
 } catch (e) {
 console.error("[adminListDiscounts]", e);
 return { ok: false as const, error: "server", items: [] };
 }
}

export async function adminSetDiscountActiveAction(id: string, isActive: boolean) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };
 try {
 const { error } = await gate.supabase
 .from("discounts")
 .update({ is_active: isActive })
 .eq("id", id);
 if (error) throw error;
 return { ok: true as const };
 } catch (e) {
 console.error("[adminSetDiscountActive]", e);
 return { ok: false as const, error: "server" };
 }
}

function parseUuidList(raw?: string | null): string[] | null {
 if (!raw || !String(raw).trim()) return null;
 const ids = String(raw)
 .split(/[\s,]+/)
 .map((x) => x.trim())
 .filter((x) => /^[0-9a-f-]{36}$/i.test(x));
 return ids.length ? ids : null;
}

export async function adminCreateDiscountAction(input: {
 code: string;
 type: "percentage" | "fixed";
 value: number;
 min_order_amount?: number | null;
 max_uses?: number | null;
 starts_at?: string | null;
 ends_at?: string | null;
 once_per_user?: boolean;
 max_discount_amount?: number | null;
 product_ids?: string | null;
 category_ids?: string | null;
}) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };

 const code = (input.code || "").trim().toUpperCase();
 if (!code || code.length < 2) return { ok: false as const, error: "bad_code" };
 if (!Number.isFinite(input.value) || input.value <= 0) {
 return { ok: false as const, error: "bad_value" };
 }
 if (input.type === "percentage" && input.value > 100) {
 return { ok: false as const, error: "bad_percent" };
 }

 const basicRow = {
 code,
 type: input.type,
 value: input.value,
 min_order_amount: input.min_order_amount ?? 0,
 max_uses: input.max_uses ?? null,
 used_count: 0,
 starts_at: input.starts_at ?? null,
 ends_at: input.ends_at ?? null,
 is_active: true,
 };

 const fullRow = {
 ...basicRow,
 once_per_user: Boolean(input.once_per_user),
 max_discount_amount: input.max_discount_amount ?? null,
 product_ids: parseUuidList(input.product_ids),
 category_ids: parseUuidList(input.category_ids),
 };

 try {
 const fullIns = await gate.supabase
 .from("discounts")
 .insert(fullRow)
 .select("id")
 .single();
 if (fullIns.error && isMissingColumnError(String(fullIns.error.message || ""))) {
 const basicIns = await gate.supabase
 .from("discounts")
 .insert(basicRow)
 .select("id")
 .single();
 if (basicIns.error) throw basicIns.error;
 return { ok: true as const, id: basicIns.data.id as string };
 }
 if (fullIns.error) {
 const msg = String(fullIns.error.message || "");
 if (
 fullIns.error.code === "23505" ||
 msg.includes("duplicate") ||
 msg.includes("unique")
 ) {
 return { ok: false as const, error: "duplicate_code" };
 }
 throw fullIns.error;
 }
 return { ok: true as const, id: fullIns.data!.id as string };
 } catch (e) {
 console.error("[adminCreateDiscount]", e);
 const msg =
 e && typeof e === "object" && "message" in e
 ? String((e as { message: string }).message)
 : String(e);
 if (msg.includes("duplicate") || msg.includes("23505") || msg.includes("unique")) {
 return { ok: false as const, error: "duplicate_code" };
 }
 return { ok: false as const, error: "server" };
 }
}

export async function adminUpdateDiscountAction(
 id: string,
 input: {
 code?: string;
 type?: "percentage" | "fixed";
 value?: number;
 min_order_amount?: number | null;
 max_uses?: number | null;
 starts_at?: string | null;
 ends_at?: string | null;
 is_active?: boolean;
 once_per_user?: boolean;
 max_discount_amount?: number | null;
 product_ids?: string | null;
 category_ids?: string | null;
 },
) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };
 if (!id) return { ok: false as const, error: "bad_id" };

 const basicPatch: Record<string, unknown> = {};
 if (input.code !== undefined) basicPatch.code = String(input.code).trim().toUpperCase();
 if (input.type !== undefined) basicPatch.type = input.type;
 if (input.value !== undefined) basicPatch.value = input.value;
 if (input.min_order_amount !== undefined) basicPatch.min_order_amount = input.min_order_amount;
 if (input.max_uses !== undefined) basicPatch.max_uses = input.max_uses;
 if (input.starts_at !== undefined) basicPatch.starts_at = input.starts_at;
 if (input.ends_at !== undefined) basicPatch.ends_at = input.ends_at;
 if (input.is_active !== undefined) basicPatch.is_active = input.is_active;

 const fullPatch: Record<string, unknown> = { ...basicPatch };
 if (input.once_per_user !== undefined) fullPatch.once_per_user = Boolean(input.once_per_user);
 if (input.max_discount_amount !== undefined) {
 fullPatch.max_discount_amount = input.max_discount_amount;
 }
 if (input.product_ids !== undefined) fullPatch.product_ids = parseUuidList(input.product_ids);
 if (input.category_ids !== undefined) fullPatch.category_ids = parseUuidList(input.category_ids);

 try {
 const fullUp = await gate.supabase.from("discounts").update(fullPatch).eq("id", id);
 if (fullUp.error && isMissingColumnError(String(fullUp.error.message || ""))) {
 const basicUp = await gate.supabase.from("discounts").update(basicPatch).eq("id", id);
 if (basicUp.error) throw basicUp.error;
 return { ok: true as const };
 }
 if (fullUp.error) throw fullUp.error;
 return { ok: true as const };
 } catch (e) {
 console.error("[adminUpdateDiscount]", e);
 return { ok: false as const, error: "server" };
 }
}
