#!/usr/bin/env node
/**
 * Live schema parity probe (anon key).
 * Usage: node scripts/check-schema-parity.mjs
 * Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
import { readFileSync, existsSync } from "node:fs";

function loadEnv() {
  const out = { ...process.env };
  for (const f of [".env.local", ".env"]) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !out[m[1]]) out[m[1]] = m[2];
    }
  }
  return out;
}

const env = loadEnv();
const base = (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
if (!base || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(2);
}

const requiredTables = [
  "addresses",
  "notifications",
  "otp_challenges",
  "support_tickets",
  "support_ticket_messages",
  "return_requests",
  "blog_posts",
  "blog_categories",
  "analytics_events",
  "product_price_history",
  "payment_webhook_events",
  "url_redirects",
  "job_queue",
  "seo_page_settings",
  "admin_logs",
  "stock_reservations",
];

const requiredColumns = {
  orders: [
    "payment_status",
    "discount_code",
    "discount_amount",
    "shipping_fee",
    "total_amount",
  ],
  discounts: ["once_per_user", "min_order_amount", "max_discount_amount"],
  attribute_options: ["hex"],
  products: ["meta_title", "size_guide_id"],
};

async function tableExists(name) {
  const res = await fetch(`${base}/rest/v1/${name}?select=*&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (res.status === 404) return false;
  const body = await res.text();
  if (body.includes("PGRST205")) return false;
  return res.ok || res.status === 200 || res.status === 206;
}

async function columnExists(table, col) {
  const res = await fetch(`${base}/rest/v1/${table}?select=${col}&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const body = await res.text();
  if (body.includes("42703") || body.includes("does not exist")) return false;
  return res.ok || res.status === 200 || res.status === 206;
}

async function rpcExists(name, payload) {
  const res = await fetch(`${base}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  // PGRST202 = missing function; 401/403/400 with other codes often means it exists
  if (body.includes("PGRST202") || body.includes("Could not find the function")) {
    return false;
  }
  return true;
}

const missing = [];
for (const t of requiredTables) {
  if (!(await tableExists(t))) missing.push(`table:${t}`);
}
for (const [table, cols] of Object.entries(requiredColumns)) {
  for (const c of cols) {
    if (!(await columnExists(table, c))) missing.push(`column:${table}.${c}`);
  }
}
for (const [rpc, payload] of [
  ["decrement_variant_stock", { p_variant_id: "00000000-0000-0000-0000-000000000000", p_qty: 1 }],
  ["increment_variant_stock", { p_variant_id: "00000000-0000-0000-0000-000000000000", p_qty: 1 }],
  ["increment_discount_use", { p_code: "__parity_probe__" }],
]) {
  if (!(await rpcExists(rpc, payload))) missing.push(`rpc:${rpc}`);
}

if (missing.length) {
  console.log("SCHEMA_PARITY_FAIL");
  for (const m of missing) console.log("-", m);
  console.log(
    "\nApply supabase/migrations/062_live_schema_parity.sql in Supabase SQL Editor, then re-run.",
  );
  process.exit(1);
}
console.log("SCHEMA_PARITY_OK");
