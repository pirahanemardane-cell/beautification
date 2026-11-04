import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** کلاینت anon بدون cookie — مناسب دادهٔ عمومی و ISR */
export function createPublicClient() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://placeholder.supabase.co";
 const key =
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
 "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";
 return createClient<Database>(url, key, {
 auth: { persistSession: false, autoRefreshToken: false },
 });
}
