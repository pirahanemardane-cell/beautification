"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useShopStore, type ShopProduct } from "@/lib/shop-store";
import { Price } from "@/components/ui/price";

/** Standalone compare list (Persian rewrite target). */
export default function ComparePage() {
 const compare = useShopStore((s) => s.compare);
 const toggleCompare = useShopStore((s) => s.toggleCompare);
 const [hydrated, setHydrated] = useState(false);
 useEffect(() => setHydrated(true), []);

 if (!hydrated) {
 return (
 <main className="mx-auto w-full max-w-3xl px-4 py-12" dir="rtl">
 <p className="text-muted-foreground text-sm">در حال بارگذاری…</p>
 </main>
 );
 }

 return (
 <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12" dir="rtl">
 <div className="flex items-end justify-between gap-3">
 <div>
 <h1 className="text-primary text-2xl font-bold">مقایسه</h1>
 <p className="text-muted-foreground mt-1 text-sm">
 {compare.length
 ? `${compare.length} مورد`
 : "محصولی برای مقایسه انتخاب نشده است."}
 </p>
 </div>
 <Link href="/dashboard?tab=compare" className="text-primary text-sm hover:underline">
 داشبورد
 </Link>
 </div>

 {compare.length === 0 ? (
 <Link href="/products" className="text-primary inline-block text-sm hover:underline">
 مشاهده محصولات
 </Link>
 ) : (
 <ul className="space-y-3">
 {compare.map((p: ShopProduct) => (
 <li
 key={p.id}
 className="border-border flex items-center gap-3 rounded-xl border p-3"
 >
 {p.image ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={p.image}
 alt=""
 className="h-16 w-16 rounded-md object-cover"
 />
 ) : (
 <div className="bg-muted h-16 w-16 rounded-md" />
 )}
 <div className="min-w-0 flex-1">
 <Link
 href={p.href || `/products`}
 className="block truncate text-sm font-medium hover:underline"
 >
 {p.title}
 </Link>
 <Price amount={p.price} size="sm" />
 </div>
 <button
 type="button"
 className="text-destructive text-xs"
 onClick={() => toggleCompare(p)}
 >
 حذف
 </button>
 </li>
 ))}
 </ul>
 )}
 </main>
 );
}
