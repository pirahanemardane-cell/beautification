"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useShopStore, type ShopProduct } from "@/lib/shop-store";
import { Price } from "@/components/ui/price";
import { getCompareMatrixAction } from "@/app/(shop)/actions/compare";

type MatrixRow = {
  productId: string;
  title: string;
  href: string;
  image?: string | null;
  price: number | null;
  inStock: boolean;
  isHypoallergenic: boolean;
  specs: { label: string; value: string }[];
};

/** Side-by-side compare matrix (local list + live specs). */
export default function ComparePage() {
  const compare = useShopStore((s) => s.compare);
  const toggleCompare = useShopStore((s) => s.toggleCompare);
  const [hydrated, setHydrated] = useState(false);
  const [rows, setRows] = useState<MatrixRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => setHydrated(true), []);

  const ids = useMemo(() => compare.map((p) => p.id), [compare]);

  useEffect(() => {
    if (!ids.length) {
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void getCompareMatrixAction(ids).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.ok) setRows(res.rows);
      else {
        setRows(
          compare.map((p) => ({
            productId: p.id,
            title: p.title,
            href: p.href || `/محصولات`,
            image: p.image,
            price: p.price,
            inStock: true,
            isHypoallergenic: false,
            specs: [],
          })),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ids.join("|"), compare]);

  const allSpecLabels = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) for (const s of r.specs) set.add(s.label);
    return [...set];
  }, [rows]);

  if (!hydrated) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12" dir="rtl">
        <p className="text-muted-foreground text-sm">در حال بارگذاری…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-12" dir="rtl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-primary text-2xl font-bold">مقایسه</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {compare.length
              ? `${compare.length} مورد — جدول مشخصات`
              : "محصولی برای مقایسه انتخاب نشده است."}
          </p>
        </div>
        <Link
          href="/داشبورد?tab=compare"
          className="text-primary text-sm hover:underline"
        >
          داشبورد
        </Link>
      </div>

      {compare.length === 0 ? (
        <Link
          href="/محصولات"
          className="text-primary inline-block text-sm hover:underline"
        >
          مشاهده محصولات
        </Link>
      ) : (
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-muted-foreground text-sm">بارگذاری مشخصات…</p>
          ) : null}
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-border bg-muted/40 sticky right-0 z-10 border p-2 text-right font-medium">
                  ویژگی
                </th>
                {rows.map((r) => (
                  <th
                    key={r.productId}
                    className="border-border min-w-[10rem] border p-2 align-top"
                  >
                    <div className="space-y-2">
                      {r.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.image}
                          alt=""
                          className="mx-auto h-20 w-20 rounded-md object-cover"
                        />
                      ) : (
                        <div className="bg-muted mx-auto h-20 w-20 rounded-md" />
                      )}
                      <Link
                        href={r.href}
                        className="block text-xs font-medium hover:underline"
                      >
                        {r.title}
                      </Link>
                      <button
                        type="button"
                        className="text-destructive text-[11px]"
                        onClick={() => {
                          const local = compare.find((p) => p.id === r.productId);
                          if (local) toggleCompare(local);
                        }}
                      >
                        حذف
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-border bg-muted/20 sticky right-0 border p-2 font-medium">
                  قیمت
                </td>
                {rows.map((r) => (
                  <td key={r.productId + "-price"} className="border-border border p-2">
                    {r.price != null ? <Price amount={r.price} size="sm" /> : "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border-border bg-muted/20 sticky right-0 border p-2 font-medium">
                  موجودی
                </td>
                {rows.map((r) => (
                  <td key={r.productId + "-stock"} className="border-border border p-2">
                    {r.inStock ? "موجود" : "ناموجود"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border-border bg-muted/20 sticky right-0 border p-2 font-medium">
                  ضد حساسیت
                </td>
                {rows.map((r) => (
                  <td key={r.productId + "-hypo"} className="border-border border p-2">
                    {r.isHypoallergenic ? "بله" : "—"}
                  </td>
                ))}
              </tr>
              {allSpecLabels.map((label) => (
                <tr key={label}>
                  <td className="border-border bg-muted/20 sticky right-0 border p-2 font-medium">
                    {label}
                  </td>
                  {rows.map((r) => {
                    const val =
                      r.specs.find((s) => s.label === label)?.value ?? "—";
                    return (
                      <td
                        key={r.productId + label}
                        className="border-border border p-2"
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && !loading
            ? compare.map((p: ShopProduct) => (
                <p key={p.id} className="text-muted-foreground text-xs">
                  {p.title}
                </p>
              ))
            : null}
        </div>
      )}
    </main>
  );
}
