"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useShopStore, type ShopProduct } from "@/lib/shop-store";
import { Price } from "@/components/ui/price";

/** Standalone wishlist for guests + logged-in users (also linked from Persian rewrite). */
export default function WishlistPage() {
 const wishlist = useShopStore((s) => s.wishlist);
 const toggleWishlist = useShopStore((s) => s.toggleWishlist);
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
 <h1 className="text-primary text-2xl font-bold">علاقه‌مندی‌ها</h1>
 <p className="text-muted-foreground mt-1 text-sm">
 {wishlist.length
 ? `${wishlist.length} مورد`
 : "هنوز محصولی به علاقه‌مندی‌ها اضافه نشده است."}
 </p>
 </div>
 <Link href="/dashboard?tab=wishlist" className="text-primary text-sm hover:underline">
 داشبورد
 </Link>
 </div>

 {wishlist.length === 0 ? (
 <Link href="/products" className="text-primary inline-block text-sm hover:underline">
 مشاهده محصولات
 </Link>
 ) : (
 <ul className="space-y-3">
 {wishlist.map((p: ShopProduct) => (
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
 onClick={() => toggleWishlist(p)}
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
