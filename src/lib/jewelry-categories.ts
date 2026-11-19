/** دسته‌بندی‌های فروشگاه — همان شکل قبلی، مقادیر آرایشی و بهداشتی */
export const JEWELRY_CATEGORIES = [
  { name: "مراقبت پوست", slug: "مراقبت-پوست", icon: "default" },
  { name: "آرایش", slug: "آرایش", icon: "default" },
  { name: "مو", slug: "مو", icon: "default" },
  { name: "بدن", slug: "بدن", icon: "default" },
  { name: "عطر", slug: "عطر", icon: "default" },
  { name: "بهداشت", slug: "بهداشت", icon: "default" },
] as const;

/** نوع پوست — fallback وقتی کاتالوگ خالی است */
export const JEWELRY_MATERIALS = [
  { name: "خشک", slug: "dry" },
  { name: "چرب", slug: "oily" },
  { name: "مختلط", slug: "combination" },
  { name: "معمولی", slug: "normal" },
  { name: "حساس", slug: "sensitive" },
] as const;

export const JEWELRY_COLORS = [
  { name: "نود", slug: "nude", hex: "#E6C2A6" },
  { name: "صورتی", slug: "pink", hex: "#E7A6B5" },
  { name: "قرمز", slug: "red", hex: "#C23B3B" },
  { name: "قهوه‌ای", slug: "brown", hex: "#6B3E2E" },
  { name: "شفاف", slug: "clear", hex: "#F5F5F5" },
] as const;
