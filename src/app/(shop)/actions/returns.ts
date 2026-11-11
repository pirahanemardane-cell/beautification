"use server";

import {
 RETURN_WINDOW_DAYS,
 isReturnAllowedStatus,
 isWithinReturnWindow,
} from "@/lib/business-rules";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { assertNoLinkOrImage } from "@/lib/sanitize-user-text";

async function requireUser() {
 const supabase = await createClient();
 const {
 data: { user },
 } = await supabase.auth.getUser();
 return user;
}

export async function listMyReturnsAction() {
 try {
 const user = await requireUser();
 if (!user) return { ok: false as const, items: [], error: "login_required" };
 const supabase = await createClient();
 const { data, error } = await supabase
 .from("return_requests")
 .select("id, order_id, reason, status, admin_note, created_at")
 .eq("user_id", user.id)
 .order("created_at", { ascending: false })
 .limit(50);
 if (error) throw error;
 return { ok: true as const, items: data ?? [] };
 } catch (e) {
 console.error("[listMyReturns]", e);
 return { ok: false as const, items: [], error: "server" };
 }
}

export type ReturnLineInput = {
 orderItemId: string;
 quantity?: number;
};

export async function createReturnAction(input: {
 orderId: string;
 reason: string;
 items?: ReturnLineInput[];
}) {
 try {
 const user = await requireUser();
 if (!user) return { ok: false as const, error: "login_required" };
 if (!input.orderId?.trim())
 return { ok: false as const, error: "order_required" };

 const reason = assertNoLinkOrImage(input.reason, "دلیل مرجوعی");
 if (!reason.ok) return { ok: false as const, error: reason.error };
 if (!reason.text || reason.text.length < 5)
 return { ok: false as const, error: "reason_short" };

 const supabase = await createClient();

 // سفارش باید مال همین کاربر باشد + وضعیت قابل مرجوعی
 const { data: order, error: oErr } = await supabase
 .from("orders")
 .select("id, status, created_at, shipped_at")
 .eq("id", input.orderId)
 .eq("user_id", user.id)
 .maybeSingle();
 if (oErr) console.error("[createReturn order check]", oErr);
 if (!order) return { ok: false as const, error: "order_not_found" };

 if (!isReturnAllowedStatus(String(order.status || ""))) {
 return { ok: false as const, error: "order_not_eligible" };
 }
 const allowed = new Set(["delivered", "shipped"]); // kept for compat; primary check above
 if (!allowed.has(String(order.status))) {
 return { ok: false as const, error: "order_not_eligible" };
 }

 // مهلت مرجوعی از shipped_at یا created_at — بدون تاریخ معتبر = رد
 if (
 !isWithinReturnWindow(
 (order as { shipped_at?: string | null }).shipped_at,
 order.created_at as string,
 )
 ) {
 return { ok: false as const, error: "return_window_expired" };
 }
 // RETURN_WINDOW_DAYS kept via business-rules helper
 void RETURN_WINDOW_DAYS;

 // جلوگیری از درخواست باز تکراری روی همان سفارش
 const { data: existing } = await supabase
 .from("return_requests")
 .select("id, status")
 .eq("order_id", input.orderId)
 .eq("user_id", user.id)
 .in("status", ["pending", "approved", "received"])
 .limit(1)
 .maybeSingle();
 if (existing) {
 return { ok: false as const, error: "return_already_open" };
 }

 const { data: orderItems, error: oiErr } = await supabase
 .from("order_items")
 .select("id, quantity, title")
 .eq("order_id", input.orderId);
 if (oiErr) throw oiErr;
 const orderItemRows = (orderItems ?? []) as Array<{
 id: string;
 quantity: number;
 title: string | null;
 }>;
 if (!orderItemRows.length) {
 return { ok: false as const, error: "order_items_missing" };
 }

 const byId = new Map(orderItemRows.map((r) => [r.id, r]));
 const requested = (input.items ?? [])
 .map((it) => ({
 orderItemId: String(it.orderItemId || "").trim(),
 quantity: Math.max(1, Math.floor(Number(it.quantity) || 1)),
 }))
 .filter((it) => it.orderItemId);

 if (!requested.length) {
 return { ok: false as const, error: "items_required" };
 }

 const lines: { order_item_id: string; quantity: number; reason: string }[] =
 [];
 for (const req of requested) {
 const row = byId.get(req.orderItemId);
 if (!row) return { ok: false as const, error: "invalid_item" };
 const maxQty = Math.max(1, Number(row.quantity) || 1);
 if (req.quantity > maxQty) {
 return { ok: false as const, error: "invalid_quantity" };
 }
 lines.push({
 order_item_id: row.id,
 quantity: req.quantity,
 reason: reason.text,
 });
 }

 const { data, error } = await supabase
 .from("return_requests")
 .insert({
 user_id: user.id,
 order_id: input.orderId,
 reason: reason.text,
 status: "pending",
 })
 .select("id")
 .single();
 if (error) throw error;

 const returnId = data.id as string;

 // return_items may lack RLS — service role after ownership checks above
 const service = createServiceClient();
 const { error: riErr } = await service.from("return_items").insert(
 lines.map((l) => ({
 return_id: returnId,
 order_item_id: l.order_item_id,
 quantity: l.quantity,
 reason: l.reason,
 })) as never,
 );
 if (riErr) {
 console.error("[createReturn return_items]", riErr);
 try {
 await service.from("return_requests").delete().eq("id", returnId);
 } catch (delErr) {
 console.error("[createReturn rollback]", delErr);
 }
 return { ok: false as const, error: "server" };
 }

 return { ok: true as const, id: returnId };
 } catch (e) {
 console.error("[createReturn]", e);
 return { ok: false as const, error: "server" };
 }
}
