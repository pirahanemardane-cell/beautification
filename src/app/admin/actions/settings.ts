"use server";

import { requireAdmin } from "@/lib/admin/require-admin";

function isSet(name: string): boolean {
 const v = process.env[name];
 return Boolean(v && String(v).trim());
}

export async function adminSettingsStatusAction() {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };

 return {
 ok: true as const,
 env: process.env.NODE_ENV ?? "unknown",
 checks: {
 supabaseUrl: isSet("NEXT_PUBLIC_SUPABASE_URL"),
 supabaseAnon: isSet("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
 supabaseService: isSet("SUPABASE_SERVICE_ROLE_KEY"),
 r2Account: isSet("R2_ACCOUNT_ID"),
 r2Access: isSet("R2_ACCESS_KEY_ID"),
 r2Secret: isSet("R2_SECRET_ACCESS_KEY"),
 r2Bucket: isSet("R2_BUCKET_NAME"),
 r2Public: isSet("R2_PUBLIC_BASE_URL"),
 },
 };
}

export async function adminChangePasswordAction(
 currentPassword: string,
 newPassword: string,
) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };

 const cur = (currentPassword || "").trim();
 const next = (newPassword || "").trim();
 if (next.length < 8) {
 return { ok: false as const, error: "weak" as const };
 }

 try {
 const { createClient } = await import("@/lib/supabase/server");
 const supabase = await createClient();
 const {
 data: { user },
 } = await supabase.auth.getUser();
 if (!user?.email) {
 return { ok: false as const, error: "login_required" as const };
 }

 // تأیید رمز فعلی
 const { error: checkErr } = await supabase.auth.signInWithPassword({
 email: user.email,
 password: cur,
 });
 if (checkErr) {
 return { ok: false as const, error: "bad_current" as const };
 }

 const { error: updErr } = await supabase.auth.updateUser({
 password: next,
 });
 if (updErr) {
 console.error("[adminChangePassword]", updErr);
 return { ok: false as const, error: "server" as const };
 }
 return { ok: true as const };
 } catch (e) {
 console.error("[adminChangePassword]", e);
 return { ok: false as const, error: "server" as const };
 }
}

const STORE_KEYS = [
 "free_shipping_enabled",
 "free_shipping_min_amount",
 "order_sms_enabled",
 "store_support_phone",
 "store_support_email",
] as const;

export type StoreSettingsMap = Record<(typeof STORE_KEYS)[number], string>;

function plainSetting(value: unknown): string {
 if (value == null) return "";
 if (typeof value === "string") return value;
 if (typeof value === "boolean" || typeof value === "number") return String(value);
 return "";
}

export async function adminGetStoreSettingsAction() {
 const gate = await requireAdmin();
 if (!gate.ok) {
 return { ok: false as const, error: gate.error, settings: null };
 }
 try {
 const { parseFreeShippingFromRows, freeShippingSelectKeys } = await import(
 "@/lib/settings/free-shipping"
 );
 const keys = [...STORE_KEYS, ...freeShippingSelectKeys()];
 const { data, error } = await gate.supabase
 .from("site_settings")
 .select("key, value")
 .in("key", keys);
 if (error) throw error;

 const rows = (data ?? []) as { key: string; value: unknown }[];
 const free = parseFreeShippingFromRows(rows);
 const byKey = new Map(rows.map((r) => [r.key, r.value]));

 const map: StoreSettingsMap = {
 free_shipping_enabled: free.enabled ? "true" : "false",
 free_shipping_min_amount: String(free.minAmount || 2000000),
 order_sms_enabled: plainSetting(byKey.get("order_sms_enabled")) || "true",
 store_support_phone: plainSetting(byKey.get("store_support_phone")),
 store_support_email: plainSetting(byKey.get("store_support_email")),
 };
 return { ok: true as const, settings: map };
 } catch (e) {
 console.error("[adminGetStoreSettings]", e);
 return { ok: false as const, error: "server" as const, settings: null };
 }
}

export async function adminSaveStoreSettingsAction(input: {
 free_shipping_enabled: boolean;
 free_shipping_min_amount: string;
 order_sms_enabled: boolean;
 store_support_phone: string;
 store_support_email: string;
}) {
 const gate = await requireAdmin();
 if (!gate.ok) return { ok: false as const, error: gate.error };

 const minRaw = String(input.free_shipping_min_amount || "").replace(/,/g, "");
 const min = Math.max(0, Math.round(Number(minRaw) || 0));

 try {
 const {
 freeShippingUpsertRows,
 mergeShippingDoc,
 } = await import("@/lib/settings/free-shipping");

 const { data: existingShipping } = await gate.supabase
 .from("site_settings")
 .select("value")
 .eq("key", "shipping")
 .maybeSingle();

 const freeRows = freeShippingUpsertRows({
 enabled: input.free_shipping_enabled,
 minAmount: min,
 excludeCodes: "peyk,alopeyk",
 }).map((row) =>
 row.key === "shipping"
 ? {
 key: "shipping",
 value: mergeShippingDoc(existingShipping?.value, {
 enabled: input.free_shipping_enabled,
 minAmount: min,
 excludeCodes: "peyk,alopeyk",
 }),
 }
 : row,
 );

 const rows: { key: string; value: unknown }[] = [
 ...freeRows,
 {
 key: "order_sms_enabled",
 value: input.order_sms_enabled ? "true" : "false",
 },
 {
 key: "store_support_phone",
 value: (input.store_support_phone || "").trim(),
 },
 {
 key: "store_support_email",
 value: (input.store_support_email || "").trim(),
 },
 ];

 for (const row of rows) {
 const { error } = await gate.supabase.from("site_settings").upsert(
 {
 key: row.key,
 value: row.value as never,
 updated_at: new Date().toISOString(),
 },
 { onConflict: "key" },
 );
 if (error) throw error;
 }
 return { ok: true as const };
 } catch (e) {
 console.error("[adminSaveStoreSettings]", e);
 return { ok: false as const, error: "server" as const };
 }
}
