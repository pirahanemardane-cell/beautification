"use server";

import { requireAdmin } from "@/lib/admin/require-admin";

function isMissingColumnError(message: string): boolean {
 return (
 message.includes("42703") ||
 message.includes("does not exist") ||
 message.includes("column")
 );
}

export async function adminListReviewsAction(opts?: {
 approved?: "all" | "yes" | "no";
}) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };
 try {
 const fullSelect =
 "id, rating, title, body, is_approved, admin_reply, created_at, product:products(name), user:profiles(full_name)";
 const basicSelect =
 "id, rating, title, body, is_approved, created_at, product:products(name), user:profiles(full_name)";

 const run = (cols: string) => {
 let query = gate.supabase
 .from("reviews")
 .select(cols)
 .order("created_at", { ascending: false })
 .limit(100);
 if (opts?.approved === "yes") query = query.eq("is_approved", true);
 if (opts?.approved === "no") query = query.eq("is_approved", false);
 return query;
 };

 const full = await run(fullSelect);
 if (full.error && isMissingColumnError(String(full.error.message || ""))) {
 const basic = await run(basicSelect);
 if (basic.error) throw basic.error;
 return { ok: true as const, items: basic.data ?? [], replySupported: false as const };
 }
 if (full.error) throw full.error;
 return { ok: true as const, items: full.data ?? [], replySupported: true as const };
 } catch (e) {
 console.error("[adminListReviews]", e);
 return { ok: false as const, error: "server", items: [] };
 }
}

export async function adminSetReviewApprovedAction(id: string, is_approved: boolean) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };
 try {
 const { data: row, error: fetchErr } = await gate.supabase
 .from("reviews")
 .select("id, product_id")
 .eq("id", id)
 .maybeSingle();
 if (fetchErr) throw fetchErr;
 if (!row) return { ok: false as const, error: "not_found" };

 const { error } = await gate.supabase
 .from("reviews")
 .update({ is_approved })
 .eq("id", id);
 if (error) throw error;

 // DB trigger also runs; explicit RPC keeps stats correct if trigger lag/missing
 try {
 await gate.supabase.rpc("recompute_product_review_stats", {
 p_product_id: (row as { product_id: string }).product_id,
 });
 } catch (e) {
 console.error("[adminSetReviewApproved recompute]", e);
 }
 return { ok: true as const };
 } catch {
 return { ok: false as const, error: "server" };
 }
}

export async function adminSetReviewReplyAction(id: string, reply: string) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };
 try {
 const text = (reply ?? "").trim();
 if (text.length > 2000) return { ok: false as const, error: "too_long" };
 const { error } = await gate.supabase
 .from("reviews")
 .update({ admin_reply: text || null, updated_at: new Date().toISOString() })
 .eq("id", id);
 if (error) {
 if (isMissingColumnError(String(error.message || ""))) {
 return { ok: false as const, error: "unsupported" as const };
 }
 throw error;
 }
 return { ok: true as const };
 } catch (e) {
 console.error("[adminSetReviewReply]", e);
 return { ok: false as const, error: "server" };
 }
}
