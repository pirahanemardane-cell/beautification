"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  adminDeleteReviewImagesAction,
  adminListReviewImagesAction,
  type AdminReviewImageRow,
} from "@/app/admin/actions/review-images";
import { updateReviewApproval } from "@/app/admin/reviews/actions";
import { LumaSpin } from "@/components/ui/luma-spin";
import { formatJalaliDateTime } from "@/lib/dates/jalali";

export default function AdminReviewImagesPage() {
  const [items, setItems] = useState<AdminReviewImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await adminListReviewImagesAction({ approved: filter });
    setLoading(false);
    if (!res.ok) {
      setError(
        res.error === "forbidden" ? "دسترسی ادمین ندارید" : "خطا در بارگذاری",
      );
      setItems([]);
      return;
    }
    setItems(res.items ?? []);
    setSelected([]);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function deleteSelected() {
    if (!selected.length) return;
    if (!confirm(`حذف ${selected.length} تصویر؟`)) return;
    setBusy(true);
    const res = await adminDeleteReviewImagesAction(selected);
    setBusy(false);
    if (!res.ok) {
      setError("حذف ناموفق");
      return;
    }
    void load();
  }

  async function approveReview(reviewId: string, next: boolean) {
    setBusy(true);
    await updateReviewApproval(reviewId, next);
    setBusy(false);
    void load();
  }

  return (
    <div className="space-y-4 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">تصاویر نظرات</h1>
          <p className="text-muted-foreground text-sm">
            moderation تصاویر آپلودشده همراه نظرات
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="border-input bg-background rounded-xl border px-3 py-2 text-sm"
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as "all" | "pending" | "approved")
            }
          >
            <option value="all">همه</option>
            <option value="pending">نظر در انتظار</option>
            <option value="approved">نظر تأییدشده</option>
          </select>
          <button
            type="button"
            disabled={busy || !selected.length}
            onClick={() => void deleteSelected()}
            className="border-destructive text-destructive rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
          >
            حذف انتخاب‌شده
          </button>
          <Link href="/admin/reviews" className="border-border rounded-xl border px-4 py-2 text-sm">
            نظرات
          </Link>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <LumaSpin />
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">تصویری نیست.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((img) => (
            <article
              key={img.id}
              className="border-border bg-card overflow-hidden rounded-2xl border"
            >
              <div className="relative aspect-square bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt_text || "review"}
                  className="h-full w-full object-cover"
                />
                <label className="absolute top-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                  <input
                    type="checkbox"
                    className="ml-1"
                    checked={selected.includes(img.id)}
                    onChange={() => toggle(img.id)}
                  />
                  انتخاب
                </label>
              </div>
              <div className="space-y-2 p-3 text-sm">
                <p className="font-medium">{img.product_name || "محصول"}</p>
                <p className="text-muted-foreground text-xs">
                  {img.user_name || "کاربر"} ·{" "}
                  {img.rating != null ? `${"★".repeat(img.rating)}` : "—"} ·{" "}
                  {img.review_approved ? "تأییدشده" : "در انتظار"}
                </p>
                {img.review_title || img.review_body ? (
                  <p className="text-muted-foreground line-clamp-3 text-xs">
                    {img.review_title ? `${img.review_title} — ` : ""}
                    {img.review_body}
                  </p>
                ) : null}
                <p className="text-muted-foreground text-[11px]">
                  {formatJalaliDateTime(img.created_at)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {img.review_id ? (
                    img.review_approved ? (
                      <button
                        type="button"
                        disabled={busy}
                        className="text-amber-600 text-xs hover:underline"
                        onClick={() => void approveReview(img.review_id, false)}
                      >
                        لغو تأیید نظر
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        className="text-emerald-600 text-xs hover:underline"
                        onClick={() => void approveReview(img.review_id, true)}
                      >
                        تأیید نظر
                      </button>
                    )
                  ) : null}
                  <button
                    type="button"
                    disabled={busy}
                    className="text-destructive text-xs hover:underline"
                    onClick={async () => {
                      if (!confirm("حذف این تصویر؟")) return;
                      setBusy(true);
                      const res = await adminDeleteReviewImagesAction([img.id]);
                      setBusy(false);
                      if (!res.ok) {
                        setError("حذف ناموفق");
                        return;
                      }
                      void load();
                    }}
                  >
                    حذف تصویر
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
