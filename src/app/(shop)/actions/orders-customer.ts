"use server";

import { isCustomerCancellable } from "@/lib/business-rules";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function requireUser() {
 const supabase = await createClient();
 const {
 data: { user },
 } = await supabase.auth.getUser();
 return user;
}

/** لغو سفارش توسط مشتری — فقط قبل از ارسال */
export async function cancelMyOrderAction(orderId: string, reason?: string) {
 try {
 const user = await requireUser();
 if (!user) return { ok: false as const, error: "login_required" };
 if (!orderId?.trim()) return { ok: false as const, error: "order_required" };

 const service = createServiceClient();
 type CancelOrderRow = {
 id: string;
 user_id: string | null;
 status: string;
 payment_status?: string | null;
 };
 let order: CancelOrderRow | null = null;
 {
 const full = await service
 .from("orders")
 .select("id, user_id, status, payment_status")
 .eq("id", orderId)
 .eq("user_id", user.id)
 .maybeSingle();
 if (
 full.error &&
 (String(full.error.message || "").includes("does not exist") ||
 String(full.error.message || "").includes("42703"))
 ) {
 const basic = await service
 .from("orders")
 .select("id, user_id, status")
 .eq("id", orderId)
 .eq("user_id", user.id)
 .maybeSingle();
 if (basic.error || !basic.data) return { ok: false as const, error: "not_found" };
 order = basic.data as unknown as CancelOrderRow;
 } else if (full.error || !full.data) {
 return { ok: false as const, error: "not_found" };
 } else {
 order = full.data as unknown as CancelOrderRow;
 }
 }
 if (!order) return { ok: false as const, error: "not_found" };

 const st = String(order.status || "");
 // فقط pending / paid / processing — نه shipped/delivered/cancelled
 if (!isCustomerCancellable(st)) {
 return { ok: false as const, error: "not_cancellable" };
 }

 const fromStatus = st;
 const note = (reason || "").trim().slice(0, 300) || "لغو توسط مشتری";

 // موجودی: اگر قبلاً رزرو کم شده، با updateStatus ادمین restore می‌شود —
 // اینجا همان منطق restore ساده
 const { data: items } = await service
 .from("order_items")
 .select("variant_id, quantity")
 .eq("order_id", orderId);

 // به‌روزرسانی اتمی: فقط اگر هنوز قابل لغو باشد (ضد race دو تب)
 const patch: Record<string, unknown> = {
 status: "cancelled",
 updated_at: new Date().toISOString(),
 };
 if (order.payment_status != null) {
 patch.payment_status =
 order.payment_status === "paid"
 ? "paid"
 : order.payment_status === "cod"
 ? "cod"
 : "failed";
 }
 let updated: { id: string } | null = null;
 {
 const withPay = await service
 .from("orders")
 .update(patch as never)
 .eq("id", orderId)
 .eq("user_id", user.id)
 .in("status", ["pending", "paid", "processing"])
 .select("id")
 .maybeSingle();
 if (
 withPay.error &&
 (String(withPay.error.message || "").includes("does not exist") ||
 String(withPay.error.message || "").includes("42703"))
 ) {
 const { payment_status: _drop, ...safe } = patch;
 const basic = await service
 .from("orders")
 .update(safe as never)
 .eq("id", orderId)
 .eq("user_id", user.id)
 .in("status", ["pending", "paid", "processing"])
 .select("id")
 .maybeSingle();
 if (basic.error) throw basic.error;
 updated = basic.data;
 } else if (withPay.error) {
 throw withPay.error;
 } else {
 updated = withPay.data;
 }
 }
 if (!updated) {
 return { ok: false as const, error: "not_cancellable" };
 }

 // بازگردانی موجودی
 for (const it of items ?? []) {
 const vid = (it as { variant_id?: string }).variant_id;
 const q = Number((it as { quantity?: number }).quantity) || 0;
 if (!vid || q < 1) continue;
 try {
 await service.rpc("increment_variant_stock", {
 p_variant_id: vid,
 p_qty: q,
 });
 } catch (re) {
 console.error("[cancelMyOrder stock]", re);
 }
 }

 await service.from("order_status_history").insert({
 order_id: orderId,
 from_status: fromStatus,
 to_status: "cancelled",
 note,
 actor_type: "customer",
 actor_id: user.id,
 });

 return { ok: true as const };
 } catch (e) {
 console.error("[cancelMyOrder]", e);
 return { ok: false as const, error: "server" };
 }
}

export async function getMyOrderHistoryAction(orderId: string) {
 try {
 const user = await requireUser();
 if (!user) return { ok: false as const, error: "login_required", items: [] };
 if (!orderId?.trim()) return { ok: false as const, error: "order_required", items: [] };

 const supabase = await createClient();
 // مالکیت سفارش (دفاع لایه‌ای علاوه بر RLS)
 const { data: own } = await supabase
 .from("orders")
 .select("id")
 .eq("id", orderId)
 .eq("user_id", user.id)
 .maybeSingle();
 if (!own) return { ok: false as const, error: "not_found", items: [] };

 const { data, error } = await supabase
 .from("order_status_history")
 .select("id, from_status, to_status, note, actor_type, created_at")
 .eq("order_id", orderId)
 .order("created_at", { ascending: true })
 .limit(50);

 if (error) {
 // اگر جدول هنوز migrate نشده
 console.error("[getMyOrderHistory]", error);
 return { ok: true as const, items: [] };
 }
 return { ok: true as const, items: data ?? [] };
 } catch (e) {
 console.error("[getMyOrderHistory]", e);
 return { ok: false as const, error: "server", items: [] };
 }
}
